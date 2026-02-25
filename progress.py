"""
Progress tracking for the DCO Threat Triage Agent harness.

Reads task_tracker.json and displays progress using Rich tables.
Used by the autonomous agent harness to determine which tasks
are complete and what remains.
"""

import json
from pathlib import Path

from rich.console import Console
from rich.table import Table


class ProgressTracker:
    """
    Tracks task progress via task_tracker.json.

    Each task has:
      - id: int
      - name: str
      - description: str
      - status: "passing" | "failing"
      - priority: "high" | "medium" | "low"
      - category: str
    """

    def __init__(self, path: Path | str | None = None) -> None:
        self.tasks: list[dict] = []
        self.path: Path | None = None
        if path is not None:
            self.load(path)

    def load(self, path: Path | str) -> None:
        """Load tasks from a task_tracker.json file."""
        self.path = Path(path)
        if self.path.exists():
            self.tasks = json.loads(self.path.read_text(encoding="utf-8"))
        else:
            self.tasks = []

    def save(self) -> None:
        """Write current task state back to disk."""
        if self.path is None:
            raise ValueError("No path set — call load() first or set self.path")
        self.path.write_text(
            json.dumps(self.tasks, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    @property
    def passing(self) -> list[dict]:
        return [t for t in self.tasks if t.get("status") == "passing"]

    @property
    def failing(self) -> list[dict]:
        return [t for t in self.tasks if t.get("status") == "failing"]

    def all_tasks_complete(self) -> bool:
        """Return True if every task has status 'passing'."""
        if not self.tasks:
            return False
        return all(t.get("status") == "passing" for t in self.tasks)

    def mark_passing(self, task_id: int, notes: str = "") -> None:
        """Mark a task as passing by its ID."""
        for task in self.tasks:
            if task["id"] == task_id:
                task["status"] = "passing"
                if notes:
                    task["notes"] = notes
                break

    def next_failing(self) -> dict | None:
        """Get the next failing task, prioritized by priority then ID."""
        priority_order = {"high": 0, "medium": 1, "low": 2}
        failing = sorted(
            self.failing,
            key=lambda t: (priority_order.get(t.get("priority", "low"), 3), t["id"]),
        )
        return failing[0] if failing else None

    def print_summary(self) -> None:
        """Print a Rich table showing task progress."""
        console = Console()

        if not self.tasks:
            console.print("[dim]No tasks loaded.[/]")
            return

        table = Table(
            title="DCO Threat Triage Agent — Task Progress",
            show_lines=True,
        )
        table.add_column("#", style="dim", width=4, justify="right")
        table.add_column("Task", style="bold", min_width=30)
        table.add_column("Category", style="cyan", width=14)
        table.add_column("Priority", width=8)
        table.add_column("Status", width=10, justify="center")

        for task in self.tasks:
            status = task.get("status", "unknown")
            if status == "passing":
                status_display = "[bold green]PASS[/]"
            elif status == "failing":
                status_display = "[bold red]FAIL[/]"
            else:
                status_display = f"[yellow]{status}[/]"

            priority = task.get("priority", "—")
            priority_style = {
                "high": "[red]high[/]",
                "medium": "[yellow]medium[/]",
                "low": "[dim]low[/]",
            }.get(priority, priority)

            table.add_row(
                str(task.get("id", "?")),
                task.get("name", "Unnamed"),
                task.get("category", "—"),
                priority_style,
                status_display,
            )

        console.print(table)

        total = len(self.tasks)
        done = len(self.passing)
        console.print(
            f"\n  [bold]{done}/{total}[/] tasks complete "
            f"({'[bold green]ALL DONE!' if self.all_tasks_complete() else f'[yellow]{total - done} remaining'}[/])\n"
        )


if __name__ == "__main__":
    # Quick self-test: load tracker from current dir or project dir
    import sys

    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("task_tracker.json")
    tracker = ProgressTracker(path)
    tracker.print_summary()
