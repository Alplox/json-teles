const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const util = require("util");

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
 *   node scripts/check-youtube-livestreams.js [--dry-run] [--force] [--channel ID]
 */

const COUNTRIES_DIR = path.join(__dirname, "..", "countries");
const BUILD_SCRIPT = path.join(__dirname, "build-channels.js");

// Configuration
const CONCURRENCY = 4;
const BATCH_DELAY_MS = 4000;
const SKIP_THRESHOLD_MS = 30 * 60 * 1000; // 30 min for normal channels
const PRIORITY_SKIP_MS = 15 * 60 * 1000; // 15 min for channels that were live
const YTDLP_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 1;

// Field order for consistent output
const CHANNEL_FIELDS = [
  "id",
  "name",
  "logo",
  "signals",
  "youtube",
  "last_youtube_livestreams",
  "last_checked",
  "twitch",
  "website",
  "country",
  "category",
];

/**
 * Orders channel object fields in a consistent order.
 * @param {Object} ch - Channel object.
 * @returns {Object} Ordered channel object.
 */
function orderChannelFields(ch) {
  const ordered = {};
  for (const field of CHANNEL_FIELDS) {
    if (ch[field] !== undefined) {
      ordered[field] = ch[field];
    }
  }
  for (const key of Object.keys(ch)) {
    if (!Object.prototype.hasOwnProperty.call(ordered, key)) {
      ordered[key] = ch[key];
    }
  }
  return ordered;
}

// Parse arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const SINGLE_CHANNEL = args.includes("--channel")
  ? args[args.indexOf("--channel") + 1] ||
    (() => {
      console.error("Error: --channel requires a value");
      process.exit(1);
    })()
  : null;

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

/**
 * Checks for active livestream via yt-dlp (async, non-blocking).
 * Uses --print live_status to detect only "is_live" streams.
 * Retries once on empty results to guard against transient blocks.
 * @param {string} channelId - YouTube channel ID.
 * @returns {Promise<string[]>} Array of videoIds if live, empty array otherwise.
 */
async function checkYouTubeYtDlp(channelId) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = `https://www.youtube.com/channel/${channelId}/live`;
      const { stdout, stderr } = await execFileAsync(
        "yt-dlp",
        [
          "--flat-playlist",
          "--print",
          "%(id)s|%(live_status)s",
          "--extractor-args",
          "youtube:player_client=web",
          url,
        ],
        { timeout: YTDLP_TIMEOUT_MS },
      );

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
      if (err.code !== "ETIME") {
        console.error(`  [yt-dlp] ${channelId}: ${err.message.split("\n")[0]}`);
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

/**
 * Determines if a channel should be skipped based on last check time.
 * @param {Object} channel - Channel object.
 * @returns {boolean} True if channel should be skipped.
 */
function shouldSkip(channel) {
  if (FORCE) return false;
  if (!channel.last_checked) return false;

  const lastChecked = new Date(channel.last_checked).getTime();
  const now = Date.now();
  const isPriority = (channel.last_youtube_livestreams || []).length > 0;
  const threshold = isPriority ? PRIORITY_SKIP_MS : SKIP_THRESHOLD_MS;

  return now - lastChecked < threshold;
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
      if (SINGLE_CHANNEL && channel.id !== SINGLE_CHANNEL) continue;

      channelsToCheck.push({ file, channel });
    }
  }

  // Apply skip logic
  const channelsSkipping = channelsToCheck.filter(({ channel }) => shouldSkip(channel));
  const channelsActive = channelsToCheck.filter(({ channel }) => !shouldSkip(channel));

  if (!DRY_RUN) {
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
        const videoIds = await checkYouTubeYtDlp(channel.youtube);
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

      if (!DRY_RUN) {
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
    if (!DRY_RUN) {
      const modifiedFiles = new Set(batch.map(({ file }) => file));
      for (const file of modifiedFiles) {
        const filePath = path.join(COUNTRIES_DIR, file);
        const data = countryData.get(file);
        // Reorder channel fields for consistent output
        data.channels = data.channels.map(orderChannelFields);
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

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No files were modified");
  } else if (totalChecked > 0) {
    console.log("\nRebuilding channels.json...");
    const { execSync } = require("child_process");
    execSync(`node "${BUILD_SCRIPT}"`, { stdio: "inherit", cwd: path.join(__dirname, "..") });
  }
})();
