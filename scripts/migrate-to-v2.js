const fs = require("fs");
const path = require("path");

/**
 * Migra canales.json (formato legacy) → channels.json (formato v2).
 *
 * Formato legacy:
 *   { "slug": { nombre, logo, señales: { m3u8_url, iframe_url, yt_id, ... }, sitio_oficial, país, categoría } }
 *
 * Formato v2:
 *   { channels: [ { id, name, logo, signals: [{type, url}], youtube, twitch, website, country, category } ] }
 */

function migrarCanal(slug, canal) {
  const signals = [];

  if (canal.señales) {
    for (const url of canal.señales.m3u8_url || []) {
      if (url) signals.push({ type: "m3u8", url });
    }
    for (const url of canal.señales.iframe_url || []) {
      if (url) signals.push({ type: "iframe", url });
    }
  }

  return {
    id: slug,
    name: canal.nombre || slug,
    logo: canal.logo || null,
    signals,
    youtube: canal.señales?.yt_id || null,
    twitch: canal.señales?.twitch_id || null,
    website: canal.sitio_oficial || null,
    country: canal.país || null,
    category: canal.categoría || "general",
  };
}

const legacy = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "canales.json"), "utf-8"));

const channels = Object.entries(legacy).map(([slug, canal]) => migrarCanal(slug, canal));

const output = { channels };

fs.writeFileSync(
  path.join(__dirname, "..", "channels.json"),
  `${JSON.stringify(output, null, 2)}\n`,
);

console.log(`Migrado: ${channels.length} canales → channels.json`);
