const fs = require("fs");
const path = require("path");

/**
 * Compiles individual country files into a single channels.json.
 *
 * Input:  countries/{country}.json  → { country: "cl", channels: [...] }
 * Output: channels.json            → { version, generated, total, channels: [...] }
 *
 * Includes:
 * - Metadata (version, timestamp, total count)
 * - Unique ID validation across countries
 * - Auto-validation of output
 */

const COUNTRIES_DIR = path.join(__dirname, "..", "countries");
const OUTPUT = path.join(__dirname, "..", "channels.json");
const PACKAGE_JSON = path.join(__dirname, "..", "package.json");
const VALIDATE_SCRIPT = path.join(__dirname, "validate-json.js");

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
  // Add any remaining fields not in the predefined order
  for (const key of Object.keys(ch)) {
    if (!Object.prototype.hasOwnProperty.call(ordered, key)) {
      ordered[key] = ch[key];
    }
  }
  return ordered;
}

if (!fs.existsSync(COUNTRIES_DIR)) {
  console.error("Error: countries/ directory not found");
  process.exit(1);
}

const files = fs.readdirSync(COUNTRIES_DIR).filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  console.error("Error: no country files found in countries/");
  process.exit(1);
}

const allChannels = [];
const stats = {};
const seenIds = new Set();
let hasDuplicateIds = false;

for (const file of files) {
  const filePath = path.join(COUNTRIES_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  if (!data.country || !Array.isArray(data.channels)) {
    console.error(`Error: invalid format in ${file} (missing "country" or "channels")`);
    process.exit(1);
  }

  for (const ch of data.channels) {
    // Validate unique IDs
    if (seenIds.has(ch.id)) {
      console.error(
        `Error: duplicate ID "${ch.id}" in ${file} (already exists in another country)`,
      );
      hasDuplicateIds = true;
    }
    seenIds.add(ch.id);

    allChannels.push(
      orderChannelFields({
        ...ch,
        country: data.country === "_unknown" ? null : data.country,
      }),
    );
  }

  stats[data.country] = data.channels.length;
}

if (hasDuplicateIds) {
  console.error("Build failed: duplicate channel IDs detected");
  process.exit(1);
}

// Sort channels by id
allChannels.sort((a, b) => a.id.localeCompare(b.id));

// Read version from package.json
const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf-8"));

// Build output with metadata
const output = {
  version: pkg.version,
  generated: new Date().toISOString(),
  total: allChannels.length,
  channels: allChannels,
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);

const total = allChannels.length;
const countries = Object.keys(stats).length;
console.log(`Build: ${total} channels from ${countries} countries → channels.json`);

// Auto-validate output
console.log("\nValidating output...");
const { execSync } = require("child_process");
try {
  execSync(`node "${VALIDATE_SCRIPT}"`, { stdio: "inherit", cwd: path.join(__dirname, "..") });
  console.log("Build completed successfully.");
} catch {
  console.error("Build completed but validation failed!");
  process.exit(1);
}
