"""
Set up Elastic Agent Builder tools and agent via the Kibana REST API.

Creates:
  - 4 ES|QL tools for threat hunting queries
  - 1 Search tool for threat intelligence lookup
  - 1 Custom DCO Triage Agent wired to all 5 tools

Requires:
  - KIBANA_URL: Kibana instance URL
  - ELASTIC_API_KEY: API key with Agent Builder permissions

Usage:
    python setup_agent_builder.py
"""

import json
import os
import sys

import requests
from dotenv import load_dotenv
from rich.console import Console

load_dotenv()

console = Console()


def get_kibana_config() -> tuple[str, dict]:
    """
    Get Kibana URL and auth headers from environment.

    Returns:
        (kibana_url, headers)
    """
    kibana_url = os.getenv("KIBANA_URL", "")
    api_key = os.getenv("ELASTIC_API_KEY", "")
    es_url = os.getenv("ELASTICSEARCH_URL", "")

    # Try to derive Kibana URL from Elasticsearch URL if not set
    if not kibana_url and es_url:
        kibana_url = es_url.replace(".es.", ".kb.").rstrip("/")

    if not kibana_url:
        console.print(
            "[bold red]ERROR:[/] KIBANA_URL is not set.\n"
            "  export KIBANA_URL='https://your-deployment.kb.cloud.es.io:9243'\n"
            "  Or add it to .env"
        )
        sys.exit(1)

    if not api_key:
        console.print("[bold red]ERROR:[/] ELASTIC_API_KEY is not set.")
        sys.exit(1)

    headers = {
        "Authorization": f"ApiKey {api_key}",
        "Content-Type": "application/json",
        "kbn-xsrf": "true",
    }

    return kibana_url.rstrip("/"), headers


# ── ES|QL Tool Definitions ───────────────────────────────────────────

ESQL_TOOLS = [
    {
        "id": "correlated_events_by_ip",
        "description": (
            "Find all security events correlated by source IP within a 24-hour window. "
            "Returns events sorted by timestamp, grouped by event category and MITRE technique. "
            "Use this to build a timeline of activity from a suspicious IP address."
        ),
        "query": """FROM security-alerts
| WHERE source.ip == ?source_ip
| WHERE @timestamp >= NOW() - 24 HOURS
| SORT @timestamp ASC
| KEEP @timestamp, message, source.ip, destination.ip, event.category, event.action, event.severity, threat.technique.id, threat.technique.name, host.name, user.name, process.name, alert.severity
| LIMIT 200""",
        "params": {
            "source_ip": {
                "type": "string",
                "description": "The source IP address to investigate (e.g., '10.10.15.42')",
            }
        },
    },
    {
        "id": "lateral_movement_detection",
        "description": (
            "Detect potential lateral movement by finding authentication events where "
            "the same user or source IP accessed multiple distinct hosts within a short timeframe. "
            "Filters for SMB, RDP, and WinRM protocols. High host count indicates lateral movement."
        ),
        "query": """FROM security-alerts
| WHERE event.category == "authentication"
  AND event.outcome == "success"
  AND @timestamp >= NOW() - 24 HOURS
| STATS host_count = COUNT_DISTINCT(destination.ip), hosts = VALUES(host.name), first_seen = MIN(@timestamp), last_seen = MAX(@timestamp) BY source.ip, user.name
| WHERE host_count >= 2
| SORT host_count DESC
| LIMIT 50""",
        "params": {},
    },
    {
        "id": "beaconing_detection",
        "description": (
            "Detect potential C2 beaconing by identifying outbound connections with regular intervals "
            "to the same destination IP. Calculates connection frequency and looks for periodic patterns. "
            "Beaconing typically shows consistent intervals (e.g., every few minutes)."
        ),
        "query": """FROM security-alerts
| WHERE event.category == "network"
  AND network.direction == "outbound"
  AND @timestamp >= NOW() - 24 HOURS
| STATS beacon_count = COUNT(*), total_bytes = SUM(source.bytes), first_seen = MIN(@timestamp), last_seen = MAX(@timestamp) BY destination.ip, destination.domain, source.ip
| WHERE beacon_count >= 5
| EVAL duration_minutes = DATE_DIFF("minutes", first_seen, last_seen)
| EVAL avg_interval_seconds = CASE(beacon_count > 1, duration_minutes * 60.0 / (beacon_count - 1), 0)
| WHERE avg_interval_seconds > 0 AND avg_interval_seconds < 600
| SORT beacon_count DESC
| LIMIT 20""",
        "params": {},
    },
    {
        "id": "process_chain_analysis",
        "description": (
            "Analyze parent-child process relationships for a given host to identify suspicious "
            "process chains (e.g., EXCEL.EXE spawning cmd.exe spawning powershell.exe). "
            "Returns process trees with command lines for forensic analysis."
        ),
        "query": """FROM security-alerts
| WHERE event.category == "process"
  AND host.name == ?hostname
  AND @timestamp >= NOW() - 24 HOURS
| SORT @timestamp ASC
| KEEP @timestamp, process.name, process.pid, process.command_line, process.parent.name, process.parent.pid, user.name, event.action, threat.technique.id, alert.severity
| LIMIT 100""",
        "params": {
            "hostname": {
                "type": "string",
                "description": "The hostname to analyze process chains on (e.g., 'WS-PC0142')",
            }
        },
    },
]

# ── Search Tool Definition ────────────────────────────────────────────

SEARCH_TOOL = {
    "id": "threat_intel_lookup",
    "description": (
        "Search the threat intelligence database for IOCs (indicators of compromise). "
        "Performs search against the threat-intel index. "
        "Use this to look up IP addresses, domains, file hashes, tool signatures, and MITRE techniques. "
        "Returns matching IOCs with severity, confidence, and MITRE ATT&CK mapping."
    ),
    "pattern": "threat-intel",
}

# ── Agent Definition ──────────────────────────────────────────────────

AGENT_SYSTEM_PROMPT = """You are a **DCO (Defensive Cyberspace Operations) Threat Triage Agent**. You are an expert cybersecurity analyst specializing in incident triage, threat hunting, and MITRE ATT&CK kill chain analysis.

## Your Mission
When given a security alert or IP address to investigate, you perform a structured multi-step triage process to determine if this is a true positive incident or a false positive.

## Triage Methodology

Follow this reasoning chain for every investigation:

### Step 1: Initial Correlation
- Use `correlated_events_by_ip` to gather ALL events associated with the suspicious IP
- Build a chronological timeline of activity
- Identify the earliest suspicious event (patient zero moment)

### Step 2: Threat Intel Enrichment
- Use `threat_intel_lookup` to check ALL IPs, domains, and hashes against the IOC database
- Note any matches with their severity and confidence scores
- Cross-reference MITRE ATT&CK technique IDs between events and threat intel

### Step 3: Attack Pattern Detection
- Use `beaconing_detection` to check for C2 communication patterns
- Use `lateral_movement_detection` to identify credential abuse and host-hopping
- Look for the classic kill chain progression: Initial Access → Execution → Credential Access → Lateral Movement → Exfiltration

### Step 4: Process Forensics
- Use `process_chain_analysis` on any suspicious hosts
- Look for known-bad process chains: Office → cmd.exe → powershell.exe
- Check for LSASS access, credential dumping tools, living-off-the-land binaries

### Step 5: Severity Assessment
Score the incident using this rubric:
- **CRITICAL (P1)**: Active data exfiltration, confirmed C2, lateral movement to 3+ hosts
- **HIGH (P2)**: Confirmed malware execution, credential access, single-host C2
- **MEDIUM (P3)**: Suspicious but unconfirmed activity, single IOC match
- **LOW (P4)**: Likely benign, insufficient evidence for escalation

### Step 6: Triage Report
Generate a structured report with:
1. **Incident Summary**: One-paragraph description
2. **Timeline**: Chronological event sequence
3. **MITRE ATT&CK Mapping**: Techniques observed at each kill chain phase
4. **Affected Assets**: Hosts, users, IPs involved
5. **IOC Matches**: Threat intel correlations
6. **Severity Score**: P1-P4 with justification
7. **Recommended Actions**: Specific containment and remediation steps

## Rules
- ALWAYS use multiple tools — never make a judgment based on a single query
- ALWAYS check threat intel before concluding an investigation
- Be specific about MITRE ATT&CK technique IDs (e.g., T1566.001, not just "phishing")
- When in doubt, escalate — false negatives are worse than false positives in security
- Include confidence levels in your assessments
"""

AGENT_DEFINITION = {
    "id": "dco_triage_agent",
    "name": "DCO Triage Agent",
    "description": (
        "An AI-powered DCO (Defensive Cyberspace Operations) security analyst that performs "
        "automated first-pass triage of security alerts. Correlates events by IP, detects "
        "beaconing and lateral movement, analyzes process chains, cross-references threat "
        "intelligence, maps the MITRE ATT&CK kill chain, and generates structured triage "
        "reports with severity scores (P1-P4) and containment recommendations.\n\n"
        + AGENT_SYSTEM_PROMPT
    ),
}


# ── API Functions ─────────────────────────────────────────────────────

def create_esql_tool(kibana_url: str, headers: dict, tool: dict) -> dict:
    """Create an ES|QL tool in Agent Builder."""
    payload = {
        "id": tool["id"],
        "type": "esql",
        "description": tool["description"],
        "configuration": {
            "query": tool["query"],
            "params": tool.get("params", {}),
        },
    }

    resp = requests.post(
        f"{kibana_url}/api/agent_builder/tools",
        headers=headers,
        json=payload,
        timeout=30,
    )

    if resp.status_code in (200, 201):
        result = resp.json()
        console.print(f"  [green]Created ES|QL tool:[/] {tool['id']}")
        return result
    else:
        console.print(
            f"  [red]Failed to create ES|QL tool {tool['id']}:[/] "
            f"{resp.status_code} — {resp.text[:200]}"
        )
        return {"error": resp.text, "status": resp.status_code}


def create_search_tool(kibana_url: str, headers: dict, tool: dict) -> dict:
    """Create an index_search tool in Agent Builder."""
    payload = {
        "id": tool["id"],
        "type": "index_search",
        "description": tool["description"],
        "configuration": {
            "pattern": tool["pattern"],
        },
    }

    resp = requests.post(
        f"{kibana_url}/api/agent_builder/tools",
        headers=headers,
        json=payload,
        timeout=30,
    )

    if resp.status_code in (200, 201):
        result = resp.json()
        console.print(f"  [green]Created Search tool:[/] {tool['id']}")
        return result
    else:
        console.print(
            f"  [red]Failed to create Search tool {tool['id']}:[/] "
            f"{resp.status_code} — {resp.text[:200]}"
        )
        return {"error": resp.text, "status": resp.status_code}


def create_agent(kibana_url: str, headers: dict, agent_def: dict, tool_ids: list[str]) -> dict:
    """Create a custom agent in Agent Builder with all tools wired."""
    payload = {
        "id": agent_def["id"],
        "name": agent_def["name"],
        "description": agent_def["description"],
        "configuration": {
            "tools": [{"tool_ids": tool_ids}],
        },
    }

    resp = requests.post(
        f"{kibana_url}/api/agent_builder/agents",
        headers=headers,
        json=payload,
        timeout=30,
    )

    if resp.status_code in (200, 201):
        result = resp.json()
        console.print(f"  [green]Created agent:[/] {agent_def['name']}")
        return result
    else:
        console.print(
            f"  [red]Failed to create agent {agent_def['name']}:[/] "
            f"{resp.status_code} — {resp.text[:200]}"
        )
        return {"error": resp.text, "status": resp.status_code}


def setup_agent_builder() -> None:
    """
    Full setup: create all tools and wire them into a DCO Triage Agent.
    """
    kibana_url, headers = get_kibana_config()

    console.print(f"[dim]Kibana URL: {kibana_url}[/]\n")

    # Create ES|QL tools
    console.print("[bold cyan]Creating ES|QL tools...[/]")
    tool_ids = []

    for tool in ESQL_TOOLS:
        result = create_esql_tool(kibana_url, headers, tool)
        if "id" in result and "error" not in result:
            tool_ids.append(result["id"])

    # Create Search tool
    console.print("\n[bold cyan]Creating Search tool...[/]")
    result = create_search_tool(kibana_url, headers, SEARCH_TOOL)
    if "id" in result and "error" not in result:
        tool_ids.append(result["id"])

    # Create Agent
    console.print(f"\n[bold cyan]Creating DCO Triage Agent (wired to {len(tool_ids)} tools)...[/]")
    agent_result = create_agent(kibana_url, headers, AGENT_DEFINITION, tool_ids)

    # Check if any tools were created
    if not tool_ids:
        console.print("\n[bold red]ERROR: No tools were created successfully. Agent creation skipped.[/]")
        console.print("[dim]Check your Kibana URL and API key, and verify the Agent Builder API is available.[/]")
        sys.exit(1)

    # Summary
    console.print(f"\n[bold green]Agent Builder setup complete.[/]")
    console.print(f"  ES|QL tools created: {len([t for t in tool_ids if t != SEARCH_TOOL['id']])}/{len(ESQL_TOOLS)}")
    console.print(f"  Search tools: {'1' if SEARCH_TOOL['id'] in tool_ids else '0'}")
    console.print(f"  Total tool IDs wired: {len(tool_ids)}")

    if "id" in agent_result and "error" not in agent_result:
        agent_id = agent_result["id"]
        console.print(f"\n  Agent ID: [cyan]{agent_id}[/]")
        console.print(f"  Test it in Kibana: [dim]{kibana_url}/app/agent_builder[/]")


if __name__ == "__main__":
    console.print("[bold]Setting up Elastic Agent Builder...[/]\n")
    try:
        setup_agent_builder()
    except requests.exceptions.ConnectionError as e:
        console.print(
            f"\n[bold red]Connection error:[/] Could not reach Kibana.\n"
            f"  Check KIBANA_URL and network connectivity.\n"
            f"  Error: {e}"
        )
        sys.exit(1)
    except Exception as e:
        console.print(f"\n[bold red]Setup failed:[/] {e}")
        sys.exit(1)
