"""
Security module — bash command allowlist and PreToolUse hook.

Defense-in-depth security model (from coleam00/Linear-Coding-Agent-Harness):
  1. OS-level sandbox: bash runs in isolated environment
  2. Filesystem restrictions: operations restricted to project dir
  3. Bash allowlist: only specific commands permitted
  4. PreToolUse hook: validates every bash command before execution

Adapted for Elasticsearch/cybersecurity operations.
"""

# ── Allowed commands ────────────────────────────────────────────────
# Only these commands (and their subcommands) can be executed.
# Add more as needed for your workflow.

ALLOWED_COMMANDS: set[str] = {
    # Core dev tools
    "python",
    "python3",
    "pip",
    "pip3",
    "node",
    "npm",
    "npx",

    # Version control
    "git",

    # File operations
    "ls",
    "cat",
    "head",
    "tail",
    "find",
    "grep",
    "wc",
    "sort",
    "uniq",
    "diff",
    "mkdir",
    "cp",
    "mv",
    "rm",
    "touch",
    "chmod",
    "echo",
    "printf",
    "tee",
    "sed",
    "awk",
    "xargs",
    "tr",

    # Networking / API
    "curl",
    "wget",

    # Elasticsearch tools
    "elastic",  # Elastic CLI if installed

    # Process / env
    "env",
    "export",
    "which",
    "whoami",
    "pwd",
    "cd",
    "source",
    "bash",
    "sh",

    # Archives
    "tar",
    "zip",
    "unzip",

    # JSON processing
    "jq",

    # Testing
    "pytest",
    "black",
    "ruff",
    "mypy",
}

# ── Blocked patterns ───────────────────────────────────────────────
# These patterns are ALWAYS blocked regardless of the command.
BLOCKED_PATTERNS: list[str] = [
    "rm -rf /",
    "rm -rf /*",
    "mkfs",
    "dd if=",
    ":(){:|:&};:",     # Fork bomb
    "shutdown",
    "reboot",
    "systemctl",
    "sudo",
    "su ",
    "passwd",
    "useradd",
    "userdel",
    "chmod 777",
    "curl | bash",
    "wget | bash",
    "eval $(",
    "> /dev/sd",
    "> /dev/null 2>&1 &",  # Background process hiding
]


def _extract_command(full_command: str) -> str:
    """Extract the base command from a full bash command string."""
    # Strip leading whitespace, env vars, etc.
    cmd = full_command.strip()

    # Handle command chains — check each part
    # We'll validate the first command; chains are checked via blocked patterns
    for prefix in ("&&", "||", "|", ";"):
        if prefix in cmd:
            cmd = cmd.split(prefix)[0].strip()

    # Skip env variable assignments
    while "=" in cmd.split()[0] if cmd.split() else False:
        parts = cmd.split(None, 1)
        cmd = parts[1] if len(parts) > 1 else ""

    # Get the base command name
    parts = cmd.split()
    if not parts:
        return ""

    base = parts[0]

    # Handle path-qualified commands: /usr/bin/python → python
    if "/" in base:
        base = base.rsplit("/", 1)[-1]

    return base


def validate_command(command: str) -> tuple[bool, str]:
    """
    Validate a bash command against the allowlist and blocked patterns.

    Returns:
        (is_allowed, reason)
    """
    if not command or not command.strip():
        return True, "Empty command"

    # Check blocked patterns first
    for pattern in BLOCKED_PATTERNS:
        if pattern in command:
            return False, f"Command contains blocked pattern: {pattern}"

    # Extract and check the base command
    base_cmd = _extract_command(command)
    if not base_cmd:
        return True, "No command extracted"

    if base_cmd not in ALLOWED_COMMANDS:
        return False, f"Command '{base_cmd}' is not in the allowlist"

    return True, "Allowed"


# ── PreToolUse hook ────────────────────────────────────────────────
# This is the hook function that the Claude Agent SDK calls BEFORE
# executing any tool. It validates bash commands against the allowlist.

async def check_bash_command(
    input_data: dict,
    tool_use_id: str,
    context: dict,
) -> dict:
    """
    PreToolUse hook for bash command validation.

    Called by Claude Agent SDK before every Bash tool invocation.
    Returns a deny decision if the command is not allowed.

    This mirrors the security hook pattern from:
    coleam00/Linear-Coding-Agent-Harness/security.py
    """
    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    # Only intercept Bash tool
    if tool_name != "Bash":
        return {}

    command = tool_input.get("command", "")
    is_allowed, reason = validate_command(command)

    if not is_allowed:
        return {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": (
                    f"🛑 BLOCKED: {reason}\n"
                    f"Command: {command}\n"
                    "Add to ALLOWED_COMMANDS in security.py if needed."
                ),
            }
        }

    # Allow the command
    return {}


# ── Claude settings (written to .claude_settings.json) ─────────────
CLAUDE_SETTINGS = {
    "permissions": {
        "allow": [
            "Bash(*)",
            "Read(*)",
            "Edit(*)",
            "Write(*)",
            "Glob(*)",
            "Grep(*)",
            "WebFetch(*)",
        ],
        "deny": [],
    },
}
