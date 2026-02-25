"""
DCO Threat Triage Agent — Autonomous Agent Harness
===================================================

Adapted from coleam00/Linear-Coding-Agent-Harness pattern.
Uses the Claude Agent SDK to run Claude Code headless as the
"brain" that orchestrates building the Elasticsearch Agent Builder
hackathon submission.

Two-agent pattern:
  1. Initializer Agent — sets up Elastic Cloud, indices, loads data,
     scaffolds the Agent Builder config
  2. Builder Agent — iterates on ES|QL tools, search tools, workflows,
     tests the agent, and builds the demo

Auth: CLAUDE_CODE_OAUTH_TOKEN (from `claude setup-token`)
       or ANTHROPIC_API_KEY (API key)
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel

from agent import run_initializer_session, run_builder_session
from progress import ProgressTracker

console = Console()


def check_env() -> None:
    """Verify required environment variables are set."""
    has_oauth = bool(os.getenv("CLAUDE_CODE_OAUTH_TOKEN"))
    has_api_key = bool(os.getenv("ANTHROPIC_API_KEY"))

    if not has_oauth and not has_api_key:
        console.print(
            "[bold red]ERROR:[/] Neither CLAUDE_CODE_OAUTH_TOKEN nor ANTHROPIC_API_KEY is set.\n"
            "Run [cyan]claude setup-token[/] to generate an OAuth token, or set your API key.\n"
            "  export CLAUDE_CODE_OAUTH_TOKEN='your-token'\n"
            "  # OR\n"
            "  export ANTHROPIC_API_KEY='sk-ant-...'"
        )
        sys.exit(1)

    if not os.getenv("ELASTIC_CLOUD_ID"):
        console.print(
            "[bold yellow]WARNING:[/] ELASTIC_CLOUD_ID not set. "
            "The agent will need this to connect to Elastic Cloud.\n"
            "  export ELASTIC_CLOUD_ID='your-deployment-id'"
        )

    if not os.getenv("ELASTIC_API_KEY"):
        console.print(
            "[bold yellow]WARNING:[/] ELASTIC_API_KEY not set. "
            "The agent will need this to authenticate with Elasticsearch.\n"
            "  export ELASTIC_API_KEY='your-api-key'"
        )


def is_initialized(project_dir: Path) -> bool:
    """Check if the initializer has already run."""
    return (project_dir / ".elastic_project.json").exists()


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="DCO Threat Triage Agent — Autonomous Harness"
    )
    parser.add_argument(
        "--project-dir",
        type=str,
        default="./dco_agent_project",
        help="Directory for the project (default: ./dco_agent_project)",
    )
    parser.add_argument(
        "--max-iterations",
        type=int,
        default=0,
        help="Max builder iterations (0 = unlimited, default: 0)",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="claude-opus-4-6",
        help="Claude model to use (default: claude-opus-4-6)",
    )
    parser.add_argument(
        "--skip-init",
        action="store_true",
        help="Skip initializer and jump to builder agent",
    )
    args = parser.parse_args()

    project_dir = Path(args.project_dir).resolve()
    project_dir.mkdir(parents=True, exist_ok=True)

    check_env()

    console.print(
        Panel(
            "[bold cyan]DCO Threat Triage Agent[/]\n"
            "[dim]Elasticsearch Agent Builder Hackathon Harness[/]\n\n"
            f"Project dir: [green]{project_dir}[/]\n"
            f"Model: [green]{args.model}[/]\n"
            f"Max iterations: [green]{args.max_iterations or 'unlimited'}[/]",
            title="🛡️  Agent Harness",
            border_style="cyan",
        )
    )

    tracker = ProgressTracker()

    # ── Session 1: Initializer ──────────────────────────────────────
    if not args.skip_init and not is_initialized(project_dir):
        console.print("\n[bold cyan]═══ Session 1: Initializer Agent ═══[/]")
        console.print("[dim]Setting up Elastic Cloud, indices, sample data, and agent scaffold...[/]\n")

        await run_initializer_session(
            project_dir=project_dir,
            model=args.model,
            tracker=tracker,
        )

        console.print("\n[bold green]✓ Initializer complete[/]")
    else:
        console.print("\n[dim]Skipping initializer (already initialized or --skip-init)[/]")

    # ── Session 2+: Builder Agent ───────────────────────────────────
    iteration = 0
    max_iter = args.max_iterations if args.max_iterations > 0 else float("inf")

    while iteration < max_iter:
        iteration += 1
        console.print(
            f"\n[bold cyan]═══ Session {iteration + 1}: Builder Agent (iteration {iteration}) ═══[/]"
        )

        await run_builder_session(
            project_dir=project_dir,
            model=args.model,
            iteration=iteration,
            tracker=tracker,
        )

        console.print(f"\n[bold green]✓ Builder iteration {iteration} complete[/]")

        # Check if all tasks are done
        if tracker.all_tasks_complete():
            console.print("\n[bold green]🎉 All tasks complete! Project ready for submission.[/]")
            break

    tracker.print_summary()


if __name__ == "__main__":
    asyncio.run(main())
