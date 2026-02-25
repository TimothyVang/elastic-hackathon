# DCO Threat Triage Agent

> **Elasticsearch Agent Builder Hackathon Submission**
> 30-minute manual triage. 30-second AI analysis. Same analyst-grade results.

**DCO Threat Triage Agent** is an autonomous AI agent built entirely with **Elastic Agent Builder** that performs first-pass security alert triage — correlating events with ES|QL, hunting for attack patterns, and cross-referencing MITRE ATT&CK-mapped threat intelligence — so SOC analysts can focus on confirmed threats instead of drowning in noise.

---

## Problem

**68% of SOC analysts report alert fatigue** (Panther Labs, 2024). Security teams receive thousands of alerts every day. Each one demands the same manual workflow: correlate related events, look up threat intelligence, trace process chains, assess severity, and decide what to escalate. Most alerts turn out to be false positives — but the one that isn't can mean a breach. When analysts are buried in noise, real attacks slip through. The problem is not detection. It is triage at scale.

## Solution

**DCO Threat Triage Agent** automates the entire first-pass triage workflow using five purpose-built tools orchestrated by Elastic Agent Builder:

1. **Event Correlation** (ES|QL) — Links related alerts by source IP, timeframe, and host across the full event timeline
2. **Beaconing Detection** (ES|QL) — Identifies periodic C2 callback patterns using time-bucketed aggregation
3. **Lateral Movement Detection** (ES|QL) — Traces credential use and SMB connections across multiple hosts
4. **Process Chain Analysis** (ES|QL) — Reconstructs parent-child process trees to reveal execution chains
5. **Threat Intel Lookup** (Hybrid Search) — Cross-references IOCs against a MITRE ATT&CK-mapped database using semantic + keyword search

The agent chains these tools in a reasoning loop, then generates a structured triage report with MITRE ATT&CK kill chain mapping, severity scoring, and specific containment recommendations.

To prove it works, we built a realistic simulated environment: a **5-stage attack chain** (phishing, PowerShell C2, credential dumping, lateral movement, data exfiltration) buried in **80+ benign noise events**. The agent finds the needle in the haystack — every time.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Elastic Agent Builder                    │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  ES|QL   │  │   Search     │  │    Workflow        │  │
│  │  Tools   │  │   Tools      │  │    Tools           │  │
│  │          │  │              │  │                    │  │
│  │• Correl. │  │• IOC Lookup  │  │• Incident Record   │  │
│  │• Lateral │  │• MITRE Map   │  │• Severity Score    │  │
│  │• Beacon  │  │• Historical  │  │• Containment Recs  │  │
│  │• Process │  │  Correlation │  │                    │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│       │               │                   │              │
│       └───────────────┼───────────────────┘              │
│                       │                                  │
│              ┌────────▼────────┐                         │
│              │   Agent Brain   │                         │
│              │  (LLM + System  │                         │
│              │   Prompt with   │                         │
│              │   DCO Triage    │                         │
│              │   Reasoning)    │                         │
│              └─────────────────┘                         │
└─────────────────────────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌──────────────┐
│  security-  │ │  threat-    │ │  incident-   │
│  alerts     │ │  intel      │ │  log         │
│  (ES index) │ │  (ES index) │ │  (ES index)  │
└─────────────┘ └─────────────┘ └──────────────┘
```

## Demo Video

> :movie_camera: [Demo video coming soon — link will be added before submission]

## Tech Stack

| Component | Technology |
|---|---|
| Agent Platform | Elastic Agent Builder |
| Data Store | Elasticsearch (Cloud Serverless) |
| Query Language | ES\|QL |
| Search | Hybrid / Semantic Search |
| Threat Framework | MITRE ATT&CK |
| Build Harness | Claude Agent SDK (Python) |
| Language | Python 3.11+ |

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
├── initializer_prompt.md      # System prompt for the Initializer Agent
├── initializer_task.md        # Task prompt for Initializer session
├── coding_prompt.md           # System prompt for the Builder Agent
├── continuation_task.md       # Task template for Builder sessions
├── demo_script.md             # 3-minute demo video walkthrough
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables (not committed)
├── .env.example               # Template for .env
├── .gitignore                 # Git ignore rules
├── LICENSE                    # MIT License
└── dco_agent_project/         # Generated project directory (created at runtime)
    ├── .elastic_project.json  # Initialization marker
    ├── task_tracker.json      # Feature checklist (pass/fail status)
    └── CLAUDE.md              # Persistent context for agent sessions
```

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

- **ES|QL for threat hunting** — ES|QL's pipe-based syntax is incredibly natural for security analysts. Writing correlated event queries felt like writing SPL or KQL but with better performance.
- **Agent Builder's tool system** — Wiring up ES|QL, Search, and Workflow tools into a single agent was straightforward and powerful. The ability to chain tools in a reasoning loop is what makes this a true triage agent, not just a dashboard.
- **Hybrid search for threat intel** — Combining keyword and semantic search for IOC lookup means the agent can find related threats even when exact indicators don't match.

## Challenges

- Designing realistic simulated attack data that demonstrates the agent's capabilities without being trivially solvable
- Balancing the agent's autonomy with security constraints — the bash allowlist needed careful tuning
- Ensuring ES|QL queries are performant across time-series data at scale

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Links

- [Elasticsearch Agent Builder Hackathon](https://elasticsearch.devpost.com)
- [Elastic Cloud Registration](https://cloud.elastic.co/registration?cta=agentbuilderhackathon)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)

---

*Built for the Elasticsearch Agent Builder Hackathon by [TimothyVang](https://github.com/TimothyVang)*
