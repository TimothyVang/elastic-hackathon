# DCO Threat Triage Agent — Voiceover Script (2:50)

Read each section when you see the matching scene on screen.

---

## [0:00–0:05] Kibana — Agent Builder Agents List
"First, let's look inside Elastic Agent Builder. Here's the Agents page in Kibana — our DCO Triage Agent is listed alongside the built-in Elastic AI Agent. You can see the full system prompt defining its six-step triage methodology."

## [0:05–0:10] Kibana — DCO Agent Configuration
"Here's the DCO Triage Agent's full configuration — you can read the system prompt that defines its six-step reasoning chain: correlate events, enrich with threat intel, detect patterns, analyze forensics, score severity, and produce a structured report."

## [0:10–0:15] Kibana — Global Tools List
"Here's the global Tools page — all seven custom tools listed alongside Elastic's built-in tools. Each one was created programmatically via the Agent Builder REST API."

## [0:15–0:19] Frontend — Beaconing Detection Hunt Page
"Now the frontend. This is the Beaconing Detection page — it runs the same ES|QL query as the agent's beaconing_detection tool. It found 44 C2 beacons to an external IP at 296-second intervals."

## [0:19–0:23] Frontend — Lateral Movement Hunt Page
"Lateral Movement detection — the attacker IP 10.10.15.42 used admin credentials across three servers. High risk."

## [0:23–0:30] Dashboard — THREAT COMMAND with stats
"The main dashboard shows 105 security alerts, 5 critical threats, and a live connection to Elastic Agent Builder."

## [0:30–0:50] Architecture Diagram + Kill Chain + Charts
"The architecture shows how Agent Builder orchestrates the DCO Triage Agent with its six-step reasoning chain, querying three Elasticsearch indices. Below, the MITRE ATT&CK kill chain shows our five-stage attack from phishing to exfiltration."

## [0:50–1:10] Alerts, Intel, Incidents Pages
"The alerts page shows over 300 events — attack signals buried in noise. The threat intel database has 18 MITRE-mapped IOCs. And the incident log shows a previous triage — APT-SHADOW, Critical, True Positive."

## [1:10–1:27] Agent Chat — Tool Badges + Typing Prompt
"Now let's watch the agent work. The Agent Chat shows seven tool badges and a green Agent Builder badge. We're asking it to triage alerts from IP 10.10.15.42."

## [1:27–1:41] RUNNING AGENT TOOLS... (sped up 8×)
"The agent is now running autonomously through the Agent Builder converse API — correlating events, checking for beaconing, scanning for lateral movement, and cross-referencing threat intel. This is sped up — real time is about two minutes."

## [1:41–2:20] Triage Response — Results Scrolling
"Here's the result. Critical Incident — True Positive, Active Intrusion, Risk Score 95 out of 100. The Attack Timeline shows every phase — from the initial phishing email through PowerShell execution, C2 beaconing, credential dumping, and lateral movement across three servers."

## [2:20–2:50] Threat Intel + Execution Trace + Final Summary
"Scrolling down — the Threat Intel Context links the C2 IP to known spearphishing campaigns. And here's the Execution Trace: 18 reasoning steps, every tool the agent called autonomously. What would take a human analyst 30 minutes, Agent Builder completed in under two minutes. That's the DCO Threat Triage Agent — built entirely with Elastic Agent Builder."
