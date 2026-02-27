# DCO Threat Triage Agent

> **Elasticsearch Agent Builder Hackathon Submission**
> 30-minute manual triage. 30-second AI analysis. Same analyst-grade results.

**DCO Threat Triage Agent** is an autonomous AI agent built entirely with **Elastic Agent Builder** that performs first-pass security alert triage — correlating events with ES|QL, hunting for attack patterns, and cross-referencing MITRE ATT&CK-mapped threat intelligence — so SOC analysts can focus on confirmed threats instead of drowning in noise.

**[Live Dashboard](https://frontend-drab-xi-56.vercel.app/dashboard)** | **[Devpost Submission](https://devpost.com/software/soc-agent-7z80jq)**

<!-- TODO: Add social post link once published — earns 10% Social Engagement score -->
<!-- **[Social Post](YOUR_LINK_HERE)** *(shared with @elastic)* -->

### Key Results

- **Risk Score 95/100** — correctly identifies a Critical / True Positive APT intrusion
- **16 autonomous reasoning steps** across 7 tools in under 2 minutes
- **5-stage MITRE ATT&CK kill chain** fully mapped (T1566 → T1059 → T1003 → T1021 → T1041)
- **3 Elastic tool types** used: ES|QL, Index Search, and Workflow

---

## Demo

<p align="center">
  <img src="demo.gif" alt="DCO Threat Triage Agent — Full Demo" width="800" />
</p>

**[Watch on YouTube](https://www.youtube.com/watch?v=yT__GtmewE8)**

---

## Problem

**68% of SOC analysts report alert fatigue** (Panther Labs, 2024). Security teams receive thousands of alerts every day. Each one demands the same manual workflow: correlate related events, look up threat intelligence, trace process chains, assess severity, and decide what to escalate. Most alerts turn out to be false positives — but the one that isn't can mean a breach. When analysts are buried in noise, real attacks slip through. The problem is not detection. It is triage at scale.

## Solution

**DCO Threat Triage Agent** automates the entire first-pass triage workflow using **seven purpose-built tools** orchestrated by Elastic Agent Builder:

1. **Event Correlation** (ES|QL) — Links related alerts by source IP, timeframe, and host across the full event timeline
2. **Beaconing Detection** (ES|QL) — Identifies periodic C2 callback patterns using time-bucketed aggregation
3. **Lateral Movement Detection** (ES|QL) — Traces credential use and SMB connections across multiple hosts
4. **Process Chain Analysis** (ES|QL) — Reconstructs parent-child process trees to reveal execution chains
5. **Privilege Escalation Detection** (ES|QL) — Detects suspicious privilege changes and token manipulation across hosts
6. **Threat Intel Lookup** (Search) — Cross-references IOCs against a MITRE ATT&CK-mapped database using hybrid semantic + keyword search
7. **Incident Workflow** (Workflow) — Automatically logs triage results, severity scores, and containment recommendations to the incident log

The agent chains these tools in a **6-step reasoning loop** (Correlate, Enrich, Detect, Forensic Analysis, Score, Report), then generates a structured triage report with MITRE ATT&CK kill chain mapping, severity scoring, and specific containment recommendations.

To prove it works, we built a realistic simulated environment: a **5-stage attack chain** (phishing, PowerShell C2, credential dumping, lateral movement, data exfiltration) buried in **80+ benign noise events**. The agent finds the needle in the haystack — every time.

---

## Architecture

```
Frontend (Next.js) → Agent Builder Converse API → DCO Triage Agent
                                                        ↓
                                              7 Custom Tools
                                     ┌──────────┼──────────┐
                              5 ES|QL tools   1 Search    1 Workflow
                                     ↓           ↓          ↓
                              security-alerts  threat-intel  incident-log
                              (105 events)     (18 IOCs)    (incidents)
```

```
┌──────────────────────────────────────────────────────────────┐
│                    Elastic Agent Builder                       │
│                                                               │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  ES|QL Tools (5) │  │ Search Tool  │  │ Workflow Tool  │  │
│  │                  │  │              │  │                │  │
│  │ • Correlation    │  │ • IOC Lookup │  │ • Incident     │  │
│  │ • Beaconing      │  │   (Hybrid    │  │   Logging &    │  │
│  │ • Lateral Move   │  │   Semantic + │  │   Severity     │  │
│  │ • Process Chain  │  │   Keyword)   │  │   Scoring      │  │
│  │ • Priv Escalation│  │              │  │                │  │
│  └────────┬─────────┘  └──────┬───────┘  └───────┬────────┘  │
│           │                   │                   │           │
│           └───────────────────┼───────────────────┘           │
│                               │                               │
│                  ┌────────────▼────────────┐                  │
│                  │      Agent Brain        │                  │
│                  │  6-Step Reasoning Chain: │                  │
│                  │  Correlate → Enrich →   │                  │
│                  │  Detect → Forensic →    │                  │
│                  │  Score → Report         │                  │
│                  └─────────────────────────┘                  │
└──────────────────────────────────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
   ┌─────────────────┐ ┌─────────────┐ ┌──────────────────┐
   │  security-alerts │ │ threat-intel │ │  incident-log    │
   │  (~105 events)   │ │  (18 IOCs)   │ │  (triage reports)│
   │   ECS-mapped     │ │ MITRE ATT&CK │ │  auto-generated  │
   └─────────────────┘ └─────────────┘ └──────────────────┘
```

<p align="center">
  <img src="screenshots/gallery/06-architecture.png" alt="Architecture Diagram — Data Flow from Frontend through Agent Builder to Elasticsearch" width="800" />
</p>

### Tech Stack

| Component | Technology |
|---|---|
| Agent Platform | Elastic Agent Builder |
| Data Store | Elasticsearch (Cloud Serverless) |
| Query Language | ES\|QL |
| Search | Hybrid / Semantic Search |
| Threat Framework | MITRE ATT&CK |
| Dashboard | Next.js 14 + TypeScript + Tailwind CSS |
| Charts | Recharts |
| Languages | Python 3.11+, TypeScript 5.7 |

---

## Agent Builder in Kibana

The agent and all 7 tools are deployed in Elastic Agent Builder and accessible via the Kibana UI:

<p align="center">
  <img src="screenshots/gallery/13-kibana-tools.png" alt="Agent Builder — 7 Tools Wired to DCO Agent" width="800" />
</p>

<p align="center">
  <img src="screenshots/gallery/14-kibana-chat.png" alt="Agent Builder — Chat Interface Ready" width="800" />
</p>

### Example: Beaconing Detection (ES|QL)

Each ES|QL tool exposes parameterized queries as agent capabilities. Here's the beaconing detection tool that finds C2 callback patterns:

```sql
FROM security-alerts
| WHERE event.category == "network"
| WHERE destination.ip IS NOT NULL
| STATS beacon_count = COUNT(*),
        first_seen = MIN(@timestamp),
        last_seen = MAX(@timestamp),
        total_bytes = SUM(network.bytes)
    BY source.ip, destination.ip, destination.domain
| WHERE beacon_count >= 10
| EVAL duration_minutes = DATE_DIFF("minutes", first_seen, last_seen)
| WHERE duration_minutes > 0
| EVAL avg_interval_seconds = duration_minutes * 60.0 / (beacon_count - 1)
| WHERE avg_interval_seconds < 600
| SORT beacon_count DESC
| LIMIT 50
```

This detected the C2 server at `198.51.100.23` receiving beacons every ~345 seconds — a pattern invisible in raw alert data but unmistakable in aggregation.

---

## Dashboard

The real-time security operations dashboard shows alert statistics, severity distribution, event timeline, and MITRE ATT&CK kill chain visualization — all querying live Elasticsearch data.

<p align="center">
  <img src="screenshots/gallery/01-dashboard.png" alt="Dashboard — Stats, Kill Chain, Timeline" width="800" />
</p>
<p align="center">
  <img src="screenshots/gallery/05-kill-chain.png" alt="MITRE ATT&CK Kill Chain — 5-Stage Attack Visualization" width="800" />
</p>

---

## Threat Hunting

Four specialized hunt views powered by ES|QL queries, each mirroring an agent tool:

<p align="center">
  <img src="screenshots/gallery/08-hunt-landing.png" alt="Hunt Hub — Four ES|QL-Powered Threat Hunting Views" width="800" />
</p>

| Hunt Page | Agent Tool | Finding |
|-----------|-----------|---------|
| **Event Correlation** | `correlated_events_by_ip` | 96 events from `10.10.15.42` — full kill chain from T1566 → T1041 |
| **Beaconing Detection** | `beaconing_detection` | 66 beacons to `198.51.100.23` at ~2155s intervals, 735 MB transferred |
| **Lateral Movement** | `lateral_movement_detection` | `admin_svc` across 3 hosts (DC01, FILE01, DB01) — HIGH risk |
| **Process Chain** | `process_chain_analysis` | EXCEL.EXE → cmd.exe → powershell.exe → rundll32.exe (LSASS dump) |

<p align="center">
  <img src="screenshots/gallery/10-hunt-correlate.png" alt="Hunt — IP Event Correlation" width="800" />
</p>
<p align="center">
  <img src="screenshots/gallery/09-hunt-beaconing.png" alt="Hunt — C2 Beaconing Detection" width="800" />
</p>
<p align="center">
  <img src="screenshots/gallery/11-hunt-lateral.png" alt="Hunt — Lateral Movement Detection" width="800" />
</p>
<p align="center">
  <img src="screenshots/gallery/12-hunt-process.png" alt="Hunt — Process Chain Analysis" width="800" />
</p>

---

## Alerts & Threat Intel

The **Alerts** page shows all 105 security events — a 5-stage MITRE ATT&CK kill chain buried in 80+ benign noise events. This is the needle-in-a-haystack problem the agent solves.

The **Intel** page displays 18 MITRE ATT&CK-mapped IOCs (IPs, domains, hashes, tools) that the agent's `threat_intel_lookup` tool cross-references during every investigation.

<p align="center">
  <img src="screenshots/gallery/07-alerts-all.png" alt="Alerts — All 105 Security Events" width="800" />
</p>
<p align="center">
  <img src="screenshots/gallery/03-alerts-critical.png" alt="Alerts — Critical Severity Filter" width="400" />
  <img src="screenshots/gallery/04-threat-intel.png" alt="Threat Intel — MITRE ATT&CK Mapped IOCs" width="400" />
</p>

---

## Agent Chat & Execution Trace

Send natural language prompts to the DCO Triage Agent. It autonomously selects which tools to call, correlates the results, and returns a structured triage report with MITRE ATT&CK mapping, severity scoring, and containment recommendations.

<p align="center">
  <img src="screenshots/gallery/02-agent-chat.png" alt="Agent Chat — Live Triage Report with Attack Timeline" width="800" />
</p>

### Tool Usage & Execution Trace — 16 Autonomous Steps

The agent used **all 7 Elastic Agent Builder tools** in a single investigation: `correlated_events_by_ip`, `process_chain_analysis`, `threat_intel_lookup`, `lateral_movement_detection`, `beaconing_detection`, `privilege_escalation_detection`, and `incident_triage_workflow`. The **Execution Trace** panel reveals every reasoning step — proving this is true autonomous analysis, not a canned response.

<p align="center">
  <img src="screenshots/gallery/02b-agent-tools.png" alt="Agent Response — Tool Badges and Containment Actions" width="800" />
</p>
<p align="center">
  <img src="screenshots/gallery/02c-agent-trace.png" alt="Execution Trace — 16 Autonomous Reasoning Steps" width="800" />
</p>

---

## Incidents

Agent-generated triage reports with MITRE ATT&CK kill chain mapping, severity scores, and containment recommendations — created automatically by the `incident_triage_workflow` tool.

<p align="center">
  <img src="screenshots/gallery/15-incidents.png" alt="Incidents — Agent-Generated Triage Reports" width="800" />
</p>

---

## How This Meets Hackathon Requirements

| Requirement | How We Meet It |
|-------------|---------------|
| **Custom Agent** | `dco_triage_agent` — created via REST API with 6-step triage methodology |
| **Custom Tools** | 7 tools across 3 types: 5 ES\|QL, 1 index_search, 1 workflow |
| **Data in Elasticsearch** | 3 indices: `security-alerts` (105 docs), `threat-intel` (18 IOCs), `incident-log` |
| **Multi-step automation** | Agent autonomously chains 5-6 tool calls per investigation |
| **Real business task** | Security alert triage — a real problem in every SOC worldwide |
| **Programmatic setup** | `setup_agent_builder.py` creates everything via Kibana REST API |
| **Frontend integration** | Next.js dashboard calls Agent Builder converse API with execution trace |
| **Open source** | [github.com/TimothyVang/elastic-hackathon](https://github.com/TimothyVang/elastic-hackathon) (MIT License) |

---

## What We Liked About Agent Builder

- **Tool type variety** — ES|QL, Search, and Workflow tools let us build a complete security pipeline without leaving Agent Builder. The ES|QL tools are especially powerful for security use cases where you need precise, parameterized queries that an agent can invoke autonomously.
- **Converse API** — The `POST /api/agent_builder/converse` endpoint made frontend integration straightforward. We get structured responses with tool call traces, which we surface as the "Execution Trace" panel — giving analysts full transparency into the agent's reasoning.
- **Programmatic control** — Being able to create agents, tools, and wire them together via REST API meant we could version-control our entire agent configuration and deploy idempotently with a single Python script. No manual setup required.

## Challenges

- **No `system_prompt` field** — Agent Builder agents don't have a dedicated system prompt field. We embedded the full 6-step methodology in the agent's `description`, which works but makes the description very long. A dedicated system prompt field would be a great addition.
- **Workflow tool wiring** — Creating workflows programmatically requires a separate API (`POST /api/workflows`) and the workflow tool needs the UUID, not the name. The Workflow type was the most complex to set up but also the most rewarding — it completes the triage loop by auto-creating incident records.
- **Serverless ES|QL time windows** — ES|QL queries with `NOW() - 24 HOURS` windows require fresh data. We solved this with `load_attack_data.py` generating timestamps relative to `now - 12h`, so the attack chain is always within the query window — a pattern useful for any Agent Builder demo with time-series data.

---

<details>
<summary><strong>Setup & Installation</strong></summary>

### Prerequisites

- Python 3.11+
- An [Elastic Cloud](https://cloud.elastic.co/registration?cta=agentbuilderhackathon) account

### Installation

```bash
# Clone the repository
git clone https://github.com/TimothyVang/elastic-hackathon.git
cd elastic-hackathon

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ELASTIC_CLOUD_ID` | Yes | Your Elastic Cloud deployment ID |
| `ELASTIC_API_KEY` | Yes | Elasticsearch API key |
| `ELASTICSEARCH_URL` | Alt | Direct Elasticsearch URL (if not using Cloud ID) |
| `KIBANA_URL` | Yes | Kibana URL (for Agent Builder API) |

### Quick Start

```bash
# 1. Verify Elasticsearch connectivity
python es_client.py

# 2. Create index mappings
python create_indices.py

# 3. Load simulated attack chain + noise events (~105 events)
python load_attack_data.py

# 4. Load threat intelligence IOCs (~18 IOCs)
python load_threat_intel.py

# 5. Set up Agent Builder tools + agent in Kibana
python setup_agent_builder.py

# 6. Run end-to-end tests
python test_agent.py              # Full test (data + agent)
python test_agent.py --data-only  # Data + ES|QL queries only
```

### Running the Dashboard

```bash
cd frontend
npm install
cp .env.local.example .env.local  # Or edit .env.local with your ES credentials
npm run dev                        # → http://localhost:3000
```

The dashboard requires the same Elasticsearch credentials as the backend. Set these in `frontend/.env.local`:
- `ELASTICSEARCH_URL` or `ELASTIC_CLOUD_ID`
- `ELASTIC_API_KEY`
- `KIBANA_URL` (optional, for Agent Chat)

</details>

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Links

- [Devpost Submission](https://devpost.com/software/soc-agent-7z80jq)
- [Live Dashboard](https://frontend-drab-xi-56.vercel.app/dashboard)
- [Elasticsearch Agent Builder Hackathon](https://elasticsearch.devpost.com)
- [Elastic Agent Builder Docs](https://www.elastic.co/docs/explore-analyze/ai-features/elastic-agent-builder)
- [Elastic Cloud Registration](https://cloud.elastic.co/registration?cta=agentbuilderhackathon)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)

---

*Built for the Elasticsearch Agent Builder Hackathon by [TimothyVang](https://github.com/TimothyVang)*
