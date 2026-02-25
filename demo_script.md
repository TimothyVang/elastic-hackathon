# DCO Threat Triage Agent — Demo Script (3 Minutes)

> Video walkthrough for the Elasticsearch Agent Builder Hackathon submission.

---

## 0:00 – 0:20 | The Problem: Alert Fatigue

**[Screen: SOC dashboard with hundreds of alerts]**

> "Security Operations Centers receive thousands of alerts every day. Analysts spend hours manually correlating events, looking up threat intel, and triaging incidents — most of which turn out to be false positives. Real threats slip through the cracks. This is the alert fatigue problem."

**[Quick stat overlay: "68% of SOC analysts report alert fatigue" — Panther Labs 2024]**

> "What if an AI agent could do the first-pass triage automatically?"

---

## 0:20 – 0:40 | The Solution: Architecture Overview

**[Screen: Architecture diagram]**

> "Meet the DCO Threat Triage Agent — built entirely with Elastic Agent Builder. It uses four ES|QL tools for threat hunting, a semantic search tool for threat intelligence lookup, and a structured reasoning chain based on real purple team methodology."

**[Highlight the 3 indices]**

> "The agent works across three Elasticsearch indices: security alerts with over 100 events, a MITRE ATT&CK-mapped threat intel database, and an incident log where it writes triage reports."

---

## 0:40 – 1:20 | Data Loading Demo

**[Screen: Terminal running scripts]**

> "Let me show you the data. We've simulated a realistic 5-stage attack chain..."

**[Run: `python load_attack_data.py`]**

> "...25 attack events spanning phishing, PowerShell C2 beaconing, LSASS credential dumping, SMB lateral movement to three servers, and data exfiltration — all buried in 80 benign noise events."

**[Run: `python load_threat_intel.py`]**

> "And 18 threat intel IOCs mapped to MITRE ATT&CK techniques, including the C2 server IP, malware hashes, and tool signatures."

**[Show Kibana Discover with security-alerts data]**

> "Here's what the raw data looks like in Kibana — can you spot the attack? That's exactly the problem the agent solves."

---

## 1:20 – 2:40 | Live Agent Triage

**[Screen: Kibana Agent Builder UI]**

> "Now let's watch the agent work. I'll ask it to investigate the suspicious IP that our EDR flagged."

**[Type: "Investigate source IP 10.10.15.42"]**

> "Watch the reasoning chain..."

**[Agent executes tools — highlight each step]**

1. > "First, it correlates ALL events from this IP — building a timeline."
2. > "Then it checks our threat intel database — and immediately finds matches for the C2 server and malware hashes."
3. > "It runs beaconing detection — and identifies the 60-second callback pattern to the C2 server."
4. > "Lateral movement detection shows the compromised credentials accessing three different servers."
5. > "Process chain analysis reveals the kill chain: Excel spawning cmd, spawning PowerShell, leading to credential dumping."

**[Show the triage report]**

> "And here's the output — a complete triage report with MITRE ATT&CK mapping across all five kill chain phases, a P1 severity assessment, and specific containment recommendations: isolate the workstation, block the C2 IP, reset the compromised service account, and scan the three lateral movement targets."

**[Highlight: "This took 30 seconds. A human analyst would need 30-45 minutes."]**

---

## 2:40 – 3:00 | Impact & Wrap-up

**[Screen: Summary slide]**

> "The DCO Threat Triage Agent transforms alert triage from a 30-minute manual process into a 30-second automated analysis. It doesn't replace analysts — it amplifies them, letting them focus on confirmed threats instead of drowning in noise."

> "Built with Elastic Agent Builder, ES|QL, and hybrid search — three tools that make building security AI agents remarkably intuitive."

> "Thank you."

**[End card: GitHub repo URL, team info]**

---

## Recording Notes

- **Resolution**: 1920x1080
- **Audio**: Clear narration, no background music during demos
- **Terminal font**: Large enough to read (14pt+)
- **Kibana theme**: Dark mode for better contrast
- **Timing**: Practice to hit 2:55-3:00 mark
- **Key moments to emphasize**:
  - The 60-second beaconing pattern detection
  - Multi-tool reasoning chain (agent uses 5 tools in sequence)
  - The contrast between raw data chaos and structured triage output
