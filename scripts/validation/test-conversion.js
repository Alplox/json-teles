const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Tests M3U conversion from country files.
 * Backs up the real countries/ directory, writes test data, runs conversion,
 * validates output, then restores the original.
 */

const ROOT = path.join(__dirname, "../..");
const COUNTRIES_DIR = path.join(ROOT, "countries");
const BACKUP_DIR = path.join(ROOT, "_backup_countries");
const PLAYLISTS_DIR = path.join(ROOT, "m3u-playlists");

const TEST_COUNTRIES = {
  cl: {
    country: "cl",
    channels: [
      {
        id: "test-channel-1",
        name: "Test Channel 1",
        logo: "https://example.com/logo.png",
        signals: [{ type: "m3u8", url: "https://example.com/stream1.m3u8" }],
        youtube: null,
        twitch: null,
        website: "https://example.com",
        category: "news",
      },
    ],
  },
  us: {
    country: "us",
    channels: [
      {
        id: "test-channel-2",
        name: "Test Channel 2",
        logo: null,
        signals: [
          { type: "m3u8", url: "https://example.com/stream2a.m3u8" },
          { type: "m3u8", url: "https://example.com/stream2b.m3u8" },
        ],
        youtube: null,
        twitch: null,
        website: "https://example2.com",
        category: "music",
      },
    ],
  },
  _unknown: {
    country: "_unknown",
    channels: [
      {
        id: "test-channel-3",
        name: "Test Channel 3",
        logo: null,
        signals: [],
        youtube: null,
        twitch: null,
        website: "https://example3.com",
        category: "general",
      },
    ],
  },
};

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${msg}`);
  }
}

// Backup original countries directory
if (fs.existsSync(COUNTRIES_DIR)) {
  fs.cpSync(COUNTRIES_DIR, BACKUP_DIR, { recursive: true });
}

try {
  // Clear countries dir and write test data
  fs.rmSync(COUNTRIES_DIR, { recursive: true, force: true });
  fs.mkdirSync(COUNTRIES_DIR, { recursive: true });

  for (const [code, data] of Object.entries(TEST_COUNTRIES)) {
    fs.writeFileSync(path.join(COUNTRIES_DIR, `${code}.json`), JSON.stringify(data, null, 2));
  }

  // Run conversion
  execSync("node scripts/core/generate-m3u.js", { cwd: ROOT });

  // Read generated M3U
  const m3u = fs.readFileSync(path.join(ROOT, "channels.m3u"), "utf-8");

  // Test 1: M3U starts with #EXTM3U
  assert(m3u.startsWith("#EXTM3U\n"), "M3U must start with #EXTM3U");

  // Test 2: Contains expected channels
  assert(m3u.includes("Test Channel 1"), "Must contain Test Channel 1");
  assert(m3u.includes("Test Channel 2"), "Must contain Test Channel 2");

  // Test 3: Multiple signals get numbered
  assert(m3u.includes("Test Channel 2 (1) [US]"), "Multiple signals must be numbered (1)");
  assert(m3u.includes("Test Channel 2 (2) [US]"), "Multiple signals must be numbered (2)");

  // Test 4: Country code is uppercased
  assert(m3u.includes("[CL]"), "Country code must be uppercase");
  assert(m3u.includes("[US]"), "Country code must be uppercase");

  // Test 5: Empty signals produce no entry
  assert(!m3u.includes("Test Channel 3"), "Channels without signals must not appear");

  // Test 6: EXTINF format is correct
  assert(
    m3u.includes(
      '#EXTINF:-1 tvg-name="Test Channel 1" tvg-logo="https://example.com/logo.png" group-title="news"',
    ),
    "EXTINF format is incorrect",
  );

  // Test 7: URLs are present
  assert(m3u.includes("https://example.com/stream1.m3u8"), "Stream URL must be present");
  assert(
    m3u.includes("https://example.com/stream2a.m3u8") &&
      m3u.includes("https://example.com/stream2b.m3u8"),
    "All multiple signal URLs must be present",
  );

  // Test 8: Single signal channel has no number
  assert(
    m3u.includes("Test Channel 1 [CL]") && !m3u.includes("Test Channel 1 (1)"),
    "Single signal channel must not have a number",
  );

  // Test 9: Per-country playlists exist
  assert(
    fs.existsSync(path.join(PLAYLISTS_DIR, "cl.m3u")),
    "Per-country playlist cl.m3u must exist",
  );
  assert(
    fs.existsSync(path.join(PLAYLISTS_DIR, "us.m3u")),
    "Per-country playlist us.m3u must exist",
  );

  // Test 10: Per-country playlist contains only that country's channels
  const clM3u = fs.readFileSync(path.join(PLAYLISTS_DIR, "cl.m3u"), "utf-8");
  const usM3u = fs.readFileSync(path.join(PLAYLISTS_DIR, "us.m3u"), "utf-8");
  assert(
    clM3u.includes("Test Channel 1") && !clM3u.includes("Test Channel 2"),
    "cl.m3u must contain only Chilean channels",
  );
  assert(
    usM3u.includes("Test Channel 2") && !usM3u.includes("Test Channel 1"),
    "us.m3u must contain only US channels",
  );
} finally {
  // Restore original countries directory
  fs.rmSync(COUNTRIES_DIR, { recursive: true, force: true });
  fs.cpSync(BACKUP_DIR, COUNTRIES_DIR, { recursive: true });
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });

  // Clean up test playlists
  if (fs.existsSync(PLAYLISTS_DIR)) {
    fs.rmSync(PLAYLISTS_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(ROOT, "channels.m3u"))) {
    fs.unlinkSync(path.join(ROOT, "channels.m3u"));
  }

  // Re-run build and conversion to restore files
  try {
    execSync("node scripts/core/build-channels.js", { cwd: ROOT, stdio: "ignore" });
    execSync("node scripts/core/generate-m3u.js", { cwd: ROOT });
  } catch {
    // Ignore errors during cleanup
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
