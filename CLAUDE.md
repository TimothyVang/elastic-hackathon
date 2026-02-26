# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DCO Threat Triage Agent — an autonomous AI agent built with Elastic Agent Builder for the Elasticsearch Agent Builder Hackathon. It performs first-pass security alert triage by correlating events with ES|QL, hunting for attack patterns, and cross-referencing MITRE ATT&CK-mapped threat intelligence.

## Commands

### Python backend (from project root)

```bash
pip install -r requirements.txt          # Install dependencies

# Standalone scripts (run in order for fresh setup)
python es_client.py                       # Verify Elasticsearch connectivity
python create_indices.py                  # Create 3 index mappings (idempotent — drops and recreates)
python load_attack_data.py                # Load 5-stage attack chain + ~71 noise events
python load_threat_intel.py               # Load 18 MITRE ATT&CK-mapped IOCs
python setup_agent_builder.py             # Create tools + agent in Kibana via REST API

# Testing
python test_agent.py                      # Full end-to-end test (data + ES|QL + agent via Kibana)
python test_agent.py --data-only          # Data + ES|QL queries only (no Kibana agent test)

# Autonomous harness
python autonomous_agent_demo.py                        # Full run (init + builder iterations)
python autonomous_agent_demo.py --skip-init            # Resume building (skip initialization)
python autonomous_agent_demo.py --max-iterations 5     # Limit builder iterations
python autonomous_agent_demo.py --model claude-sonnet-4-6  # Use a specific model
```

### Next.js frontend (from `frontend/`)

```bash
cd frontend
npm install                               # Install dependencies
npm run dev                               # Dev server (localhost:3000)
npm run build                             # Production build
npm run lint                              # Lint
```

## Architecture

### Two-Agent Harness Pattern

Adapted from [coleam00/Linear-Coding-Agent-Harness](https://github.com/coleam00/Linear-Coding-Agent-Harness). The entry point is `autonomous_agent_demo.py`, which orchestrates two Claude Agent SDK sessions:

1. **Initializer Agent** (`agent.py:run_initializer_session`) — runs once to set up Elastic Cloud, create indices, load data, and scaffold the Agent Builder config. Uses `initializer_prompt.md` + `initializer_task.md`. Writes `.elastic_project.json` as a "done" marker.

2. **Builder Agent** (`agent.py:run_builder_session`) — runs in a loop, each iteration reads `task_tracker.json` to find the next failing task, implements it, tests it, and marks it passing. Uses `coding_prompt.md` + `continuation_task.md`. Stops when all tasks pass or `--max-iterations` is reached.

Session handoff state lives in `dco_agent_project/`: `.elastic_project.json` (init marker), `task_tracker.json` (feature checklist), and `CLAUDE.md` (persistent context for agent sessions).

### Client & Security Stack

`client.py` builds `ClaudeAgentOptions` with a `PreToolUse` hook from `security.py` that validates every bash command against an allowlist before execution. The allowlist lives in `security.py:ALLOWED_COMMANDS`; blocked patterns (fork bombs, `sudo`, `rm -rf /`, etc.) are in `BLOCKED_PATTERNS`. If you need to run a new command from the harness, add it to `ALLOWED_COMMANDS`.

### Elasticsearch Layer

- `es_client.py` — connection factory; supports Cloud ID or direct URL auth, reads from `.env`
- `create_indices.py` — defines 3 ECS-compatible index mappings (`security-alerts`, `threat-intel`, `incident-log`); idempotent (deletes + recreates)
- `load_attack_data.py` — 5-stage MITRE ATT&CK attack chain (34 events) + ~71 benign noise events. `BASE_TIME = now - 12h` so timestamps are always recent.
- `load_threat_intel.py` — 18 IOCs mapped to MITRE ATT&CK techniques

### Agent Builder Tools (Kibana API)

`setup_agent_builder.py` creates 5 tools + 1 agent via `POST /api/agent_builder/tools` and `/api/agent_builder/agents`:

| Tool | Type | Purpose |
|------|------|---------|
| `correlated_events_by_ip` | ES\|QL | Timeline of events by source IP (24h window) |
| `lateral_movement_detection` | ES\|QL | Auth events across multiple hosts |
| `beaconing_detection` | ES\|QL | Periodic outbound C2 patterns (avg interval < 600s) |
| `process_chain_analysis` | ES\|QL | Parent-child process trees by hostname |
| `threat_intel_lookup` | Search | Hybrid keyword+semantic IOC search on `threat-intel` index |

The DCO Triage Agent system prompt (`AGENT_SYSTEM_PROMPT` in `setup_agent_builder.py`) defines a 6-step reasoning chain: correlate → enrich with threat intel → detect patterns → forensic analysis → severity scoring → structured report.

### Frontend Dashboard

`frontend/` is a Next.js 14 + TypeScript + Tailwind CSS dashboard that queries Elasticsearch directly. Key areas:

- `lib/elasticsearch.ts` — ES client for the frontend
- `lib/queries.ts` — ES|QL and search queries
- `lib/types.ts` — TypeScript type definitions
- Pages: `/dashboard`, `/alerts`, `/hunt`, `/intel`, `/incidents`
- Components: `dashboard/` (stats, timeline, donut chart), `hunt/` (beaconing, correlation, process tree), `intel/` (IOC table), `ui/` (reusable badges and tables)

## Key Data Points

- Attacker IP: `10.10.15.42` (host `WS-PC0142`)
- C2 server: `198.51.100.23` (external)
- Victim hosts: `10.10.10.101–104` (DC, FILE, DB, WEB servers)
- 5 MITRE stages: T1566 → T1059+T1071 → T1003 → T1021 → T1560+T1041
- C2 beacon interval: ~345 seconds (~6 minutes)
- Beaconing threshold in ES|QL: `avg_interval_seconds < 600`

## Environment Variables

Configured via `.env` (gitignored). See `.env.example` for the template. Critical vars:
- `ELASTIC_CLOUD_ID` / `ELASTICSEARCH_URL` — ES connection (one required)
- `ELASTIC_API_KEY` — ES auth (required)
- `KIBANA_URL` — for Agent Builder API (required for `setup_agent_builder.py` and agent tests)
- `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` — for the autonomous harness

**WARNING**: `.env` line 1 may contain a real GitHub PAT. Never use `git add -A` or `git add .env`.
