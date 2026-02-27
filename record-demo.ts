/**
 * DCO Threat Triage Agent — Demo Video Recorder
 *
 * Records a ~3 minute walkthrough of the live Vercel deployment.
 * Uses Playwright's recordVideo API to capture as .webm.
 *
 * Usage:
 *   npx tsx record-demo.ts
 *
 * Output:
 *   ./demo-video/*.webm — convert to mp4, add voiceover, upload to YouTube/Vimeo
 */

import { chromium } from "playwright";

const BASE_URL = "https://frontend-drab-xi-56.vercel.app";

async function recordDemo() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: "./demo-video/",
      size: { width: 1280, height: 720 },
    },
  });
  const page = await context.newPage();

  // ─── Scene 1: Dashboard Hero + Stats (0:00–0:15) ──────────────
  console.log("Scene 1: Dashboard");
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(5000);

  // ─── Scene 2: Agent Builder Panel — Connected + 7 Tools (0:15–0:25) ──
  console.log("Scene 2: Agent Builder Panel");
  await page.evaluate(() => {
    const panel = document.querySelector('[class*="bg-base-dark"]');
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  await page.waitForTimeout(5000);

  // ─── Scene 3: Architecture Diagram (0:25–0:35) ────────────────
  console.log("Scene 3: Architecture Diagram");
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(5000);

  // ─── Scene 4: Kill Chain Timeline (0:35–0:42) ─────────────────
  console.log("Scene 4: Kill Chain");
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(3000);

  // ─── Scene 5: Alerts Page (0:42–0:50) ─────────────────────────
  console.log("Scene 5: Alerts");
  await page.goto(`${BASE_URL}/alerts`);
  await page.waitForTimeout(4000);

  // Filter to critical
  const severitySelect = page.locator("select").first();
  await severitySelect.selectOption("Critical");
  await page.waitForTimeout(3000);

  // ─── Scene 6: Threat Intel (0:50–0:58) ────────────────────────
  console.log("Scene 6: Threat Intel");
  await page.goto(`${BASE_URL}/intel`);
  await page.waitForTimeout(4000);

  // ─── Scene 7: Incidents (0:58–1:05) ───────────────────────────
  console.log("Scene 7: Incidents");
  await page.goto(`${BASE_URL}/incidents`);
  await page.waitForTimeout(4000);

  // ─── Scene 8: Hunt — Beaconing (1:05–1:12) ────────────────────
  console.log("Scene 8: Hunt Beaconing");
  await page.goto(`${BASE_URL}/hunt/beaconing`);
  await page.waitForTimeout(4000);

  // ─── Scene 9: Agent Chat — Send Triage Prompt (1:12–1:20) ─────
  console.log("Scene 9: Agent Chat");
  await page.goto(`${BASE_URL}/chat`);
  await page.waitForTimeout(3000);

  // Type the triage prompt slowly (looks natural in video)
  const input = page.locator('input[placeholder*="Ask"]');
  await input.click();
  await input.type("Triage the latest critical alerts from 10.10.15.42", {
    delay: 80,
  });
  await page.waitForTimeout(1000);
  await page.keyboard.press("Enter");

  // ─── Scene 10: Wait for Agent Builder Response (1:20–2:30) ────
  console.log("Scene 10: Waiting for Agent Builder response (up to 120s)...");
  try {
    await page.waitForSelector('[data-backend="agent_builder"]', {
      timeout: 120_000,
    });
    console.log("Agent Builder responded!");
  } catch {
    console.log("Response timeout — checking for any response");
  }
  await page.waitForTimeout(5000);

  // Scroll through the response
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(3000);

  // ─── Scene 11: Expand Execution Trace (2:30–2:40) ─────────────
  console.log("Scene 11: Execution Trace");
  const traceBtn = page.locator("button", {
    hasText: "Agent Execution Trace",
  });
  if ((await traceBtn.count()) > 0) {
    await traceBtn.click();
    await page.waitForTimeout(4000);
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(3000);
  }

  // ─── Scene 12: Follow-up Message (2:40–2:55) ──────────────────
  console.log("Scene 12: Follow-up");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await input.click();
  await input.type("Check for beaconing to 198.51.100.23", { delay: 80 });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(15000);

  // ─── Scene 13: Final Pause (2:55–3:00) ────────────────────────
  console.log("Scene 13: Final");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(3000);

  // ─── Finalize ─────────────────────────────────────────────────
  console.log("Finalizing video...");
  await context.close(); // This triggers video file finalization
  await browser.close();
  console.log("Demo video saved to ./demo-video/");
  console.log(
    "Next steps: convert .webm to .mp4, add voiceover, upload to YouTube/Vimeo"
  );
}

recordDemo().catch((err) => {
  console.error("Demo recording failed:", err);
  process.exit(1);
});
