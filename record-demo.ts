/**
 * DCO Threat Triage Agent — Demo Video Recorder v3
 *
 * Records a ~3-4 minute walkthrough of the live Vercel deployment.
 * Fixes: no blank screens, includes Intel page, better pacing.
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

  // ─── Pre-load the dashboard BEFORE recording starts ──────────
  // This eliminates the blank white screen at the beginning
  console.log("Pre-loading dashboard (not recording yet)...");
  const preloadContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const preloadPage = await preloadContext.newPage();
  await preloadPage.goto(`${BASE_URL}/dashboard`, {
    waitUntil: "networkidle",
  });
  // Wait for actual content to render
  try {
    await preloadPage.waitForSelector("text=THREAT", { timeout: 15000 });
    console.log("  Dashboard content loaded!");
  } catch {
    console.log("  Dashboard content not detected, continuing anyway");
  }
  await preloadContext.close();

  // ─── Now start the real recording context ─────────────────────
  console.log("Starting video recording...");
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: "./demo-video/",
      size: { width: 1280, height: 720 },
    },
  });
  const page = await context.newPage();

  try {
    // ═══════════════════════════════════════════════════════════════
    // PART 1: DASHBOARD TOUR (~50 seconds)
    // ═══════════════════════════════════════════════════════════════

    // ─── Scene 1: Dashboard Hero + Stats ────────────────────────
    console.log("Scene 1: Dashboard Hero");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    // Wait for the stats to actually render
    try {
      await page.waitForSelector("text=TOTAL ALERTS", { timeout: 10000 });
    } catch {
      /* continue */
    }
    await page.waitForTimeout(6000);

    // ─── Scene 2: Agent Builder Panel — CONNECTED + 7 Tools ────
    console.log("Scene 2: Agent Builder Panel");
    await page.evaluate(() => {
      const panels = document.querySelectorAll('[class*="border-divider"]');
      for (const p of panels) {
        if (p.textContent?.includes("Elastic Agent Builder")) {
          p.scrollIntoView({ behavior: "smooth", block: "start" });
          break;
        }
      }
    });
    await page.waitForTimeout(6000);

    // ─── Scene 3: Architecture Diagram ──────────────────────────
    console.log("Scene 3: Architecture Diagram");
    await page.evaluate(() => {
      const el = [...document.querySelectorAll("h2, h3, div, span")].find(
        (h) => h.textContent?.trim().startsWith("ARCHITECTURE")
      );
      if (el)
        (el as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      else window.scrollBy({ top: 700, behavior: "smooth" });
    });
    await page.waitForTimeout(6000);

    // ─── Scene 4: Kill Chain Timeline ───────────────────────────
    console.log("Scene 4: Kill Chain Timeline");
    await page.evaluate(() => window.scrollBy({ top: 600, behavior: "smooth" }));
    await page.waitForTimeout(5000);

    // ─── Scene 5: Severity Distribution + Events Chart ──────────
    console.log("Scene 5: Severity + Charts");
    await page.evaluate(() => window.scrollBy({ top: 500, behavior: "smooth" }));
    await page.waitForTimeout(5000);

    // ═══════════════════════════════════════════════════════════════
    // PART 2: DATA PAGES (~20 seconds)
    // ═══════════════════════════════════════════════════════════════

    // ─── Scene 6: Alerts Page ───────────────────────────────────
    console.log("Scene 6: Alerts");
    await page.goto(`${BASE_URL}/alerts`, { waitUntil: "networkidle" });
    try {
      await page.waitForSelector("text=ALERTS", { timeout: 8000 });
    } catch {
      /* continue */
    }
    await page.waitForTimeout(5000);

    // ─── Scene 7: Threat Intel Page ─────────────────────────────
    console.log("Scene 7: Threat Intel");
    await page.goto(`${BASE_URL}/intel`, { waitUntil: "networkidle" });
    try {
      await page.waitForSelector("text=THREAT INTELLIGENCE", {
        timeout: 8000,
      });
    } catch {
      /* continue */
    }
    await page.waitForTimeout(5000);

    // ─── Scene 8: Incidents Page ────────────────────────────────
    console.log("Scene 8: Incidents");
    await page.goto(`${BASE_URL}/incidents`, { waitUntil: "networkidle" });
    try {
      await page.waitForSelector("text=INCIDENTS", { timeout: 8000 });
    } catch {
      /* continue */
    }
    await page.waitForTimeout(5000);

    // ═══════════════════════════════════════════════════════════════
    // PART 3: AGENT CHAT — THE MAIN EVENT (~2+ minutes)
    // ═══════════════════════════════════════════════════════════════

    // ─── Scene 9: Agent Chat Page — Show tools + suggested prompts
    console.log("Scene 9: Agent Chat");
    await page.goto(`${BASE_URL}/chat`, { waitUntil: "networkidle" });
    try {
      await page.waitForSelector("text=AGENT BUILDER", { timeout: 8000 });
    } catch {
      /* continue */
    }
    await page.waitForTimeout(6000);

    // ─── Scene 10: Scroll to show suggested prompts ─────────────
    console.log("Scene 10: Suggested prompts");
    await page.evaluate(() =>
      window.scrollBy({ top: 200, behavior: "smooth" })
    );
    await page.waitForTimeout(4000);

    // ─── Scene 11: Scroll back up and type triage prompt ────────
    console.log("Scene 11: Typing triage prompt...");
    await page.evaluate(() =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
    await page.waitForTimeout(1000);
    const input = page.locator('input[placeholder*="Ask"]');
    await input.click();
    await input.type("Triage the latest critical alerts from 10.10.15.42", {
      delay: 80,
    });
    await page.waitForTimeout(1000);
    await page.keyboard.press("Enter");
    console.log("  Prompt sent, waiting for Agent Builder...");

    // ─── Scene 12: Wait for Agent Builder Response ──────────────
    console.log("Scene 12: Waiting for Agent Builder response (up to 120s)...");
    const startWait = Date.now();
    try {
      await page.waitForSelector('[data-backend="agent_builder"]', {
        timeout: 120_000,
      });
      const elapsed = ((Date.now() - startWait) / 1000).toFixed(1);
      console.log(`  Agent Builder responded in ${elapsed}s!`);
    } catch {
      console.log(
        "  Timeout waiting for agent_builder selector — continuing"
      );
    }
    // Let the response fully render
    await page.waitForTimeout(5000);

    // ─── Scene 13: Scroll to see AGENT BUILDER badge + response start
    console.log("Scene 13: Scroll to response start");
    await page.evaluate(() => {
      const badge = document.querySelector('[data-backend="agent_builder"]');
      if (badge)
        badge.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    await page.waitForTimeout(5000);

    // ─── Scene 14-18: Slowly scroll through the FULL response ───
    console.log("Scene 14: Scrolling through response...");
    for (let i = 1; i <= 6; i++) {
      console.log(`  Scroll ${i}/6`);
      await page.evaluate(() =>
        window.scrollBy({ top: 300, behavior: "smooth" })
      );
      await page.waitForTimeout(5000);
    }

    // ─── Scene 19: Scroll to tool badges ────────────────────────
    console.log("Scene 19: Tool badges");
    await page.evaluate(() => {
      const badges = document.querySelector('[class*="accent-orange"]');
      if (badges)
        badges.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    await page.waitForTimeout(5000);

    // ─── Scene 20: Expand Execution Trace ───────────────────────
    console.log("Scene 20: Execution Trace");
    const traceBtn = page.locator("button", {
      hasText: "Agent Execution Trace",
    });
    if ((await traceBtn.count()) > 0) {
      await traceBtn.click();
      await page.waitForTimeout(4000);
      // Scroll through trace steps
      await page.evaluate(() =>
        window.scrollBy({ top: 400, behavior: "smooth" })
      );
      await page.waitForTimeout(5000);
      await page.evaluate(() =>
        window.scrollBy({ top: 400, behavior: "smooth" })
      );
      await page.waitForTimeout(4000);
    } else {
      console.log("  No execution trace found — skipping");
      await page.waitForTimeout(3000);
    }

    // ─── Scene 21: Scroll back to top — show Triage Summary ─────
    console.log("Scene 21: Final — Triage Summary");
    await page.evaluate(() => {
      const badge = document.querySelector('[data-backend="agent_builder"]');
      if (badge)
        badge.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
    await page.waitForTimeout(6000);

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
