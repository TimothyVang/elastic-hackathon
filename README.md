# DCO Threat Triage Agent

> **Elasticsearch Agent Builder Hackathon Submission**
> 30-minute manual triage. 30-second AI analysis. Same analyst-grade results.

**DCO Threat Triage Agent** is an autonomous AI agent built entirely with **Elastic Agent Builder** that performs first-pass security alert triage — correlating events with ES|QL, hunting for attack patterns, and cross-referencing MITRE ATT&CK-mapped threat intelligence — so SOC analysts can focus on confirmed threats instead of drowning in noise.

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

## Architecture

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

## Demo Video

> [Demo Video on YouTube](https://youtu.be/PLACEHOLDER) — 3-minute walkthrough of the agent performing autonomous triage

## Live Dashboard

> **[https://frontend-drab-xi-56.vercel.app/dashboard](https://frontend-drab-xi-56.vercel.app/dashboard)** — deployed on Vercel, querying live Elasticsearch data

## Devpost Submission

> [Devpost Submission](https://devpost.com/software/dco-threat-triage-agent)

## Tech Stack

| Component | Technology |
|---|---|
| Agent Platform | Elastic Agent Builder |
| Data Store | Elasticsearch (Cloud Serverless) |
| Query Language | ES\|QL |
| Search | Hybrid / Semantic Search |
| Threat Framework | MITRE ATT&CK |
| Dashboard | Next.js 14 + TypeScript + Tailwind CSS |
| Charts | Recharts |
| Build Harness | Claude Agent SDK (Python) |
| Languages | Python 3.11+, TypeScript 5.7 |

## Project Structure

```
elastic-hackathon/
├── autonomous_agent_demo.py   # Main entry point — runs the agent harness
├── agent.py                   # Initializer + Builder agent session logic
├── client.py                  # Claude Agent SDK client configuration
├── security.py                # Bash command allowlist & PreToolUse hook
├── progress.py                # Task progress tracker (Rich tables)
├── prompts.py                 # Prompt file loader
├── es_client.py               # Elasticsearch connection factory
├── create_indices.py          # Index mappings (security-alerts, threat-intel, incident-log)
├── load_attack_data.py        # 5-stage attack chain + 80 noise events
├── load_threat_intel.py       # 18 MITRE ATT&CK-mapped IOCs
├── setup_agent_builder.py     # Agent Builder tools + agent (via Kibana API)
├── test_agent.py              # End-to-end triage test suite
├── requirements.txt           # Python dependencies
├── .env.example               # Template for .env
├── frontend/                  # Next.js dashboard (see below)
└── dco_agent_project/         # Generated project directory (created at runtime)
```

### Frontend Dashboard

A real-time security operations dashboard built with **Next.js 14 + TypeScript + Tailwind CSS** that queries Elasticsearch directly.

```
frontend/
├── app/
│   ├── dashboard/      # Overview: stat cards, severity donut, event timeline, kill chain
│   ├── alerts/         # Filterable alert table with click-to-inspect detail drawer
│   ├── hunt/
│   │   ├── correlate/  # IP event correlation timeline
│   │   ├── beaconing/  # C2 beacon pattern detection
│   │   ├── lateral/    # Multi-host auth analysis
│   │   └── process/    # Parent-child process tree
│   ├── intel/          # IOC search with MITRE mappings
│   ├── incidents/      # Agent-generated triage reports
│   ├── chat/           # Live agent chat interface
│   └── api/            # 10 API routes proxying to Elasticsearch
├── components/
│   ├── dashboard/      # StatCard, EventTimeline, SeverityDonut, KillChainTimeline
│   ├── hunt/           # CorrelatedTimeline, BeaconingTable, ProcessTree
│   ├── intel/          # IOCTable
│   └── ui/             # DataTable, SeverityBadge, MitreBadge, StatusBadge, AlertDrawer, Skeleton
└── lib/
    ├── elasticsearch.ts  # ES client (Cloud ID or URL)
    ├── queries.ts        # ES|QL query templates
    ├── types.ts          # TypeScript interfaces for 3 ES indices
    └── utils.ts          # Shared helpers (esqlToRows)
```

**Key features:**
- **MITRE ATT&CK Kill Chain Visualization** — horizontal flow showing attack progression through 5+ tactics
- **Alert Detail Drawer** — click any alert row for a slide-out panel with full ECS field inspection
- **Agent Chat UI** — send prompts to the DCO Triage Agent via Agent Builder API (falls back to pre-recorded results)
- **Auto-refresh** — dashboard polls every 30 seconds with visible countdown timer
- **Connection Status** — live Elasticsearch health indicator in sidebar
- **Loading Skeletons** — animated placeholders during data fetching

## How It Works

This project uses a **two-agent autonomous harness** (adapted from [coleam00/Linear-Coding-Agent-Harness](https://github.com/coleam00/Linear-Coding-Agent-Harness)):

### Session 1: Initializer Agent
- Verifies Elastic Cloud connectivity
- Creates Elasticsearch index mappings (`security-alerts`, `threat-intel`, `incident-log`)
- Loads a simulated 5-stage attack chain + 80 benign noise events
- Loads MITRE ATT&CK-mapped threat intel IOCs
- Scaffolds the Agent Builder configuration
- Creates `task_tracker.json` with 17 features marked as "failing"

### Session 2+: Builder Agent
- Reads `task_tracker.json` to find the next failing task
- Implements the feature (ES|QL tool, search tool, workflow, etc.)
- Tests the implementation against Elasticsearch
- Marks the task as "passing" and updates context

## Setup

### Prerequisites

- Python 3.11+
- An [Elastic Cloud](https://cloud.elastic.co/registration?cta=agentbuilderhackathon) account
- Claude Agent SDK credentials (OAuth token or API key)

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
| `CLAUDE_CODE_OAUTH_TOKEN` | Yes* | OAuth token from `claude setup-token` |
| `ANTHROPIC_API_KEY` | Yes* | Or use API key instead of OAuth |

*One of `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` is required for the autonomous harness.

### Quick Start: Standalone Scripts

You can run each component independently without the autonomous harness:

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

### Running the Autonomous Harness

```bash
# Full run (initializer + builder iterations)
python autonomous_agent_demo.py

# Skip initialization (resume building)
python autonomous_agent_demo.py --skip-init

# Limit builder iterations
python autonomous_agent_demo.py --max-iterations 5

# Use a specific model
python autonomous_agent_demo.py --model claude-sonnet-4-6
```

## Elasticsearch Indices

### `security-alerts`
Simulated security events including:
- Phishing email delivery with macro-enabled attachments
- Encoded PowerShell execution with C2 callbacks
- LSASS credential dumping
- SMB lateral movement across multiple hosts
- Data staging and exfiltration preparation
- 80+ benign noise events (normal logins, web traffic, scheduled tasks)

### `threat-intel`
Curated IOC database mapped to MITRE ATT&CK techniques, including:
- Malicious IP addresses, domains, and file hashes
- ATT&CK technique IDs and descriptions
- Severity scores and confidence levels

### `incident-log`
Agent-generated triage reports containing:
- Correlated event timelines
- MITRE ATT&CK kill chain mapping
- Severity assessment scores
- Recommended containment actions

## Security

The agent harness enforces defense-in-depth security:

1. **Bash allowlist** — Only approved commands can be executed (`security.py`)
2. **PreToolUse hooks** — Every bash command is validated before execution
3. **Blocked patterns** — Dangerous commands (fork bombs, `rm -rf /`, `sudo`, etc.) are always rejected
4. **Filesystem restrictions** — Agent operations are restricted to the project directory

## Features We Liked

- **ES|QL for threat hunting is a game-changer** -- ES|QL's pipe-based syntax is incredibly natural for security analysts. Writing correlated event queries felt like writing SPL or KQL but with better performance. The ability to parameterize queries and expose them as Agent Builder tools means any ES|QL query can become an autonomous capability.
- **Agent Builder's tool orchestration** -- Wiring up ES|QL, Search, and Workflow tools into a single agent was straightforward and powerful. The agent autonomously decides which tool to call next based on what it learned from the previous one -- that reasoning chain is what elevates this from a dashboard into a true triage agent.
- **Hybrid search for threat intel** -- Combining keyword and semantic search for IOC lookup means the agent can find related threats even when exact indicators don't match. A query for "credential dumping" surfaces LSASS-related IOCs alongside hash-based matches, giving the agent broader threat context.

## Challenges

- **Realistic attack simulation** -- Designing a 5-stage MITRE ATT&CK attack chain buried in 80+ benign noise events that demonstrates the agent's pattern-finding capabilities without being trivially solvable required careful calibration of event timestamps, severities, and process trees.
- **Security vs. autonomy tradeoff** -- The autonomous harness gives the agent bash access to set up Elasticsearch indices, which required building a PreToolUse hook with a strict command allowlist and blocked-pattern filter to prevent dangerous operations while still enabling productive work.
- **ES|QL query design at scale** -- Tuning beaconing detection thresholds (e.g., `avg_interval_seconds < 600`) and time-bucketed aggregations to be both performant and accurate across time-series data required multiple iterations of testing against realistic event volumes.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Links

- [Devpost Submission](https://devpost.com/software/dco-threat-triage-agent)
- [Live Dashboard](https://frontend-drab-xi-56.vercel.app/dashboard)
- [Elasticsearch Agent Builder Hackathon](https://elasticsearch.devpost.com)
- [Elastic Agent Builder Docs](https://www.elastic.co/docs/explore-analyze/ai-features/elastic-agent-builder)
- [Elastic Cloud Registration](https://cloud.elastic.co/registration?cta=agentbuilderhackathon)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)

---

*Built for the Elasticsearch Agent Builder Hackathon by [TimothyVang](https://github.com/TimothyVang)*
