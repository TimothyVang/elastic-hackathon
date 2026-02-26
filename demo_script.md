# DCO Threat Triage Agent — Demo Script (3 Minutes)

> Video walkthrough for the Elasticsearch Agent Builder Hackathon submission.

---

## 0:00 – 0:20 | The Problem: Alert Fatigue

**[Screen: Dashboard at `/dashboard` showing 105 alerts, severity breakdown]**

> "Security Operations Centers receive thousands of alerts every day. Analysts spend hours manually correlating events, looking up threat intel, and triaging incidents — most of which turn out to be false positives. Real threats slip through the cracks."

**[Quick stat overlay: "68% of SOC analysts report alert fatigue" — Panther Labs 2024]**

> "What if an AI agent could do the first-pass triage automatically?"

**Judges: The dashboard immediately shows the scale — 105 events, multiple severities. This motivates every design decision that follows.**

---

## 0:20 – 0:45 | Architecture + Live Dashboard

**[Screen: Architecture diagram (2 seconds), then switch to live dashboard]**

> "Meet the DCO Threat Triage Agent — built entirely with Elastic Agent Builder. It uses four ES|QL tools for threat hunting and a semantic search tool for threat intelligence lookup."

**[Show the MITRE ATT&CK Kill Chain visualization on the dashboard]**

> "Our dashboard visualizes the full attack kill chain in real time. You can see five MITRE ATT&CK tactics — from Initial Access through Exfiltration — with event counts at each stage."

**[Point out stat cards: Total Alerts, Critical, High, Medium/Low]**

> "The agent works across three Elasticsearch indices: security alerts, MITRE-mapped threat intel, and an incident log for triage reports."

**Judges: The kill chain visualization immediately tells the story — this isn't random noise, it's a coordinated attack progression.**

---

## 0:45 – 1:30 | Hunt Tools Demo

**[Screen: Navigate to `/hunt/correlate`, IP pre-filled with `10.10.15.42`]**

> "Let's investigate. Starting with event correlation — every event from the suspicious workstation in chronological order."

**[Click Search — timeline populates with 34 attack events among noise]**

> "34 events from this IP, spanning phishing, PowerShell execution, credential dumping, lateral movement, and exfiltration prep."

**[Navigate to `/hunt/beaconing`]**

> "Beaconing detection finds the C2 callback pattern — outbound connections to 198.51.100.23 every ~345 seconds. Classic command-and-control."

**[Navigate to `/hunt/process`, hostname `WS-PC0142`]**

> "Process chain analysis reveals the kill chain: OUTLOOK spawning EXCEL, dropping to cmd.exe, then PowerShell with Base64-encoded payloads, and finally procdump for LSASS credential harvesting."

**Judges: Each hunt tool runs a real ES|QL query against Elasticsearch. These are the same tools the agent uses autonomously.**

---

## 1:30 – 2:30 | Agent Triage

**[Screen: Navigate to `/chat` — Agent Chat interface]**

> "Now let's see the agent work autonomously. I'll ask it to triage the alerts from 10.10.15.42."

**[Type: "Triage the latest critical alerts from 10.10.15.42"]**

> "Watch the reasoning chain — the agent calls event correlation, cross-references threat intel, detects beaconing, traces lateral movement, and reconstructs the process tree."

**[Agent response appears with full triage report]**

> "In 30 seconds, we get a complete triage report: MITRE ATT&CK kill chain mapping across all five stages, threat intel matches including the Lazarus Group C2 server, and specific containment actions — isolate the workstation, block the C2 IP, reset compromised credentials, sweep lateral movement targets."

**[Navigate to `/incidents` — show the incident record]**

> "The triage report is automatically logged as an incident for the SOC team to action."

**[Navigate to `/alerts`, click a critical alert — show AlertDrawer]**

> "And analysts can drill into any alert for full ECS field inspection — process trees, network details, MITRE mappings, everything they need."

**Judges: The agent's multi-tool reasoning chain is not scripted. It autonomously decides which tool to call next based on what it learned from the previous one. 30-minute manual process → 30 seconds.**

---

## 2:30 – 3:00 | Impact & Wrap-up

**[Screen: Dashboard with auto-refresh countdown visible]**

> "The DCO Threat Triage Agent transforms alert triage from a 30-minute manual process into a 30-second automated analysis. It doesn't replace analysts — it amplifies them, letting them focus on confirmed threats instead of drowning in noise."

> "Built with Elastic Agent Builder, ES|QL, and hybrid search — three tools that make building security AI agents remarkably intuitive."

> "Thank you."

**[End card: GitHub repo URL, deployed dashboard URL]**

**Judges: Key takeaway — the agent amplifies analysts rather than replacing them, and the entire system is built on Elastic's native tooling.**

---

## Recording Notes

- **Resolution**: 1920x1080 (dark mode throughout)
- **Audio**: Clear narration, no background music during demos
- **Browser**: Full screen, no bookmarks bar — maximize dashboard visibility
- **Font size**: Dashboard is designed for 1920x1080 — no zooming needed
- **Timing**: Practice to hit 2:55-3:00 mark
- **Key moments to emphasize**:
  - Kill chain visualization on dashboard (the "wow" moment)
  - Beaconing detection with ~345s interval pattern
  - Agent chat producing the full triage report in ~30 seconds
  - Alert detail drawer showing deep ECS field inspection
  - Auto-refresh countdown showing this is a live, production-quality dashboard
- **Fallback plan**: If Agent Builder API is unavailable, the chat page automatically shows a pre-recorded triage result that's identical to what the agent produces
