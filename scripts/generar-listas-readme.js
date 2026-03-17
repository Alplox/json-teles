const fs = require("fs");

const data = JSON.parse(fs.readFileSync("canales.json", "utf-8"));

// Agrupar por país
function agruparPorPais(data) {
  const map = {};
  for (const key in data) {
    const c = data[key];
    const pais = c.país || "País Desconocido";
    if (!map[pais]) map[pais] = [];
    map[pais].push(c);
  }
  return map;
}

// Agrupar por categoría
function agruparPorCategoria(data) {
  const map = {};
  for (const key in data) {
    const c = data[key];
    const cat = c.categoría || "otros";
    if (!map[cat]) map[cat] = [];
    map[cat].push(c);
  }
  return map;
}

// Generar markdown
function generarMarkdownPorPais(data) {
  const grupos = agruparPorPais(data);
  let md = "";

  for (const pais of Object.keys(grupos).sort()) {
    md += `### 🌍 ${pais.toUpperCase()}\n`;
    for (const c of grupos[pais]) {
      md += `- [${c.nombre}](${c.sitio_oficial}) (${c.categoría})\n`;
    }
    md += "\n";
  }

  return md;
}

function generarMarkdownPorCategoria(data) {
  const grupos = agruparPorCategoria(data);
  let md = "";

  for (const cat of Object.keys(grupos).sort()) {
    md += `### 📂 ${cat}\n`;
    for (const c of grupos[cat]) {
      md += `- [${c.nombre}](${c.sitio_oficial}) (${c.país})\n`;
    }
    md += "\n";
  }

  return md;
}

// Reemplazar bloques en README
function reemplazarBloque(readme, tag, contenido) {
  const start = `<!-- START:${tag} -->`;
  const end = `<!-- END:${tag} -->`;

  const regex = new RegExp(`${start}[\\s\\S]*?${end}`, "m");

  return readme.replace(
    regex,
    `${start}\n${contenido}\n${end}`
  );
}

// MAIN
let readme = fs.readFileSync("README.md", "utf-8");

const porPais = generarMarkdownPorPais(data);
const porCategoria = generarMarkdownPorCategoria(data);

readme = reemplazarBloque(readme, "POR_PAIS", porPais);
readme = reemplazarBloque(readme, "POR_CATEGORIA", porCategoria);

fs.writeFileSync("README.md", readme);

console.log("README actualizado correctamente");