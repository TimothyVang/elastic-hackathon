/**
 * DCO Threat Triage Agent — Chat Response Scroll Recorder
 *
 * Records a smooth scroll of the full triage response in the chat UI.
 * Sends the pre-built suggested prompt, waits for the agent response,
 * then smoothly scrolls through the entire response.
 *
 * Usage:
 *   npx tsx record-chat-scroll.ts
 *
 * Output:
 *   ./demo-video/chat-scroll/<hash>.webm
 */

import { chromium } from "playwright";

const FRONTEND_URL = "https://frontend-drab-xi-56.vercel.app";

async function recordChatScroll() {
  console.log("Launching browser for chat scroll recording...");

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: "./demo-video/chat-scroll/",
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  try {
    // ─── Navigate to chat page ───────────────────────────────────
    console.log("Navigating to chat page...");
    await page.goto(`${FRONTEND_URL}/chat`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    // ─── Wait for backend ready indicator ────────────────────────
    console.log("Waiting for AGENT BUILDER badge...");
    try {
      await page.waitForSelector("text=AGENT BUILDER", { timeout: 15000 });
      console.log("  Backend ready!");
    } catch {
      console.log("  Badge not found — continuing anyway");
    }
    await page.waitForTimeout(1000);

    // ─── Click the suggested triage prompt ───────────────────────
    console.log("Clicking suggested prompt...");
    try {
      const prompt = page.locator("text=Triage the latest critical alerts").first();
      if (await prompt.isVisible({ timeout: 5000 })) {
        await prompt.click();
        console.log("  Prompt clicked!");
      } else {
        // Fallback: type the prompt manually
        console.log("  Suggested prompt not visible, typing manually...");
        const input = page.locator("textarea, input[type='text']").first();
        await input.fill("Triage the latest critical alerts from 10.10.15.42");
        await input.press("Enter");
      }
    } catch {
      console.log("  Falling back to manual input...");
      const input = page.locator("textarea, input[type='text']").first();
      await input.fill("Triage the latest critical alerts from 10.10.15.42");
      await input.press("Enter");
    }

    // ─── Wait for agent response ─────────────────────────────────
    console.log("Waiting for agent response (up to 120s)...");
    try {
      await page.waitForSelector("text=TRUE POSITIVE", { timeout: 120000 });
      console.log("  Response received — TRUE POSITIVE found!");
    } catch {
      console.log("  TRUE POSITIVE not found — checking for any response...");
      // Check if there's any response at all
      try {
        await page.waitForSelector("text=triage", { timeout: 10000 });
        console.log("  Some response found, proceeding...");
      } catch {
        console.log("  No response detected — aborting scroll recording");
        await page.screenshot({ path: "./demo-video/chat-scroll/debug-no-response.png" });
        throw new Error("Agent did not respond in time");
      }
    }

    // ─── Let rendering settle ────────────────────────────────────
    console.log("Letting response render...");
    await page.waitForTimeout(3000);

    // ─── Take a screenshot for debug ─────────────────────────────
    await page.screenshot({ path: "./demo-video/chat-scroll/debug-before-scroll.png" });

    // ─── Smooth scroll through the response ──────────────────────
    console.log("Starting smooth scroll...");

    // First scroll to top of the response container
    const scrollContainer = page.locator("div.overflow-y-auto").first();

    // Get scroll dimensions
    const scrollInfo = await scrollContainer.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollTop: el.scrollTop,
    }));
    console.log(`  Scroll height: ${scrollInfo.scrollHeight}, visible: ${scrollInfo.clientHeight}`);

    const totalScroll = scrollInfo.scrollHeight - scrollInfo.clientHeight;
    if (totalScroll <= 0) {
      console.log("  No scrolling needed — content fits in view");
    } else {
      // Smooth scroll using requestAnimationFrame for native smoothness
      // ~2px per frame at 60fps = ~120px/s, so for 2000px that's ~17s
      const PIXELS_PER_FRAME = 2;
      const scrollDuration = Math.ceil((totalScroll / PIXELS_PER_FRAME) / 60 * 1000);
      console.log(`  Total scroll: ${totalScroll}px, estimated duration: ${(scrollDuration / 1000).toFixed(1)}s`);

      // Use page.evaluate with a selector string to avoid tsx __name injection
      await page.evaluate(
        `new Promise((resolve) => {
          const el = document.querySelector('div.overflow-y-auto');
          let current = 0;
          const total = ${totalScroll};
          const ppf = ${PIXELS_PER_FRAME};
          const step = () => {
            current = Math.min(current + ppf, total);
            el.scrollTop = current;
            if (current < total) {
              requestAnimationFrame(step);
            } else {
              resolve();
            }
          };
          requestAnimationFrame(step);
        })`
      );

      console.log("  Scroll complete!");
    }

    // ─── Hold at bottom ──────────────────────────────────────────
    console.log("Holding at bottom for 3s...");
    await page.waitForTimeout(3000);

    console.log("Chat scroll recording complete!");
  } catch (err) {
    console.error("Error during recording:", err);
    await page.screenshot({ path: "./demo-video/chat-scroll/debug-error.png" });
  }

  // ─── Finalize ─────────────────────────────────────────────────
  console.log("Finalizing video...");
  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();
  console.log(`Chat scroll clip saved to: ${videoPath}`);
}

recordChatScroll().catch((err) => {
  console.error("Recording failed:", err);
  process.exit(1);
});
