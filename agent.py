"""
Agent session logic.

Two-agent pattern (from coleam00/Linear-Coding-Agent-Harness):
  1. Initializer Agent — first session, sets everything up
  2. Builder Agent — continuation sessions, implements features

Session handoff happens via:
  - .elastic_project.json (project state marker)
  - task_tracker.json (feature checklist with pass/fail status)
  - CLAUDE.md (persistent context for Claude Code)
"""

import json
from pathlib import Path

from client import create_session, write_claude_settings
from progress import ProgressTracker
from prompts import load_prompt


async def run_initializer_session(
    project_dir: Path,
    model: str,
    tracker: ProgressTracker,
) -> None:
    """
    Session 1: Initializer Agent.

    Responsibilities:
      - Verify Elastic Cloud connectivity
      - Create index mappings (security-alerts, threat-intel, incident-log)
      - Load simulated attack chain data + noise events
      - Load threat intel data
      - Scaffold Agent Builder configuration
      - Write task_tracker.json with all features marked as "failing"
      - Write .elastic_project.json marker
      - Set up CLAUDE.md for future sessions
    """

    # Write security settings to project dir
    write_claude_settings(project_dir)

    system_prompt = load_prompt("initializer_prompt.md")
    task_prompt = load_prompt("initializer_task.md")

    await create_session(
        project_dir=project_dir,
        model=model,
        system_prompt=system_prompt,
        task_prompt=task_prompt,
    )

    # Mark as initialized
    state = {
        "initialized": True,
        "project_name": "DCO Threat Triage Agent",
        "hackathon": "Elasticsearch Agent Builder Hackathon",
        "deadline": "2026-02-27",
    }
    (project_dir / ".elastic_project.json").write_text(
        json.dumps(state, indent=2)
    )


async def run_builder_session(
    project_dir: Path,
    model: str,
    iteration: int,
    tracker: ProgressTracker,
) -> None:
    """
    Session 2+: Builder Agent.

    Responsibilities:
      - Read task_tracker.json to find next "failing" task
      - Implement the feature (ES|QL tool, search tool, workflow, etc.)
      - Test the implementation
      - Update task_tracker.json status to "passing"
      - Add implementation notes
      - Update CLAUDE.md with session summary
    """

    system_prompt = load_prompt("coding_prompt.md")

    # Build task prompt with current iteration context
    task_prompt = load_prompt("continuation_task.md")
    task_prompt = task_prompt.replace("{{ITERATION}}", str(iteration))

    # Load current task state if it exists
    tracker_path = project_dir / "task_tracker.json"
    if tracker_path.exists():
        tasks = json.loads(tracker_path.read_text())
        failing = [t for t in tasks if t.get("status") == "failing"]
        task_prompt += f"\n\nThere are {len(failing)} remaining tasks to complete."
        if failing:
            next_task = failing[0]
            task_prompt += f"\n\nNext task: {next_task['name']}\nDescription: {next_task.get('description', '')}"

    await create_session(
        project_dir=project_dir,
        model=model,
        system_prompt=system_prompt,
        task_prompt=task_prompt,
    )
