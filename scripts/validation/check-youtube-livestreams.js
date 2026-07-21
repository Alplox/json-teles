const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const util = require("util");
const { parseArgs, applyIndexFilters } = require("../utils/cli-args.js");

const execFileAsync = util.promisify(execFile);

/**
 * Checks YouTube channels for active livestreams using yt-dlp.
 *
 * Optimizations:
 * - Parallel processing (4 channels simultaneously via async execFile)
 * - Skip recently checked channels
 * - Priority-based checking (live channels checked more often)
 * - Retry logic for transient failures
 *
 * Usage:
 *   node scripts/check-youtube-livestreams.js [--dry-run] [--force] [--id ID] [--channel ID] [--from N] [--to N] [--limit N]
 */

const COUNTRIES_DIR = path.join(__dirname, "../..", "countries");
const BUILD_SCRIPT = path.join(__dirname, "..", "core", "build-channels.js");

// Configuration
const CONCURRENCY = 16;
const BATCH_DELAY_MS = 500;
const SKIP_THRESHOLD_MS = 30 * 60 * 1000; // 30 min for normal channels
const PRIORITY_SKIP_MS = 15 * 60 * 1000; // 15 min for channels that were live
const YTDLP_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 1;

const cliArgs = parseArgs(process.argv.slice(2), [
  { name: "channel", type: "string" },
  { name: "id", type: "string" },
  { name: "limit", type: "number" },
  { name: "from", type: "number" },
  { name: "to", type: "number" },
  { name: "dry-run", type: "boolean" },
  { name: "force", type: "boolean" },
]);

/**
 * Parses yt-dlp output for live video IDs.
 * @param {string} output - Raw stdout from yt-dlp.
 * @returns {string[]} Array of live video IDs.
 */
function parseLiveIds(output) {
  const lines = output
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const liveIds = [];
  for (const line of lines) {
    const [id, status] = line.split("|");
    if (id && status === "is_live" && id.length === 11) {
      liveIds.push(id);
    }
  }
  return liveIds;
}

async function checkYouTubeYtDlp(channelId) {
  const url = `https://www.youtube.com/channel/${channelId}/streams`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const args = [
        "--flat-playlist",
        "--print",
        "%(id)s|%(live_status)s",
        "--no-warnings",
        "--playlist-end",
        "10",
        url,
      ];

      const { stdout, stderr } = await execFileAsync("yt-dlp", args, { timeout: YTDLP_TIMEOUT_MS });

      if (stderr && stderr.trim()) {
        console.warn(`  [yt-dlp] ${channelId}: ${stderr.trim().split("\n")[0]}`);
      }

      const liveIds = parseLiveIds(stdout);
      if (liveIds.length === 0 && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS + Math.random() * 1000);
        continue;
      }
      return liveIds;
    } catch (err) {
      const output = err.stdout || "";
      if (output) {
        const liveIds = parseLiveIds(output);
        if (liveIds.length > 0) return liveIds;
      }

      const stderrText = err.stderr || "";
      const messageText = err.message || "";
      if (
        stderrText.includes("is not currently live") ||
        messageText.includes("is not currently live")
      ) {
        return [];
      }

      if (err.code !== "ETIME") {
        const errorDesc =
          err.stderr && err.stderr.trim()
            ? err.stderr.trim().split("\n")[0]
            : err.message.split("\n")[0];
        console.error(`  [yt-dlp] ${channelId}: ${errorDesc}`);
      }
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS + Math.random() * 1000);
        continue;
      }
      return [];
    }
  }
  return [];
}

async function fetchUrlHtml(targetUrl, redirectCount = 0) {
  if (redirectCount > 3) throw new Error("Too many redirects");
  const res = await fetch(targetUrl, {
    signal: AbortSignal.timeout(10000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Cookie: "CONSENT=YES+cb.20230530-04-p0.en+FX+904",
    },
  });
  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const loc = res.headers.get("location");
    if (loc)
      return fetchUrlHtml(
        loc.startsWith("/") ? `https://www.youtube.com${loc}` : loc,
        redirectCount + 1,
      );
  }
  if (!res.ok) throw new Error(`HTTP status ${res.status}`);
  return res.text();
}

/**
 * Extracts and parses ytInitialData from YouTube page HTML.
 * @param {string} html - Page HTML.
 * @returns {Object|null} Parsed ytInitialData or null.
 */
function extractYtInitialData(html) {
  const marker = "ytInitialData = ";
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) return null;

  const start = html.indexOf("{", startIdx);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;

  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (ch === "\\" && inString) {
      i++;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth === 0) {
      try {
        return JSON.parse(html.substring(start, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Recursively walks ytInitialData to find all lockupViewModel entries
 * with a LIVE thumbnail badge (language-independent, uses badgeStyle enum).
 * @param {Object} obj - ytInitialData object.
 * @returns {string[]} Array of live video IDs (deduplicated).
 */
function findLiveVideoIds(obj) {
  const results = [];

  function walk(value) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }

    // lockupViewModel with contentId = video entry
    if (value.contentId && value.contentType === "LOCKUP_CONTENT_TYPE_VIDEO") {
      if (hasLiveBadge(value)) results.push(value.contentId);
      return;
    }

    for (const v of Object.values(value)) walk(v);
  }

  function hasLiveBadge(obj) {
    function search(o) {
      if (!o || typeof o !== "object") return false;
      if (Array.isArray(o)) return o.some(search);
      if (o.thumbnailBadgeViewModel?.badgeStyle === "THUMBNAIL_OVERLAY_BADGE_STYLE_LIVE") {
        return true;
      }
      return Object.values(o).some(search);
    }
    return search(obj);
  }

  walk(obj);
  return [...new Set(results)];
}

function isBotPage(html) {
  return (
    html.includes("confirm you're not a bot") ||
    html.includes("confirm you\u2019re not a bot") ||
    html.includes("g-recaptcha") ||
    html.includes("robot check")
  );
}

async function checkYouTubeLive(channelId) {
  // Method 1: Parse /streams tab for multiple live videos
  try {
    const html = await fetchUrlHtml(`https://www.youtube.com/channel/${channelId}/streams`);
    if (!isBotPage(html)) {
      const ytData = extractYtInitialData(html);
      if (ytData) {
        const ids = findLiveVideoIds(ytData);
        if (ids.length > 0) return ids;
      }
    }
  } catch (err) {
    console.warn(`  [streams-html] ${channelId}: ${err.message}`);
  }

  // Method 2: Fast single-stream check on /live
  try {
    const html = await fetchUrlHtml(`https://www.youtube.com/channel/${channelId}/live`);
    if (!isBotPage(html)) {
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      if (html.includes('"isLive":true') && canonical?.includes("watch?v=")) {
        const v = canonical.match(/v=([^&]+)/)?.[1];
        if (v) return [v];
      }
    }
  } catch (err) {
    console.warn(`  [live-html] ${channelId}: ${err.message}`);
  }

  // Method 3: yt-dlp fallback
  return checkYouTubeYtDlp(channelId);
}

function shouldSkip(channel) {
  if (cliArgs.force) return false;
  if (!channel.last_checked) return false;
  const isPriority = (channel.last_youtube_livestreams || []).length > 0;
  return (
    Date.now() - new Date(channel.last_checked).getTime() <
    (isPriority ? PRIORITY_SKIP_MS : SKIP_THRESHOLD_MS)
  );
}

/**
 * Sleep for specified milliseconds.
 * @param {number} ms - Milliseconds to sleep.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main
(async () => {
  if (!fs.existsSync(COUNTRIES_DIR)) {
    console.error("Error: countries/ directory not found");
    process.exit(1);
  }

  // Verify yt-dlp is installed
  try {
    await execFileAsync("yt-dlp", ["--version"]);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error("Error: 'yt-dlp' is not installed or not in PATH.");
      console.error("Install with: pip install yt-dlp");
      process.exit(1);
    }
  }

  const files = fs.readdirSync(COUNTRIES_DIR).filter((f) => f.endsWith(".json"));

  // Load all country data into memory
  const countryData = new Map();
  const channelsToCheck = [];

  for (const file of files) {
    const filePath = path.join(COUNTRIES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (!data.country || !Array.isArray(data.channels)) continue;

    countryData.set(file, data);

    for (const channel of data.channels) {
      if (!channel.youtube) continue;
      const channelIdFilter = cliArgs.channel || cliArgs.id;
      if (channelIdFilter && channel.id !== channelIdFilter) continue;

      channelsToCheck.push({ file, channel });
    }
  }

  const filteredChannels = applyIndexFilters(channelsToCheck, cliArgs);

  // Apply skip logic
  const channelsSkipping = filteredChannels.filter(({ channel }) => shouldSkip(channel));
  const channelsActive = filteredChannels.filter(({ channel }) => !shouldSkip(channel));

  if (!cliArgs.dryRun) {
    console.log(
      `Channels to check: ${channelsActive.length} (skipping ${channelsSkipping.length} recently checked)`,
    );
    console.log(`Processing ${CONCURRENCY} at a time...\n`);
  }

  let totalChecked = 0;
  let totalLive = 0;
  let totalCleared = 0;

  // Process in parallel batches
  for (let i = 0; i < channelsActive.length; i += CONCURRENCY) {
    const batch = channelsActive.slice(i, i + CONCURRENCY);

    // Check all channels in parallel (true async via execFile)
    const results = await Promise.all(
      batch.map(async ({ channel }) => {
        const videoIds = await checkYouTubeLive(channel.youtube);
        return { channel, videoIds };
      }),
    );

    // Process results and update channels
    for (const { channel, videoIds } of results) {
      totalChecked++;
      const previousLivestreams = channel.last_youtube_livestreams || [];

      // Update fields (modifies the object in-place, which is in countryData)
      channel.last_youtube_livestreams = videoIds;
      channel.last_checked = new Date().toISOString();

      if (videoIds.length > 0) {
        totalLive++;
      }
      if (previousLivestreams.length > 0 && videoIds.length === 0) {
        totalCleared++;
      }

      if (!cliArgs.dryRun) {
        const prefix = `  [${totalChecked}/${channelsActive.length}]`;
        if (videoIds.length > 0) {
          console.log(`${prefix} ${channel.id}: LIVE (${videoIds.length} stream(s))`);
        } else if (previousLivestreams.length > 0) {
          console.log(`${prefix} ${channel.id}: cleared (was live)`);
        } else {
          console.log(`${prefix} ${channel.id}: not live`);
        }
      }
    }

    // Write updated files (from in-memory data)
    if (!cliArgs.dryRun) {
      const modifiedFiles = new Set(batch.map(({ file }) => file));
      for (const file of modifiedFiles) {
        const filePath = path.join(COUNTRIES_DIR, file);
        const data = countryData.get(file);
        fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
      }
    }

    // Delay between batches with random jitter to avoid pattern detection
    if (i + CONCURRENCY < channelsActive.length) {
      const jitter = Math.random() * 2000;
      await sleep(BATCH_DELAY_MS + jitter);
    }
  }

  console.log(`\nResults:`);
  console.log(`  Checked: ${totalChecked} channels`);
  console.log(`  Skipped: ${channelsSkipping.length} recently checked`);
  console.log(`  Live:    ${totalLive} streams detected`);
  console.log(`  Cleared: ${totalCleared} streams ended`);

  if (cliArgs.dryRun) {
    console.log("\n[DRY RUN] No files were modified");
  } else if (totalChecked > 0 && (totalLive > 0 || totalCleared > 0)) {
    console.log("\nRebuilding channels.json...");
    const { execSync } = require("child_process");
    execSync(`node "${BUILD_SCRIPT}"`, { stdio: "inherit", cwd: path.join(__dirname, "../..") });
  } else if (totalChecked > 0) {
    console.log("\nNo livestream changes — skipping rebuild.");
  }
})();
