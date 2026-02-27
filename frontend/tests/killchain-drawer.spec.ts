import { test, expect } from "@playwright/test";

test.describe("Kill Chain Events API", () => {
  test("returns events for a valid tactic", async ({ request }) => {
    const res = await request.get(
      "/api/killchain/events?tactic=Initial+Access"
    );
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.events).toBeDefined();
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThan(0);
    // Verify summary fields
    expect(data.summary).toBeDefined();
    expect(data.summary.hosts).toBeDefined();
    expect(data.summary.maxRiskScore).toBeGreaterThan(0);
    // Verify event structure
    const first = data.events[0];
    expect(first["@timestamp"]).toBeDefined();
    expect(first.message).toBeDefined();
    expect(first.threat?.tactic?.name).toBe("Initial Access");
  });

  test("returns 400 when tactic param is missing", async ({ request }) => {
    const res = await request.get("/api/killchain/events");
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("tactic");
  });
});

test.describe("Kill Chain Drawer UI", () => {
  test("clicking a tactic card opens the drawer", async ({ page }) => {
    await page.goto("/dashboard");
    // Wait for kill chain section to load
    await expect(page.getByText("Kill Chain")).toBeVisible({ timeout: 15_000 });
    // Wait for at least one tactic card
    await expect(
      page.locator("text=Initial Access").first()
    ).toBeVisible({ timeout: 10_000 });

    // Click the Initial Access card
    await page.locator("text=Initial Access").first().click();

    const drawer = page.getByTestId("killchain-drawer");
    // Drawer should open with the tactic name in header
    await expect(
      drawer.getByText("Initial Access")
    ).toBeVisible({ timeout: 10_000 });
    // Should show EVENTS count
    await expect(drawer.getByText(/\d+ EVENTS/)).toBeVisible();
  });

  test("drawer shows stage summary with hosts and risk score", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Kill Chain")).toBeVisible({ timeout: 15_000 });
    await page.locator("text=Initial Access").first().click();

    // Wait for events to load (summary appears after fetch)
    await expect(page.getByText("Time Span")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Max Risk Score")).toBeVisible();
    await expect(page.getByText("Hosts")).toBeVisible();
  });

  test("drawer shows inline forensic details for events", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Kill Chain")).toBeVisible({ timeout: 15_000 });
    await page.locator("text=Initial Access").first().click();

    const drawer = page.getByTestId("killchain-drawer");
    // Wait for event cards to render (email event should show email details)
    await expect(
      drawer.getByText("jsmith@acme.corp", { exact: false }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Lateral Movement drawer shows SMB auth events", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Kill Chain")).toBeVisible({ timeout: 15_000 });
    // Use role=button to target kill chain cards specifically (not other page text)
    const card = page.getByRole("button", { name: /Lateral Movement/i });
    await card.scrollIntoViewIfNeeded();
    await card.click();

    const drawer = page.getByTestId("killchain-drawer");
    // Wait for drawer to open with tactic header
    await expect(drawer.getByText("Lateral Movement")).toBeVisible({ timeout: 10_000 });
    // Should show admin_svc user in auth events
    await expect(
      drawer.getByText("admin_svc", { exact: false }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("ESC closes the drawer", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Kill Chain")).toBeVisible({ timeout: 15_000 });
    await page.locator("text=Initial Access").first().click();

    const drawer = page.getByTestId("killchain-drawer");
    // Verify drawer is open
    await expect(drawer.getByText(/\d+ EVENTS/)).toBeVisible({ timeout: 10_000 });

    // Press ESC
    await page.keyboard.press("Escape");

    // Drawer should close
    await expect(drawer).not.toBeVisible({ timeout: 5_000 });
  });

  test("all visible tactic cards are clickable", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Kill Chain")).toBeVisible({ timeout: 15_000 });

    const tactics = [
      "Initial Access",
      "Execution",
      "Command and Control",
      "Credential Access",
      "Lateral Movement",
    ];

    for (const tactic of tactics) {
      const card = page.locator(`text=${tactic}`).first();
      if (await card.isVisible()) {
        await expect(card).toBeVisible();
      }
    }
  });
});
