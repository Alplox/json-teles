const fs = require("fs");
const path = require("path");

/**
 * Reorders channel fields in country files (and optionally dead-signals files)
 * to match the standard structure.
 *
 * Usage:
 *   node scripts/reorder-country-fields.js
 *   node scripts/reorder-country-fields.js --dead-signals
 */

const COUNTRIES_DIR = path.join(__dirname, "../..", "countries");
const DEAD_SIGNALS_DIR = path.join(__dirname, "../..", "docs", "dead-signals");

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

const includeDeadSignals = process.argv.includes("--dead-signals");

const dirs = [COUNTRIES_DIR];
if (includeDeadSignals) dirs.push(DEAD_SIGNALS_DIR);

let totalFiles = 0;
let totalChannels = 0;

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(dir, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (!Array.isArray(data.channels)) continue;

    const original = JSON.stringify(data);
    data.channels = data.channels.map(orderChannelFields);
    const updated = JSON.stringify(data);

    if (original !== updated) {
      fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
      totalFiles++;
      totalChannels += data.channels.length;
    }
  }
}

const scope = includeDeadSignals ? "countries + dead-signals" : "countries";
console.log(`Reordered: ${totalChannels} channels in ${totalFiles} files (${scope})`);
