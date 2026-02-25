"""
Claude Agent SDK client configuration.

Sets up:
  - Authentication (OAuth token or API key)
  - MCP servers (Elasticsearch via custom tools)
  - Security hooks (PreToolUse bash allowlist)
  - Allowed tools and permission model
"""

import os
from pathlib import Path

from claude_agent_sdk import (
    ClaudeAgentOptions,
    ClaudeSDKClient,
    HookMatcher,
)
from security import check_bash_command, CLAUDE_SETTINGS


def get_client_options(
    project_dir: Path,
    model: str,
    system_prompt: str,
    allowed_tools: list[str] | None = None,
) -> ClaudeAgentOptions:
    """
    Build ClaudeAgentOptions wired up with security hooks and MCP servers.

    This mirrors the pattern from coleam00/Linear-Coding-Agent-Harness:
      - PreToolUse hook validates bash commands against an allowlist
      - MCP servers provide external tool access
      - Filesystem is restricted to project directory
    """

    if allowed_tools is None:
        allowed_tools = [
            "Bash",
            "Read",
            "Edit",
            "Write",
            "Glob",
            "Grep",
            "WebFetch",
        ]

    options = ClaudeAgentOptions(
        model=model,
        system_prompt=system_prompt,
        cwd=str(project_dir),
        allowed_tools=allowed_tools,
        permission_mode="acceptEdits",  # Auto-accept file edits, prompt for bash
        max_turns=200,
        # Security hooks — PreToolUse validates bash commands
        hooks={
            "PreToolUse": [
                HookMatcher(matcher="Bash", hooks=[check_bash_command]),
            ],
        },
        # Environment variables passed through to the agent
        env={
            "ELASTIC_CLOUD_ID": os.getenv("ELASTIC_CLOUD_ID", ""),
            "ELASTIC_API_KEY": os.getenv("ELASTIC_API_KEY", ""),
        },
    )

    return options


async def create_session(
    project_dir: Path,
    model: str,
    system_prompt: str,
    task_prompt: str,
    allowed_tools: list[str] | None = None,
) -> None:
    """
    Create and run a Claude Agent SDK session.

    Uses ClaudeSDKClient for full hook + MCP support (vs bare query()).
    """
    from rich.console import Console

    console = Console()
    options = get_client_options(
        project_dir=project_dir,
        model=model,
        system_prompt=system_prompt,
        allowed_tools=allowed_tools,
    )

    async with ClaudeSDKClient(options=options) as client:
        await client.query(task_prompt)

        async for msg in client.receive_response():
            # Stream output — show tool use and text
            if hasattr(msg, "content"):
                for block in msg.content:
                    if hasattr(block, "text") and block.text:
                        console.print(block.text)
                    elif hasattr(block, "tool_name"):
                        console.print(
                            f"[dim][Tool: {block.tool_name}][/]"
                        )
            elif hasattr(msg, "result"):
                console.print(f"[green]{msg.result}[/]")


def write_claude_settings(project_dir: Path) -> None:
    """Write .claude_settings.json to project dir for filesystem-level security."""
    import json

    settings_path = project_dir / ".claude_settings.json"
    settings_path.write_text(json.dumps(CLAUDE_SETTINGS, indent=2))
