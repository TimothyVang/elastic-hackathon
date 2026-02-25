"""
Load MITRE ATT&CK-mapped threat intelligence IOCs into the threat-intel index.

Creates 18 IOCs that correspond to the simulated attack chain in
load_attack_data.py. Each IOC includes:
  - Type (ip, domain, hash, email, tool)
  - Value (the indicator)
  - MITRE ATT&CK technique mapping
  - Severity and confidence scores
  - Descriptive tags

Usage:
    python load_threat_intel.py
"""

import sys
from datetime import datetime, timezone

from elasticsearch.helpers import bulk
from rich.console import Console

from es_client import get_client

console = Console()

NOW = datetime.now(timezone.utc).isoformat()

# ── Threat Intel IOCs ─────────────────────────────────────────────────

THREAT_INTEL: list[dict] = [
    # --- C2 Infrastructure ---
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "ip",
            "value": "198.51.100.23",
            "description": "Command and Control server used by APT-SHADOW group. Hosts Cobalt Strike Team Server. Active since 2025-11.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0011", "name": "Command and Control"},
            "technique": {"id": "T1071", "name": "Application Layer Protocol", "subtechnique": {"id": "T1071.001", "name": "Web Protocols"}},
        },
        "severity": "critical",
        "confidence": 0.95,
        "tags": ["c2", "cobalt-strike", "apt-shadow"],
        "source": "internal-threat-intel",
        "first_seen": "2025-11-15T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "domain",
            "value": "cdn-update.malwaredomain.net",
            "description": "C2 domain masquerading as CDN update service. Resolves to 198.51.100.23. Used for payload delivery and data exfiltration.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0011", "name": "Command and Control"},
            "technique": {"id": "T1071", "name": "Application Layer Protocol", "subtechnique": {"id": "T1071.001", "name": "Web Protocols"}},
        },
        "severity": "critical",
        "confidence": 0.93,
        "tags": ["c2", "domain-fronting", "apt-shadow"],
        "source": "internal-threat-intel",
        "first_seen": "2025-11-20T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },

    # --- Phishing Infrastructure ---
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "domain",
            "value": "suspiciousdomain.xyz",
            "description": "Phishing domain used for spearphishing campaigns. Hosts lookalike HR/benefits portals. Registered 2026-01.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0001", "name": "Initial Access"},
            "technique": {"id": "T1566", "name": "Phishing", "subtechnique": {"id": "T1566.001", "name": "Spearphishing Attachment"}},
        },
        "severity": "high",
        "confidence": 0.90,
        "tags": ["phishing", "spearphishing", "social-engineering"],
        "source": "phishtank",
        "first_seen": "2026-01-05T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "email",
            "value": "hr-benefits@suspiciousdomain.xyz",
            "description": "Sender address used in spearphishing campaign targeting corporate HR/benefits enrollment.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0001", "name": "Initial Access"},
            "technique": {"id": "T1566", "name": "Phishing", "subtechnique": {"id": "T1566.001", "name": "Spearphishing Attachment"}},
        },
        "severity": "high",
        "confidence": 0.92,
        "tags": ["phishing", "spearphishing", "email"],
        "source": "internal-threat-intel",
        "first_seen": "2026-02-01T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "ip",
            "value": "203.0.113.50",
            "description": "Mail relay IP associated with suspiciousdomain.xyz phishing infrastructure.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0001", "name": "Initial Access"},
            "technique": {"id": "T1566", "name": "Phishing", "subtechnique": {"id": "T1566.001", "name": "Spearphishing Attachment"}},
        },
        "severity": "high",
        "confidence": 0.85,
        "tags": ["phishing", "mail-relay"],
        "source": "abuse-ipdb",
        "first_seen": "2026-01-10T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },

    # --- Malware Hashes ---
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "hash",
            "value": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
            "description": "SHA256 of Benefits_Enrollment_2026.xlsm — macro-enabled dropper. Downloads Cobalt Strike stager from C2.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0002", "name": "Execution"},
            "technique": {"id": "T1059", "name": "Command and Scripting Interpreter", "subtechnique": {"id": "T1059.001", "name": "PowerShell"}},
        },
        "severity": "critical",
        "confidence": 0.98,
        "tags": ["malware", "dropper", "macro", "cobalt-strike"],
        "source": "virustotal",
        "first_seen": "2026-02-20T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "hash",
            "value": "d4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
            "description": "SHA256 of modified rundll32.exe used for LSASS memory dumping via comsvcs.dll technique.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0006", "name": "Credential Access"},
            "technique": {"id": "T1003", "name": "OS Credential Dumping", "subtechnique": {"id": "T1003.001", "name": "LSASS Memory"}},
        },
        "severity": "critical",
        "confidence": 0.90,
        "tags": ["malware", "credential-dumper", "lsass"],
        "source": "internal-sandbox",
        "first_seen": "2026-02-22T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },

    # --- Tool Signatures ---
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "tool",
            "value": "Cobalt Strike Beacon v4.9",
            "description": "Commercial penetration testing tool commonly abused by APT groups. HTTPS beacon with ~60s callback interval.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0011", "name": "Command and Control"},
            "technique": {"id": "T1071", "name": "Application Layer Protocol", "subtechnique": {"id": "T1071.001", "name": "Web Protocols"}},
        },
        "severity": "critical",
        "confidence": 0.88,
        "tags": ["cobalt-strike", "beacon", "c2-framework"],
        "source": "internal-threat-intel",
        "first_seen": "2025-06-01T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "tool",
            "value": "comsvcs.dll MiniDump",
            "description": "Living-off-the-land technique using comsvcs.dll to dump LSASS process memory. No additional malware required.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0006", "name": "Credential Access"},
            "technique": {"id": "T1003", "name": "OS Credential Dumping", "subtechnique": {"id": "T1003.001", "name": "LSASS Memory"}},
        },
        "severity": "high",
        "confidence": 0.95,
        "tags": ["lolbin", "credential-dumping", "living-off-the-land"],
        "source": "lolbas-project",
        "first_seen": "2020-01-01T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },

    # --- PowerShell IOCs ---
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "tool",
            "value": "Base64 Encoded PowerShell (-enc flag)",
            "description": "PowerShell invoked with -enc/-EncodedCommand flag to execute Base64-encoded scripts. Common evasion technique.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0002", "name": "Execution"},
            "technique": {"id": "T1059", "name": "Command and Scripting Interpreter", "subtechnique": {"id": "T1059.001", "name": "PowerShell"}},
        },
        "severity": "high",
        "confidence": 0.80,
        "tags": ["powershell", "encoded", "evasion"],
        "source": "sigma-rules",
        "first_seen": "2018-01-01T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "tool",
            "value": "IEX (New-Object Net.WebClient).DownloadString",
            "description": "PowerShell cradle pattern for downloading and executing remote scripts. Commonly used in initial compromise.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0002", "name": "Execution"},
            "technique": {"id": "T1059", "name": "Command and Scripting Interpreter", "subtechnique": {"id": "T1059.001", "name": "PowerShell"}},
        },
        "severity": "high",
        "confidence": 0.85,
        "tags": ["powershell", "download-cradle", "execution"],
        "source": "sigma-rules",
        "first_seen": "2017-01-01T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },

    # --- Lateral Movement Indicators ---
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "tool",
            "value": "SMB Admin Share Access (C$, ADMIN$)",
            "description": "Access to administrative SMB shares from non-admin workstations indicates potential lateral movement using stolen credentials.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0008", "name": "Lateral Movement"},
            "technique": {"id": "T1021", "name": "Remote Services", "subtechnique": {"id": "T1021.002", "name": "SMB/Windows Admin Shares"}},
        },
        "severity": "high",
        "confidence": 0.75,
        "tags": ["lateral-movement", "smb", "admin-shares"],
        "source": "internal-detection-rules",
        "first_seen": "2020-01-01T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "tool",
            "value": "Service account (admin_svc) interactive logon",
            "description": "Service accounts performing interactive logons to multiple hosts in short succession indicate credential theft and lateral movement.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0008", "name": "Lateral Movement"},
            "technique": {"id": "T1021", "name": "Remote Services", "subtechnique": {"id": "T1021.002", "name": "SMB/Windows Admin Shares"}},
        },
        "severity": "high",
        "confidence": 0.82,
        "tags": ["lateral-movement", "service-account-abuse", "credential-theft"],
        "source": "internal-detection-rules",
        "first_seen": "2024-01-01T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },

    # --- Exfiltration Indicators ---
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "tool",
            "value": "7-Zip password-protected archive for staging",
            "description": "Data staged using password-protected 7z archives before exfiltration. Common in APT data theft operations.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0009", "name": "Collection"},
            "technique": {"id": "T1560", "name": "Archive Collected Data", "subtechnique": {"id": "T1560.001", "name": "Archive via Utility"}},
        },
        "severity": "high",
        "confidence": 0.78,
        "tags": ["collection", "data-staging", "archive"],
        "source": "internal-threat-intel",
        "first_seen": "2023-01-01T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "tool",
            "value": "Large outbound transfer over C2 channel (>100MB)",
            "description": "Exfiltration of staged data over existing C2 channel. Transfer size >100MB to known C2 IP is high-confidence exfil indicator.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0010", "name": "Exfiltration"},
            "technique": {"id": "T1041", "name": "Exfiltration Over C2 Channel"},
        },
        "severity": "critical",
        "confidence": 0.92,
        "tags": ["exfiltration", "data-theft", "c2-exfil"],
        "source": "internal-threat-intel",
        "first_seen": "2024-06-01T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },

    # --- Defense Evasion ---
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "tool",
            "value": "Office application spawning cmd.exe or powershell.exe",
            "description": "Microsoft Office applications (Word, Excel) launching command interpreters is a strong indicator of macro-based malware execution.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0005", "name": "Defense Evasion"},
            "technique": {"id": "T1218", "name": "System Binary Proxy Execution"},
        },
        "severity": "high",
        "confidence": 0.90,
        "tags": ["defense-evasion", "macro", "office-child-process"],
        "source": "sigma-rules",
        "first_seen": "2019-01-01T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },

    # --- Network Indicators ---
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "ip",
            "value": "10.10.15.42",
            "description": "Internal workstation WS-PC0142 — patient zero. Compromised via spearphishing, used as pivot point for lateral movement.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0001", "name": "Initial Access"},
            "technique": {"id": "T1566", "name": "Phishing"},
        },
        "severity": "critical",
        "confidence": 0.97,
        "tags": ["compromised-host", "patient-zero", "pivot-point"],
        "source": "incident-response",
        "first_seen": "2026-02-24T08:14:00Z",
        "last_seen": NOW,
        "active": True,
    },
    {
        "@timestamp": NOW,
        "ioc": {
            "type": "domain",
            "value": "mail-relay.suspiciousdomain.xyz",
            "description": "Mail relay subdomain used to deliver spearphishing emails. Part of suspiciousdomain.xyz infrastructure.",
        },
        "threat": {
            "framework": "MITRE ATT&CK",
            "tactic": {"id": "TA0001", "name": "Initial Access"},
            "technique": {"id": "T1566", "name": "Phishing", "subtechnique": {"id": "T1566.001", "name": "Spearphishing Attachment"}},
        },
        "severity": "high",
        "confidence": 0.88,
        "tags": ["phishing", "mail-relay", "infrastructure"],
        "source": "internal-threat-intel",
        "first_seen": "2026-02-01T00:00:00Z",
        "last_seen": NOW,
        "active": True,
    },
]


def load_threat_intel() -> int:
    """
    Bulk-load all threat intel IOCs into the threat-intel index.

    Returns:
        Total number of IOCs loaded.
    """
    es = get_client()

    actions = [
        {"_index": "threat-intel", "_source": ioc}
        for ioc in THREAT_INTEL
    ]

    success, errors = bulk(es, actions, raise_on_error=False)

    # Summary by type
    type_counts: dict[str, int] = {}
    for ioc in THREAT_INTEL:
        ioc_type = ioc["ioc"]["type"]
        type_counts[ioc_type] = type_counts.get(ioc_type, 0) + 1

    for ioc_type, count in sorted(type_counts.items()):
        console.print(f"  [cyan]{ioc_type}:[/] {count} IOCs")

    console.print(f"\n  [bold green]Total:[/] {success} IOCs indexed successfully")

    if errors:
        console.print(f"  [bold red]Errors:[/] {len(errors)} IOCs failed")
        for err in errors[:3]:
            console.print(f"    {err}")

    return success


if __name__ == "__main__":
    console.print("[bold]Loading threat intelligence IOCs into threat-intel...[/]\n")
    try:
        total = load_threat_intel()
        console.print(f"\n[bold green]Done.[/] {total} IOCs loaded.")
    except Exception as e:
        console.print(f"\n[bold red]Failed to load threat intel:[/] {e}")
        sys.exit(1)
