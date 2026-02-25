"""
Prompt loader for the DCO Threat Triage Agent harness.

Reads markdown prompt files from the project root directory.
Used by agent.py to load system prompts and task prompts.
"""

from pathlib import Path


# Project root is the directory containing this file
_PROJECT_ROOT = Path(__file__).resolve().parent


def load_prompt(filename: str) -> str:
    """
    Load a markdown prompt file from the project root.

    Args:
        filename: Name of the markdown file (e.g., "initializer_prompt.md")

    Returns:
        The file contents as a string.

    Raises:
        FileNotFoundError: If the prompt file doesn't exist.
    """
    path = _PROJECT_ROOT / filename
    if not path.exists():
        raise FileNotFoundError(
            f"Prompt file not found: {path}\n"
            f"Expected location: {_PROJECT_ROOT}"
        )
    return path.read_text(encoding="utf-8")
