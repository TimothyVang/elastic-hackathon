"""
Create Elasticsearch index mappings for the DCO Threat Triage Agent.

Creates three indices with ECS-compatible field mappings:
  1. security-alerts  — simulated security events with MITRE ATT&CK fields
  2. threat-intel     — IOC database mapped to MITRE ATT&CK
  3. incident-log     — agent-generated triage reports

Idempotent: deletes and recreates indices if they already exist.

Usage:
    python create_indices.py
"""

import sys

from elasticsearch import NotFoundError
from rich.console import Console

from es_client import get_client

console = Console()

# ── Index Definitions ─────────────────────────────────────────────────

INDICES: dict[str, dict] = {
    "security-alerts": {
        "settings": {},
        "mappings": {
            "properties": {
                # ECS base fields
                "@timestamp": {"type": "date"},
                "message": {"type": "text"},
                "tags": {"type": "keyword"},

                # Event categorization (ECS)
                "event": {
                    "properties": {
                        "kind": {"type": "keyword"},       # alert, event, signal
                        "category": {"type": "keyword"},   # network, process, authentication, malware
                        "type": {"type": "keyword"},       # start, end, info, allowed, denied
                        "action": {"type": "keyword"},     # logged-in, process-created, connection-attempted
                        "outcome": {"type": "keyword"},    # success, failure
                        "severity": {"type": "integer"},   # 0-100
                        "risk_score": {"type": "float"},
                    }
                },

                # Source / Destination (ECS)
                "source": {
                    "properties": {
                        "ip": {"type": "ip"},
                        "port": {"type": "integer"},
                        "mac": {"type": "keyword"},
                        "domain": {"type": "keyword"},
                        "bytes": {"type": "long"},
                    }
                },
                "destination": {
                    "properties": {
                        "ip": {"type": "ip"},
                        "port": {"type": "integer"},
                        "domain": {"type": "keyword"},
                        "bytes": {"type": "long"},
                    }
                },

                # Host info (ECS)
                "host": {
                    "properties": {
                        "name": {"type": "keyword"},
                        "hostname": {"type": "keyword"},
                        "ip": {"type": "ip"},
                        "os": {
                            "properties": {
                                "name": {"type": "keyword"},
                                "platform": {"type": "keyword"},
                            }
                        },
                    }
                },

                # Process info (ECS)
                "process": {
                    "properties": {
                        "name": {"type": "keyword"},
                        "pid": {"type": "integer"},
                        "executable": {"type": "keyword"},
                        "command_line": {"type": "text", "fields": {"keyword": {"type": "keyword", "ignore_above": 1024}}},
                        "args": {"type": "keyword"},
                        "parent": {
                            "properties": {
                                "name": {"type": "keyword"},
                                "pid": {"type": "integer"},
                                "executable": {"type": "keyword"},
                                "command_line": {"type": "text"},
                            }
                        },
                        "hash": {
                            "properties": {
                                "sha256": {"type": "keyword"},
                                "md5": {"type": "keyword"},
                            }
                        },
                    }
                },

                # User info (ECS)
                "user": {
                    "properties": {
                        "name": {"type": "keyword"},
                        "domain": {"type": "keyword"},
                        "id": {"type": "keyword"},
                    }
                },

                # File info (ECS)
                "file": {
                    "properties": {
                        "name": {"type": "keyword"},
                        "path": {"type": "keyword"},
                        "extension": {"type": "keyword"},
                        "size": {"type": "long"},
                        "hash": {
                            "properties": {
                                "sha256": {"type": "keyword"},
                                "md5": {"type": "keyword"},
                            }
                        },
                    }
                },

                # Network (ECS)
                "network": {
                    "properties": {
                        "protocol": {"type": "keyword"},
                        "direction": {"type": "keyword"},    # inbound, outbound, internal
                        "bytes": {"type": "long"},
                        "transport": {"type": "keyword"},    # tcp, udp
                    }
                },

                # Email (ECS extension)
                "email": {
                    "properties": {
                        "from": {"type": "keyword"},
                        "to": {"type": "keyword"},
                        "subject": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                        "attachments": {
                            "properties": {
                                "file": {
                                    "properties": {
                                        "name": {"type": "keyword"},
                                        "extension": {"type": "keyword"},
                                        "hash": {
                                            "properties": {
                                                "sha256": {"type": "keyword"},
                                            }
                                        },
                                    }
                                },
                            }
                        },
                    }
                },

                # MITRE ATT&CK fields (ECS threat)
                "threat": {
                    "properties": {
                        "framework": {"type": "keyword"},
                        "tactic": {
                            "properties": {
                                "id": {"type": "keyword"},
                                "name": {"type": "keyword"},
                            }
                        },
                        "technique": {
                            "properties": {
                                "id": {"type": "keyword"},
                                "name": {"type": "keyword"},
                                "subtechnique": {
                                    "properties": {
                                        "id": {"type": "keyword"},
                                        "name": {"type": "keyword"},
                                    }
                                },
                            }
                        },
                    }
                },

                # Alert metadata
                "alert": {
                    "properties": {
                        "severity": {"type": "keyword"},     # low, medium, high, critical
                        "signature": {"type": "keyword"},
                        "category": {"type": "keyword"},
                    }
                },

                # Rule info (ECS)
                "rule": {
                    "properties": {
                        "name": {"type": "keyword"},
                        "id": {"type": "keyword"},
                        "description": {"type": "text"},
                    }
                },
            }
        },
    },

    "threat-intel": {
        "settings": {},
        "mappings": {
            "properties": {
                "@timestamp": {"type": "date"},
                "ioc": {
                    "properties": {
                        "type": {"type": "keyword"},       # ip, domain, hash, url, email
                        "value": {"type": "keyword"},
                        "description": {"type": "text"},
                    }
                },
                "threat": {
                    "properties": {
                        "framework": {"type": "keyword"},
                        "tactic": {
                            "properties": {
                                "id": {"type": "keyword"},
                                "name": {"type": "keyword"},
                            }
                        },
                        "technique": {
                            "properties": {
                                "id": {"type": "keyword"},
                                "name": {"type": "keyword"},
                                "subtechnique": {
                                    "properties": {
                                        "id": {"type": "keyword"},
                                        "name": {"type": "keyword"},
                                    }
                                },
                            }
                        },
                    }
                },
                "severity": {"type": "keyword"},          # low, medium, high, critical
                "confidence": {"type": "float"},          # 0.0 - 1.0
                "tags": {"type": "keyword"},
                "source": {"type": "keyword"},            # feed name / provider
                "first_seen": {"type": "date"},
                "last_seen": {"type": "date"},
                "active": {"type": "boolean"},
            }
        },
    },

    "incident-log": {
        "settings": {},
        "mappings": {
            "properties": {
                "@timestamp": {"type": "date"},
                "incident": {
                    "properties": {
                        "id": {"type": "keyword"},
                        "title": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                        "description": {"type": "text"},
                        "severity": {"type": "keyword"},
                        "status": {"type": "keyword"},       # open, investigating, contained, resolved
                        "priority": {"type": "keyword"},     # P1, P2, P3, P4
                    }
                },
                "affected_hosts": {"type": "keyword"},
                "affected_users": {"type": "keyword"},
                "source_ips": {"type": "keyword"},
                "kill_chain_phase": {"type": "keyword"},
                "mitre_techniques": {"type": "keyword"},
                "event_count": {"type": "integer"},
                "first_event": {"type": "date"},
                "last_event": {"type": "date"},
                "time_span_minutes": {"type": "float"},
                "containment_actions": {"type": "text"},
                "analyst_notes": {"type": "text"},
                "risk_score": {"type": "float"},
                "triage_result": {"type": "keyword"},       # true_positive, false_positive, needs_investigation
            }
        },
    },
}


def create_indices() -> None:
    """Create all indices, deleting existing ones first (idempotent)."""
    es = get_client()

    for index_name, body in INDICES.items():
        # Delete if exists
        try:
            es.indices.delete(index=index_name)
            console.print(f"  [yellow]Deleted existing index:[/] {index_name}")
        except NotFoundError:
            pass

        # Create
        es.indices.create(
            index=index_name,
            settings=body["settings"],
            mappings=body["mappings"],
        )
        console.print(f"  [green]Created index:[/] {index_name}")

    # Create ingest pipeline for incident-log timestamp
    es.ingest.put_pipeline(
        id="incident-log-timestamp",
        description="Adds @timestamp if missing (used by incident_triage_workflow)",
        processors=[{"set": {"field": "@timestamp", "value": "{{{_ingest.timestamp}}}", "override": False}}],
    )
    console.print("  [green]Created pipeline:[/] incident-log-timestamp")

    # Set default pipeline on incident-log index
    es.indices.put_settings(index="incident-log", settings={"index.default_pipeline": "incident-log-timestamp"})
    console.print("  [green]Linked pipeline to:[/] incident-log")

    console.print(f"\n[bold green]All {len(INDICES)} indices created successfully.[/]")


if __name__ == "__main__":
    console.print("[bold]Creating Elasticsearch indices...[/]\n")
    try:
        create_indices()
    except Exception as e:
        console.print(f"\n[bold red]Failed to create indices:[/] {e}")
        sys.exit(1)
