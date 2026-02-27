# Screenshot Gallery

| # | File | Description |
|---|------|-------------|
| 01 | `01-dashboard.png` | Real-time security ops dashboard with alert stats, severity chart, event timeline, and MITRE ATT&CK kill chain visualization |
| 02 | `02-agent-chat.png` | DCO Triage Agent returns a structured report: verdict, attack timeline, C2 infrastructure, and affected assets |
| 02b | `02b-agent-tools.png` | Agent response showing containment actions, all 7 Elastic Agent Builder tool badges, and execution trace toggle |
| 02c | `02c-agent-trace.png` | 18-step execution trace revealing the agent's autonomous reasoning chain across tool calls and analysis steps |
| 03 | `03-alerts-critical.png` | Critical and high-severity alerts filtered from 105 security events — the needle-in-a-haystack the agent finds |
| 04 | `04-threat-intel.png` | 18 MITRE ATT&CK-mapped IOCs (IPs, domains, hashes, tools) used by the agent's threat_intel_lookup tool |
| 05 | `05-kill-chain.png` | MITRE ATT&CK kill chain visualization mapping the 5-stage attack: T1566 → T1059 → T1003 → T1021 → T1041 |
| 06 | `06-architecture.png` | SVG architecture diagram showing data flow from frontend through Agent Builder to Elasticsearch indices |
| 07 | `07-alerts-all.png` | Full alert table with all 105 events — 5-stage attack chain buried in 80+ benign noise events |
| 08 | `08-hunt-landing.png` | Threat hunting hub with links to four specialized ES|QL-powered hunt views mirroring agent tools |
| 09 | `09-hunt-beaconing.png` | C2 beaconing detection: 66 beacons to 198.51.100.23 with 2155s avg interval and 735 MB total traffic |
| 10 | `10-hunt-correlate.png` | Correlated event timeline: 96 events from attacker IP 10.10.15.42 with severity badges and MITRE tags |
| 11 | `11-hunt-lateral.png` | Lateral movement detection: admin_svc authenticating to 3 internal servers (DC01, FILE01, DB01) — HIGH risk |
| 12 | `12-hunt-process.png` | Process chain analysis: EXCEL.EXE → cmd.exe → powershell.exe → rundll32.exe (LSASS credential dump) |
| 13 | `13-kibana-tools.png` | Elastic Agent Builder in Kibana showing all 7 custom tools wired to the DCO Triage Agent |
| 14 | `14-kibana-chat.png` | Agent Builder chat interface in Kibana ready to accept natural language triage queries |
| 15 | `15-incidents.png` | Agent-generated incident report with MITRE ATT&CK mapping, severity score, and containment steps |
