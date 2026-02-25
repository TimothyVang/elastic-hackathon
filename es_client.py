"""
Elasticsearch client configuration for the DCO Threat Triage Agent.

Connects to Elastic Cloud using environment variables.
Supports both Cloud ID and direct URL authentication.

Usage:
    from es_client import get_client
    es = get_client()
"""

import os
import sys

from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from rich.console import Console

load_dotenv()

console = Console()


def get_client() -> Elasticsearch:
    """
    Create an Elasticsearch client from environment variables.

    Supports two authentication modes:
      1. Cloud ID + API Key (preferred for Elastic Cloud)
      2. Direct URL + API Key (for self-hosted or serverless)

    Environment variables:
      - ELASTIC_CLOUD_ID: Elastic Cloud deployment ID
      - ELASTIC_API_KEY: Elasticsearch API key
      - ELASTICSEARCH_URL: Direct Elasticsearch URL (fallback)
    """
    cloud_id = os.getenv("ELASTIC_CLOUD_ID", "")
    api_key = os.getenv("ELASTIC_API_KEY", "")
    es_url = os.getenv("ELASTICSEARCH_URL", "")

    if not api_key:
        console.print(
            "[bold red]ERROR:[/] ELASTIC_API_KEY is not set.\n"
            "  export ELASTIC_API_KEY='your-api-key'\n"
            "  Or add it to .env"
        )
        sys.exit(1)

    # Prefer Cloud ID, fall back to direct URL
    if cloud_id and cloud_id != "your_cloud_id_here":
        es = Elasticsearch(
            cloud_id=cloud_id,
            api_key=api_key,
            request_timeout=30,
        )
    elif es_url and es_url != "https://your-deployment.es.cloud.es.io:9243":
        es = Elasticsearch(
            es_url,
            api_key=api_key,
            request_timeout=30,
            verify_certs=True,
        )
    else:
        console.print(
            "[bold red]ERROR:[/] Neither ELASTIC_CLOUD_ID nor ELASTICSEARCH_URL is set.\n"
            "  export ELASTIC_CLOUD_ID='your-cloud-id'\n"
            "  # OR\n"
            "  export ELASTICSEARCH_URL='https://your-es-host:9243'"
        )
        sys.exit(1)

    return es


def verify_connection() -> bool:
    """
    Test the Elasticsearch connection and print cluster info.

    Returns:
        True if connection is successful, False otherwise.
    """
    try:
        es = get_client()
        info = es.info()

        cluster_name = info.get("cluster_name", "unknown")
        version = info.get("version", {}).get("number", "unknown")
        tagline = info.get("tagline", "")

        console.print(f"[bold green]Connected to Elasticsearch[/]")
        console.print(f"  Cluster: [cyan]{cluster_name}[/]")
        console.print(f"  Version: [cyan]{version}[/]")
        console.print(f"  Tagline: [dim]{tagline}[/]")

        return True

    except Exception as e:
        console.print(f"[bold red]Connection failed:[/] {e}")
        return False


if __name__ == "__main__":
    console.print("[bold]Verifying Elasticsearch connection...[/]\n")
    success = verify_connection()
    sys.exit(0 if success else 1)
