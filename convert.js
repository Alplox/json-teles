const fs = require("fs");

const json = JSON.parse(fs.readFileSync("canales.json", "utf8"));

let m3u = "#EXTM3U\n";

for (const key in json) {
  const canal = json[key];

  const nombre = canal.nombre || key;
  const logo = canal.logo || "";
  const categoria = canal.categoría || "General";
  const pais = canal.país ? canal.país.toUpperCase() : "INTL";

  const urls = canal.señales?.m3u8_url || [];

  urls.forEach((url, i) => {
    const numero = urls.length > 1 ? ` (${i + 1})` : "";
    const nombreVisible = `${nombre}${numero} [${pais}]`;

    m3u += `#EXTINF:-1 tvg-name="${nombre}" tvg-logo="${logo}" group-title="${categoria}",${nombreVisible}\n`;
    m3u += `${url}\n`;
  });
}

fs.writeFileSync("canales.m3u", m3u);

console.log("M3U generado correctamente");