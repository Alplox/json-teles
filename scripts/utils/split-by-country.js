const fs = require("fs");
const path = require("path");

/**
 * Splits channels.json into individual country files.
 *
 * Input:  channels.json  → { channels: [{ id, name, country, ... }] }
 * Output: countries/{country}.json  → { country: "cl", channels: [{ id, name, ... }] }
 *
 * Note: The "country" field is removed from each channel since it's
 * inherited from the parent object. The build script adds it back when compiling.
 */

const INPUT = path.join(__dirname, "../..", "channels.json");
const OUTPUT_DIR = path.join(__dirname, "../..", "countries");

if (!fs.existsSync(INPUT)) {
  console.error("Error: channels.json not found");
  process.exit(1);
}

const { channels } = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

// Group channels by country (remove country field, it's inherited from parent)
const grouped = {};
for (const ch of channels) {
  const code = ch.country || null;
  const key = code || "_unknown";
  if (!grouped[key]) grouped[key] = [];
  const channelCopy = { ...ch };
  delete channelCopy.country;
  grouped[key].push(channelCopy);
}

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Write each country file
const codes = Object.keys(grouped).sort();
for (const code of codes) {
  const filePath = path.join(OUTPUT_DIR, `${code}.json`);
  const data = { country: code, channels: grouped[code] };
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

console.log(`Split: ${channels.length} channels → ${codes.length} country files in countries/`);
