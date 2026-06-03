const fs = require("fs");
const path = require("path");

const COUNTRIES_DIR = path.join(__dirname, "..", "countries");
const OUTPUT_DIR = path.join(__dirname, "..");
const PLAYLISTS_DIR = path.join(__dirname, "..", "m3u-playlists");

if (!fs.existsSync(COUNTRIES_DIR)) {
  console.error("Error: countries/ directory not found");
  process.exit(1);
}

const files = fs.readdirSync(COUNTRIES_DIR).filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  console.error("Error: no country files found in countries/");
  process.exit(1);
}

if (!fs.existsSync(PLAYLISTS_DIR)) {
  fs.mkdirSync(PLAYLISTS_DIR, { recursive: true });
}

let combinedM3u = "#EXTM3U\n";
let totalCombined = 0;
let totalFiles = 0;

for (const file of files) {
  const filePath = path.join(COUNTRIES_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  if (!data.country || !Array.isArray(data.channels)) {
    console.error(`Warning: invalid format in ${file}, skipping`);
    continue;
  }

  const country = data.country === "_unknown" ? "INTL" : data.country.toUpperCase();
  let countryM3u = "#EXTM3U\n";
  let countryCount = 0;

  for (const canal of data.channels) {
    const nombre = canal.name || canal.id;
    const logo = canal.logo || "";
    const categoria = canal.category || "general";
    const m3u8Signals = (canal.signals || []).filter((s) => s.type === "m3u8");

    m3u8Signals.forEach((signal, i) => {
      const numero = m3u8Signals.length > 1 ? ` (${i + 1})` : "";
      const nombreVisible = `${nombre + numero} [${country}]`;
      const entry = `#EXTINF:-1 tvg-name="${nombre.replace(/"/g, '\\"')}" tvg-logo="${logo.replace(/"/g, '\\"')}" group-title="${categoria.replace(/"/g, '\\"')}", ${nombreVisible}\n${signal.url}\n`;

      countryM3u += entry;
      countryCount++;
      combinedM3u += entry;
      totalCombined++;
    });
  }

  if (countryCount > 0) {
    const playlistFile = path.join(PLAYLISTS_DIR, `${data.country}.m3u`);
    fs.writeFileSync(playlistFile, countryM3u);
    totalFiles++;
    console.log(`  ${data.country}.m3u: ${countryCount} streams`);
  }
}

fs.writeFileSync(path.join(OUTPUT_DIR, "channels.m3u"), combinedM3u);

console.log("\nM3U generated:");
console.log(`  channels.m3u: ${totalCombined} streams`);
console.log(`  m3u-playlists/: ${totalFiles} country files`);
