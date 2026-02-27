import { test, expect } from "@playwright/test";

test.describe("Agent Builder Integration", () => {
  test("status API returns connected with agent metadata", async ({
    request,
  }) => {
    const res = await request.get("/api/agent-builder/status");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.connected).toBe(true);
    expect(data.agent).toBeDefined();
    expect(data.agent.id).toBe("dco_triage_agent");
    expect(data.agent.tool_count).toBe(7);
  });

  test("ping returns backend: agent_builder", async ({ request }) => {
    const res = await request.post("/api/chat", {
      data: { message: "__ping__" },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.backend).toBe("agent_builder");
    expect(data.ai).toBe(true);
  });

  test("chat converse returns response with backend and toolsUsed", async ({
    request,
  }) => {
    const res = await request.post("/api/chat", {
      data: {
        messages: [
          { role: "user", content: "Look up threat intel for 198.51.100.23" },
        ],
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.response).toBeTruthy();
    expect(data.backend).toBe("agent_builder");
    expect(data.toolsUsed).toBeDefined();
    expect(Array.isArray(data.toolsUsed)).toBe(true);
  });
});

test.describe("Dashboard UI", () => {
  test("shows connected Agent Builder panel with 7 tools", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // Wait for the panel to load
    await expect(page.getByText("Connected", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("7 tools", { exact: false }).first()).toBeVisible();
    await expect(page.locator("text=Chat with Agent")).toBeVisible();
  });
});

test.describe("Chat UI", () => {
  test("shows 7 tools in hero section", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.locator("text=7 tools")).toBeVisible();
    await expect(page.locator("text=Privilege Escalation")).toBeVisible();
    await expect(page.locator("text=Incident Workflow")).toBeVisible();
    await expect(page.locator("text=Correlated Events")).toBeVisible();
  });

  test("shows Agent Builder backend badge", async ({ page }) => {
    await page.goto("/chat");
    // Wait for ping to resolve and show backend badge
    await expect(page.getByText("Agent Builder", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("suggested prompts are clickable", async ({ page }) => {
    await page.goto("/chat");
    const prompt = page.locator(
      "button",
      { hasText: "Triage the latest critical" }
    );
    await expect(prompt).toBeVisible();
  });
});
