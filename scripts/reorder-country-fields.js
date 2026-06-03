const fs = require("fs");
const path = require("path");

/**
 * Reorders channel fields in all country files to match the standard structure.
 *
 * Usage:
 *   node scripts/reorder-country-fields.js
 */

const COUNTRIES_DIR = path.join(__dirname, "..", "countries");

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

const files = fs.readdirSync(COUNTRIES_DIR).filter((f) => f.endsWith(".json"));
let totalFiles = 0;
let totalChannels = 0;

for (const file of files) {
  const filePath = path.join(COUNTRIES_DIR, file);
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

console.log(`Reordered: ${totalChannels} channels in ${totalFiles} files`);
