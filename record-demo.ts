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
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: "./demo-video/",
      size: { width: 1280, height: 720 },
    },
  });
  const page = await context.newPage();

  try {
    // ─── Scene 1: Dashboard Hero + Stats (0:00–0:08) ──────────────
    console.log("Scene 1: Dashboard");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await page.waitForTimeout(4000);

    // ─── Scene 2: Agent Builder Panel — Connected + 7 Tools (0:08–0:16) ──
    console.log("Scene 2: Agent Builder Panel");
    await page.evaluate(() => {
      const panels = document.querySelectorAll('[class*="border-divider"]');
      for (const p of panels) {
        if (p.textContent?.includes("Elastic Agent Builder")) {
          p.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
    });
    await page.waitForTimeout(4000);

    // ─── Scene 3: Architecture Diagram (0:16–0:24) ────────────────
    console.log("Scene 3: Architecture Diagram");
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(4000);

    // ─── Scene 4: Kill Chain Timeline (0:24–0:30) ─────────────────
    console.log("Scene 4: Kill Chain");
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(3000);

    // ─── Scene 5: Alerts Page (0:30–0:36) ─────────────────────────
    console.log("Scene 5: Alerts");
    await page.goto(`${BASE_URL}/alerts`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // ─── Scene 6: Threat Intel (0:36–0:42) ────────────────────────
    console.log("Scene 6: Threat Intel");
    await page.goto(`${BASE_URL}/intel`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // ─── Scene 7: Incidents (0:42–0:48) ───────────────────────────
    console.log("Scene 7: Incidents");
    await page.goto(`${BASE_URL}/incidents`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // ─── Scene 8: Agent Chat — Show 7 tools (0:48–0:55) ──────────
    console.log("Scene 8: Agent Chat");
    await page.goto(`${BASE_URL}/chat`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // ─── Scene 9: Send Triage Prompt (0:55–1:05) ─────────────────
    console.log("Scene 9: Typing triage prompt...");
    const input = page.locator('input[placeholder*="Ask"]');
    await input.click();
    await input.type("Triage the latest critical alerts from 10.10.15.42", {
      delay: 60,
    });
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");
    console.log("  Prompt sent, waiting for Agent Builder...");

    // ─── Scene 10: Wait for Agent Builder Response (1:05–2:30) ────
    console.log("Scene 10: Waiting for Agent Builder response (up to 120s)...");
    try {
      await page.waitForSelector('[data-backend="agent_builder"]', {
        timeout: 120_000,
      });
      console.log("  Agent Builder responded!");
    } catch {
      console.log("  Timeout waiting for agent_builder selector — continuing");
    }
    await page.waitForTimeout(3000);

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
      await page.waitForTimeout(3000);
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(3000);
    } else {
      console.log("  No execution trace found — skipping");
      await page.waitForTimeout(2000);
    }

    // ─── Scene 12: Scroll to tool badges (2:40–2:50) ─────────────
    console.log("Scene 12: Tool badges");
    await page.evaluate(() => {
      const badges = document.querySelector('[class*="accent-orange"]');
      if (badges) badges.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    await page.waitForTimeout(3000);

    // ─── Scene 13: Back to top for final view (2:50–3:00) ────────
    console.log("Scene 13: Final");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await page.waitForTimeout(3000);

    console.log("All scenes recorded successfully!");
  } catch (err) {
    console.error("Error during recording:", err);
  }

  // ─── Finalize ─────────────────────────────────────────────────
  console.log("Finalizing video...");
  const videoPath = await page.video()?.path();
  await context.close(); // This triggers video file finalization
  await browser.close();
  console.log(`Demo video saved to: ${videoPath || "./demo-video/"}`);
  console.log(
    "Next steps: convert .webm to .mp4, add voiceover, upload to YouTube/Vimeo"
  );
}

recordDemo().catch((err) => {
  console.error("Demo recording failed:", err);
  process.exit(1);
});
