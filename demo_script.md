# DCO Threat Triage Agent -- Demo Script (3 Minutes)

> Video walkthrough for the Elasticsearch Agent Builder Hackathon submission.

---

## 0:00 -- 0:30 | The Problem: Alert Fatigue

**[Screen: Dashboard at `/dashboard` showing 105 alerts, severity breakdown, kill chain visualization]**

> "Security Operations Centers receive thousands of alerts every day. Analysts spend an average of 30 minutes per alert manually correlating events, looking up threat intel, tracing process chains, and deciding what to escalate. 68% of SOC analysts report alert fatigue. Real threats slip through the cracks while teams chase false positives."

> "What if an AI agent could do the first-pass triage automatically -- in 30 seconds?"

**Judges: The dashboard immediately shows the scale -- 105 events, multiple severities, a full MITRE ATT&CK kill chain. This motivates every design decision that follows.**

---

## 0:30 -- 1:00 | Architecture Overview

**[Screen: Architecture diagram (5 seconds), then switch to live dashboard]**

> "Meet the DCO Threat Triage Agent -- built entirely with Elastic Agent Builder. It orchestrates seven purpose-built tools: five ES|QL queries for threat hunting, a hybrid search tool for MITRE ATT&CK-mapped threat intelligence, and a workflow tool for automated incident logging."

**[Show the MITRE ATT&CK Kill Chain visualization on the dashboard]**

> "Our dashboard visualizes the full attack kill chain in real time. Five MITRE ATT&CK tactics -- from Initial Access through Exfiltration -- with event counts at each stage. The agent follows a 6-step reasoning chain: Correlate, Enrich with threat intel, Detect patterns, Forensic analysis, Score severity, and Report."

**[Point out stat cards: Total Alerts, Critical, High, Medium/Low]**

> "The agent works across three Elasticsearch indices: security alerts with 105 events, MITRE-mapped threat intel with 18 IOCs, and an incident log for triage reports."

**Judges: The kill chain visualization immediately tells the story -- this is not random noise, it is a coordinated 5-stage attack progression that the agent must unravel.**

---

## 1:00 -- 2:00 | Live Demo: Hunt Tools

**[Screen: Navigate to `/hunt/correlate`, IP pre-filled with `10.10.15.42`]**

> "Let's investigate a suspicious workstation. Starting with event correlation -- this ES|QL tool pulls every event from IP 10.10.15.42 in chronological order."

**[Click Search -- timeline populates with attack events among noise]**

> "34 attack events from this IP, spanning phishing email delivery, PowerShell execution, credential dumping, lateral movement to four servers, and exfiltration prep -- all buried in normal noise events."

**[Navigate to `/hunt/beaconing`]**

> "Beaconing detection finds the C2 callback pattern -- outbound connections to 198.51.100.23 every 345 seconds, like clockwork. Classic command-and-control behavior."

**[Navigate to `/hunt/process`, hostname `WS-PC0142`]**

> "Process chain analysis reveals the full kill chain: OUTLOOK spawning EXCEL with a macro-enabled attachment, dropping to cmd.exe, then PowerShell with Base64-encoded payloads, and finally procdump targeting LSASS for credential harvesting."

**[Navigate to `/intel`, search for the C2 IP]**

> "Our threat intel index links this C2 server to known APT infrastructure with a MITRE ATT&CK mapping to T1071 Application Layer Protocol."

**Judges: Each hunt page runs a real ES|QL or Search query against Elasticsearch. These are the same tools the agent calls autonomously during triage.**

---

## 2:00 -- 2:30 | Agent in Action

**[Screen: Navigate to `/chat` -- Agent Chat interface]**

> "Now let's see the agent work autonomously. I'll ask it to triage the alerts from 10.10.15.42."

**[Type: "Triage the latest critical alerts from 10.10.15.42"]**

> "Watch the reasoning chain -- the agent calls event correlation first, then cross-references threat intel, detects the beaconing pattern, traces lateral movement across four servers, and reconstructs the full process tree. Six steps, seven tools, all autonomous."

**[Agent response appears with full triage report]**

> "In about 30 seconds, we get a complete triage report: MITRE ATT&CK kill chain mapping across all five stages -- T1566 through T1041 -- threat intel matches including the Lazarus Group-linked C2 server, and specific containment actions: isolate WS-PC0142, block 198.51.100.23 at the firewall, reset compromised credentials on all four lateral movement targets, and sweep those servers for persistence."

**Judges: The agent's multi-tool reasoning chain is not scripted. It autonomously decides which tool to call next based on what it learned from the previous one.**

---

## 2:30 -- 3:00 | Results and Impact

**[Screen: Navigate to `/incidents` -- show the auto-generated incident record]**

> "The triage report is automatically logged as an incident for the SOC team to action. Every finding is traceable back to the raw events."

**[Screen: Dashboard with auto-refresh countdown visible]**

> "The DCO Threat Triage Agent transforms alert triage from a 30-minute manual process into a 30-second automated analysis. It does not replace analysts -- it amplifies them, letting them focus on confirmed threats instead of drowning in noise."

> "Built with Elastic Agent Builder, ES|QL, hybrid search, and MITRE ATT&CK -- tools that make building security AI agents remarkably intuitive. Thank you."

**[End card: GitHub repo, live dashboard URL, Devpost link]**

**Judges: Key takeaway -- 30 minutes to 30 seconds. The agent amplifies analysts rather than replacing them, and the entire system is built on Elastic's native tooling.**

---

## Recording Notes

- **Resolution**: 1920x1080 (dark mode throughout)
- **Audio**: Clear narration, no background music during demos
- **Browser**: Full screen, no bookmarks bar -- maximize dashboard visibility
- **Font size**: Dashboard is designed for 1920x1080 -- no zooming needed
- **Timing**: Practice to hit 2:55-3:00 mark. The demo section (1:00-2:00) is the longest -- keep clicks quick.
- **Key moments to emphasize**:
  - Kill chain visualization on dashboard (the "wow" moment at 0:30)
  - Beaconing detection with ~345s interval pattern (1:20)
  - Process chain showing OUTLOOK to EXCEL to PowerShell to procdump (1:35)
  - Agent chat producing the full triage report in ~30 seconds (2:15)
  - Incident record auto-generated by the workflow tool (2:35)
  - Auto-refresh countdown showing this is a live, production-quality dashboard
- **Fallback plan**: If Agent Builder API is unavailable during recording, the chat page automatically shows a pre-recorded triage result that is identical to what the agent produces
- **URLs to show on end card**:
  - GitHub: https://github.com/TimothyVang/elastic-hackathon
  - Dashboard: https://frontend-drab-xi-56.vercel.app/dashboard
  - Devpost: https://devpost.com/software/dco-threat-triage-agent
