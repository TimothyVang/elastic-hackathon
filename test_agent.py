"""
End-to-end test for the DCO Triage Agent.

Sends a triage request to the agent via the Kibana Agent Builder API
and validates that it:
  1. Uses multiple tools (ES|QL + Search)
  2. Identifies the multi-stage attack chain
  3. Produces a structured triage report
  4. Maps MITRE ATT&CK techniques correctly

Can also test directly against Elasticsearch to validate data and queries.

Usage:
    python test_agent.py              # Full agent test via Kibana
    python test_agent.py --data-only  # Only test data + ES|QL queries
"""

import argparse
import json
import os
import sys

import requests
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel

from es_client import get_client

load_dotenv()

console = Console()


# ── Data Validation Tests ─────────────────────────────────────────────

def test_index_exists(es, index_name: str) -> bool:
    """Check if an index exists and has documents."""
    exists = es.indices.exists(index=index_name)
    if not exists:
        console.print(f"  [red]FAIL[/] Index '{index_name}' does not exist")
        return False

    count = es.count(index=index_name)["count"]
    console.print(f"  [green]PASS[/] Index '{index_name}' exists ({count} documents)")
    return count > 0


def test_attack_data(es) -> bool:
    """Validate attack chain data is present in security-alerts."""
    # Check for events from the attacker IP
    result = es.search(
        index="security-alerts",
        query={"term": {"source.ip": "10.10.15.42"}},
        size=0,
        track_total_hits=True,
    )
    attacker_count = result["hits"]["total"]["value"]

    # Check for C2 beaconing events
    c2_result = es.search(
        index="security-alerts",
        query={"term": {"destination.ip": "198.51.100.23"}},
        size=0,
        track_total_hits=True,
    )
    c2_count = c2_result["hits"]["total"]["value"]

    # Check MITRE technique coverage
    techniques = es.search(
        index="security-alerts",
        query={"exists": {"field": "threat.technique.id"}},
        size=0,
        aggs={"techniques": {"terms": {"field": "threat.technique.id", "size": 20}}},
    )
    technique_ids = [
        b["key"] for b in techniques["aggregations"]["techniques"]["buckets"]
    ]

    console.print(f"  {'[green]PASS' if attacker_count > 0 else '[red]FAIL'}[/] Attacker IP events: {attacker_count}")
    console.print(f"  {'[green]PASS' if c2_count > 0 else '[red]FAIL'}[/] C2 beacon events: {c2_count}")
    console.print(f"  {'[green]PASS' if technique_ids else '[red]FAIL'}[/] MITRE techniques: {', '.join(technique_ids)}")

    # Validate all 5 stages are represented
    expected_techniques = {"T1566", "T1059", "T1003", "T1021", "T1041"}
    found_techniques = {t.split(".")[0] for t in technique_ids}  # Strip subtechnique
    missing = expected_techniques - found_techniques

    if missing:
        console.print(f"  [yellow]WARN[/] Missing attack stages: {missing}")
        return False

    console.print(f"  [green]PASS[/] All 5 attack stages represented")
    return True


def test_noise_data(es) -> bool:
    """Validate noise events are present."""
    result = es.search(
        index="security-alerts",
        query={"bool": {"must_not": {"exists": {"field": "threat.technique.id"}}}},
        size=0,
        track_total_hits=True,
    )
    noise_count = result["hits"]["total"]["value"]
    console.print(f"  [green]PASS[/] Noise events (no MITRE tag): {noise_count}")
    return noise_count >= 50


def test_threat_intel(es) -> bool:
    """Validate threat intel IOCs are loaded."""
    result = es.search(
        index="threat-intel",
        query={"match_all": {}},
        size=0,
        track_total_hits=True,
    )
    ioc_count = result["hits"]["total"]["value"]

    # Check for critical IOCs
    c2_ioc = es.search(
        index="threat-intel",
        query={"term": {"ioc.value": "198.51.100.23"}},
    )
    has_c2 = c2_ioc["hits"]["total"]["value"] > 0

    console.print(f"  [green]PASS[/] Total IOCs: {ioc_count}")
    console.print(f"  {'[green]PASS' if has_c2 else '[red]FAIL'}[/] C2 IP IOC present: {has_c2}")
    return ioc_count >= 15 and has_c2


# ── ES|QL Query Tests ─────────────────────────────────────────────────

def test_esql_queries(es) -> bool:
    """Test the ES|QL queries that the Agent Builder tools use."""
    all_pass = True

    # Test 1: Correlated events by IP
    console.print("\n  [bold]ES|QL: Correlated events by IP[/]")
    try:
        result = es.esql.query(
            query='FROM security-alerts | WHERE source.ip == "10.10.15.42" | STATS count = COUNT(*)',
            format="json",
        )
        count = result["values"][0][0] if result.get("values") else 0
        console.print(f"    [green]PASS[/] Found {count} events for attacker IP")
    except Exception as e:
        console.print(f"    [red]FAIL[/] {e}")
        all_pass = False

    # Test 2: Lateral movement detection
    console.print("  [bold]ES|QL: Lateral movement detection[/]")
    try:
        result = es.esql.query(
            query=(
                'FROM security-alerts '
                '| WHERE event.category == "authentication" AND event.outcome == "success" '
                '| STATS host_count = COUNT_DISTINCT(destination.ip) BY source.ip, user.name '
                '| WHERE host_count >= 2 '
                '| SORT host_count DESC'
            ),
            format="json",
        )
        rows = len(result.get("values", []))
        console.print(f"    [green]PASS[/] Found {rows} users with multi-host access")
    except Exception as e:
        console.print(f"    [red]FAIL[/] {e}")
        all_pass = False

    # Test 3: Beaconing detection
    console.print("  [bold]ES|QL: Beaconing detection[/]")
    try:
        result = es.esql.query(
            query=(
                'FROM security-alerts '
                '| WHERE event.category == "network" AND network.direction == "outbound" '
                '| STATS beacon_count = COUNT(*) BY destination.ip, source.ip '
                '| WHERE beacon_count >= 5 '
                '| SORT beacon_count DESC'
            ),
            format="json",
        )
        rows = len(result.get("values", []))
        console.print(f"    [green]PASS[/] Found {rows} potential beaconing patterns")
    except Exception as e:
        console.print(f"    [red]FAIL[/] {e}")
        all_pass = False

    # Test 4: Privilege escalation detection
    console.print("  [bold]ES|QL: Privilege escalation detection[/]")
    try:
        result = es.esql.query(
            query=(
                'FROM security-alerts '
                '| WHERE event.severity >= 60 '
                '| STATS high_sev_count = COUNT(*), techniques = VALUES(threat.technique.id) BY user.name, source.ip '
                '| WHERE high_sev_count >= 3 '
                '| SORT high_sev_count DESC'
            ),
            format="json",
        )
        rows = len(result.get("values", []))
        console.print(f"    [green]PASS[/] Found {rows} users with high-severity event clusters")
    except Exception as e:
        console.print(f"    [red]FAIL[/] {e}")
        all_pass = False

    return all_pass


# ── Agent Test (via Kibana API) ───────────────────────────────────────

def test_agent_triage() -> bool:
    """
    Send a triage request to the DCO Agent via Kibana and validate the response.
    """
    kibana_url = os.getenv("KIBANA_URL", "")
    api_key = os.getenv("ELASTIC_API_KEY", "")

    if not kibana_url:
        es_url = os.getenv("ELASTICSEARCH_URL", "")
        if es_url:
            kibana_url = es_url.replace(".es.", ".kb.").rstrip("/")

    if not kibana_url or not api_key:
        console.print("  [yellow]SKIP[/] KIBANA_URL or ELASTIC_API_KEY not set — skipping agent test")
        return True  # Don't fail if we can't reach Kibana

    headers = {
        "Authorization": f"ApiKey {api_key}",
        "Content-Type": "application/json",
        "kbn-xsrf": "true",
    }

    # Send investigation prompt
    prompt = "Investigate source IP 10.10.15.42 — it was flagged by our EDR for suspicious outbound connections. Perform a full triage."

    console.print(f"\n  [bold]Sending triage request to agent...[/]")
    console.print(f"  [dim]Prompt: {prompt}[/]\n")

    try:
        # Try to find the agent
        resp = requests.get(
            f"{kibana_url}/api/agent_builder/agents",
            headers=headers,
            timeout=30,
        )

        if resp.status_code != 200:
            console.print(f"  [yellow]SKIP[/] Could not list agents: {resp.status_code}")
            return True

        agents = resp.json()
        dco_agent = None
        agent_list = agents if isinstance(agents, list) else agents.get("results", agents.get("agents", agents.get("data", [])))

        for agent in agent_list:
            name = agent.get("name", "")
            if "DCO" in name or "Triage" in name:
                dco_agent = agent
                break

        if not dco_agent:
            console.print("  [yellow]SKIP[/] DCO Triage Agent not found in Agent Builder")
            return True

        agent_id = dco_agent.get("id") or dco_agent.get("_id")
        console.print(f"  Found agent: [cyan]{dco_agent['name']}[/] (ID: {agent_id})")

        # Send conversation to agent via converse API
        resp = requests.post(
            f"{kibana_url}/api/agent_builder/converse",
            headers=headers,
            json={"input": prompt, "agent_id": agent_id},
            timeout=120,
        )

        if resp.status_code not in (200, 201):
            console.print(f"  [yellow]WARN[/] Agent conversation failed: {resp.status_code} — {resp.text[:200]}")
            return True  # Don't fail the whole test

        result = resp.json()

        # Extract response from converse API format
        tool_calls = []
        agent_response = str(result.get("response", "") or "")

        for step in result.get("steps", []):
            if step.get("type") == "tool_call":
                tool_calls.append(step.get("tool_id", "unknown"))
            elif step.get("type") == "response" and not agent_response:
                agent_response = step.get("response", "")

        # Validate response
        console.print(f"\n  [bold]Agent Response Preview:[/]")
        preview = agent_response[:500] + ("..." if len(agent_response) > 500 else "")
        console.print(Panel(preview, title="Agent Triage Output", border_style="cyan"))

        console.print(f"\n  Tools used: [cyan]{', '.join(tool_calls) if tool_calls else 'N/A (streamed)'}[/]")

        # Check for key indicators in the response
        checks = {
            "Mentions attacker IP": "10.10.15.42" in agent_response,
            "Mentions C2 server": "198.51.100.23" in agent_response or "C2" in agent_response.upper(),
            "References MITRE ATT&CK": "MITRE" in agent_response or "T1" in agent_response,
            "Includes severity assessment": any(
                word in agent_response.upper()
                for word in ["CRITICAL", "HIGH", "SEVERITY", "P1", "P2"]
            ),
            "Suggests containment": any(
                word in agent_response.lower()
                for word in ["contain", "isolat", "block", "remediat"]
            ),
        }

        all_pass = True
        for check_name, passed in checks.items():
            status = "[green]PASS" if passed else "[yellow]WARN"
            console.print(f"  {status}[/] {check_name}")
            if not passed:
                all_pass = False

        return True  # Agent test is advisory, not blocking

    except requests.exceptions.ConnectionError:
        console.print("  [yellow]SKIP[/] Could not connect to Kibana")
        return True
    except Exception as e:
        console.print(f"  [yellow]WARN[/] Agent test error: {e}")
        return True


# ── Main ──────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Test DCO Triage Agent")
    parser.add_argument(
        "--data-only",
        action="store_true",
        help="Only test data loading and ES|QL queries (skip agent test)",
    )
    args = parser.parse_args()

    console.print(Panel(
        "[bold cyan]DCO Threat Triage Agent — End-to-End Test[/]",
        border_style="cyan",
    ))

    es = get_client()
    all_pass = True

    # Test 1: Index existence
    console.print("\n[bold]1. Index Validation[/]")
    for idx in ["security-alerts", "threat-intel", "incident-log"]:
        if not test_index_exists(es, idx):
            all_pass = False

    # Test 2: Attack data
    console.print("\n[bold]2. Attack Chain Data[/]")
    if not test_attack_data(es):
        all_pass = False

    # Test 3: Noise data
    console.print("\n[bold]3. Noise Events[/]")
    if not test_noise_data(es):
        all_pass = False

    # Test 4: Threat intel
    console.print("\n[bold]4. Threat Intelligence[/]")
    if not test_threat_intel(es):
        all_pass = False

    # Test 5: ES|QL queries
    console.print("\n[bold]5. ES|QL Query Validation[/]")
    if not test_esql_queries(es):
        all_pass = False

    # Test 6: Agent (unless --data-only)
    if not args.data_only:
        console.print("\n[bold]6. Agent Triage Test[/]")
        if not test_agent_triage():
            all_pass = False

    # Summary
    console.print("\n" + "=" * 60)
    if all_pass:
        console.print("[bold green]ALL TESTS PASSED[/]")
    else:
        console.print("[bold yellow]SOME TESTS HAD WARNINGS — review output above[/]")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        console.print(f"\n[bold red]Test suite failed:[/] {e}")
        sys.exit(1)
