/**
 * DCO Threat Triage Agent — Kibana Agent Builder UI Recorder
 *
 * Records the Elastic Agent Builder interface in Kibana:
 * - Agents list with dco_triage_agent
 * - Agent config with 7 active tools
 * - Individual tool definition (ES|QL query visible)
 * - Global tools list
 *
 * Also records 2 hunt pages from the frontend to show individual tool outputs.
 *
 * Usage:
 *   npx tsx record-kibana.ts
 *
 * Output:
 *   ./demo-video/kibana-clip.webm
 */

import { chromium } from "playwright";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const KIBANA_URL = process.env.KIBANA_URL!;
const API_KEY = process.env.ELASTIC_API_KEY!;
const FRONTEND_URL = "https://frontend-drab-xi-56.vercel.app";

if (!KIBANA_URL || !API_KEY) {
  console.error("Missing KIBANA_URL or ELASTIC_API_KEY in .env");
  process.exit(1);
}

async function recordKibana() {
  console.log(`Kibana URL: ${KIBANA_URL}`);
  console.log("Launching browser...");

  const browser = await chromium.launch({ headless: true });

  // Create context with API key auth headers and video recording
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    extraHTTPHeaders: {
      Authorization: `ApiKey ${API_KEY}`,
      "kbn-xsrf": "true",
    },
    recordVideo: {
      dir: "./demo-video/kibana/",
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  try {
    // ═══════════════════════════════════════════════════════════════
    // PART A: KIBANA AGENT BUILDER UI (~25 seconds)
    // ═══════════════════════════════════════════════════════════════

    // ─── Scene 1: Agent Builder — Agents List ───────────────────
    console.log("Scene 1: Navigating to Agent Builder Agents...");
    await page.goto(`${KIBANA_URL}/app/agent_builder/agents`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    // Wait for content to load
    await page.waitForTimeout(2000);
    try {
      await page.waitForSelector("text=dco_triage_agent", { timeout: 10000 });
      console.log("  Found dco_triage_agent!");
    } catch {
      console.log("  dco_triage_agent selector not found — checking page...");
      const title = await page.title();
      const url = page.url();
      console.log(`  Page title: ${title}, URL: ${url}`);
      // Take debug screenshot
      await page.screenshot({ path: "./demo-video/kibana/debug-agents.png" });
    }
    await page.waitForTimeout(5000);

    // ─── Scene 2: Click into DCO Triage Agent ───────────────────
    console.log("Scene 2: Opening DCO Triage Agent config...");
    try {
      const agentLink = page.locator("text=dco_triage_agent").first();
      if (await agentLink.isVisible()) {
        await agentLink.click();
        await page.waitForTimeout(3000);
      } else {
        // Try direct URL
        await page.goto(
          `${KIBANA_URL}/app/agent_builder/agents/dco_triage_agent`,
          { waitUntil: "networkidle", timeout: 15000 }
        );
        await page.waitForTimeout(2000);
      }
    } catch {
      console.log("  Could not click agent — trying direct URL");
      await page.goto(
        `${KIBANA_URL}/app/agent_builder/agents/dco_triage_agent`,
        { waitUntil: "networkidle", timeout: 15000 }
      );
      await page.waitForTimeout(2000);
    }
    await page.screenshot({
      path: "./demo-video/kibana/debug-agent-config.png",
    });
    await page.waitForTimeout(5000);

    // ─── Scene 3: Click Tools tab — show 7 active tools ─────────
    console.log("Scene 3: Tools tab...");
    try {
      const toolsTab = page.locator("text=Tools").first();
      if (await toolsTab.isVisible()) {
        await toolsTab.click();
        await page.waitForTimeout(3000);
      }
    } catch {
      console.log("  Could not find Tools tab");
    }
    await page.screenshot({
      path: "./demo-video/kibana/debug-tools-tab.png",
    });
    await page.waitForTimeout(5000);

    // ─── Scene 4: Navigate to global Tools list ─────────────────
    console.log("Scene 4: Global tools list...");
    await page.goto(`${KIBANA_URL}/app/agent_builder/tools`, {
      waitUntil: "networkidle",
      timeout: 15000,
    });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "./demo-video/kibana/debug-tools-list.png",
    });
    await page.waitForTimeout(5000);

    // ─── Scene 5: Click into beaconing_detection tool ───────────
    console.log("Scene 5: Beaconing detection tool definition...");
    try {
      const toolLink = page.locator("text=beaconing_detection").first();
      if (await toolLink.isVisible()) {
        await toolLink.click();
        await page.waitForTimeout(3000);
      } else {
        await page.goto(
          `${KIBANA_URL}/app/agent_builder/tools/beaconing_detection`,
          { waitUntil: "networkidle", timeout: 15000 }
        );
        await page.waitForTimeout(2000);
      }
    } catch {
      console.log("  Could not click tool — trying direct URL");
      await page.goto(
        `${KIBANA_URL}/app/agent_builder/tools/beaconing_detection`,
        { waitUntil: "networkidle", timeout: 15000 }
      );
      await page.waitForTimeout(2000);
    }
    await page.screenshot({
      path: "./demo-video/kibana/debug-tool-detail.png",
    });
    await page.waitForTimeout(5000);

    // ═══════════════════════════════════════════════════════════════
    // PART B: FRONTEND HUNT PAGES (~15 seconds)
    // Show individual tool outputs
    // ═══════════════════════════════════════════════════════════════

    // ─── Scene 6: Beaconing Detection hunt page ─────────────────
    console.log("Scene 6: Frontend — Beaconing Detection hunt page");
    await page.goto(`${FRONTEND_URL}/hunt/beaconing`, {
      waitUntil: "networkidle",
      timeout: 15000,
    });
    try {
      await page.waitForSelector("text=BEACONING", { timeout: 8000 });
    } catch {
      /* continue */
    }
    await page.waitForTimeout(5000);

    // ─── Scene 7: Lateral Movement hunt page ────────────────────
    console.log("Scene 7: Frontend — Lateral Movement hunt page");
    await page.goto(`${FRONTEND_URL}/hunt/lateral`, {
      waitUntil: "networkidle",
      timeout: 15000,
    });
    try {
      await page.waitForSelector("text=LATERAL", { timeout: 8000 });
    } catch {
      /* continue */
    }
    await page.waitForTimeout(5000);

    // ─── Scene 8: Process Chain hunt page ───────────────────────
    console.log("Scene 8: Frontend — Process Chain hunt page");
    await page.goto(`${FRONTEND_URL}/hunt/process`, {
      waitUntil: "networkidle",
      timeout: 15000,
    });
    try {
      await page.waitForSelector("text=PROCESS", { timeout: 8000 });
    } catch {
      /* continue */
    }
    await page.waitForTimeout(5000);

    console.log("All scenes recorded!");
  } catch (err) {
    console.error("Error during recording:", err);
    await page.screenshot({ path: "./demo-video/kibana/debug-error.png" });
  }

  // ─── Finalize ─────────────────────────────────────────────────
  console.log("Finalizing video...");
  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();
  console.log(`Kibana clip saved to: ${videoPath}`);
  console.log("Next: run splice script to merge with existing demo");
}

recordKibana().catch((err) => {
  console.error("Recording failed:", err);
  process.exit(1);
});
