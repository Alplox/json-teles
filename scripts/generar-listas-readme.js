const fs = require("fs");
const fetch = require("node-fetch");

const data = JSON.parse(fs.readFileSync("canales.json", "utf-8"));

async function getCodigosPais() {
  try {
    const res = await fetch("https://flagcdn.com/es/codes.json");
    if (!res.ok) throw new Error("No se pudo cargar códigos de país");
    return await res.json();
  } catch {
    // Fallback
    return {
      "ad": "Andorra",
      "ae": "Emiratos Árabes Unidos",
      "af": "Afganistán",
      "ag": "Antigua y Barbuda",
      "ai": "Anguila",
      "al": "Albania",
      "am": "Armenia",
      "ao": "Angola",
      "aq": "Antártida",
      "ar": "Argentina",
      "as": "Samoa Americana",
      "at": "Austria",
      "au": "Australia",
      "aw": "Aruba",
      "ax": "Åland",
      "az": "Azerbaiyán",
      "ba": "Bosnia y Herzegovina",
      "bb": "Barbados",
      "bd": "Bangladesh",
      "be": "Bélgica",
      "bf": "Burkina Faso",
      "bg": "Bulgaria",
      "bh": "Baréin",
      "bi": "Burundi",
      "bj": "Benín",
      "bl": "San Bartolomé",
      "bm": "Bermudas",
      "bn": "Brunéi",
      "bo": "Bolivia",
      "bq": "Caribe Neerlandés",
      "br": "Brasil",
      "bs": "Bahamas",
      "bt": "Bután",
      "bv": "Isla Bouvet",
      "bw": "Botsuana",
      "by": "Bielorrusia",
      "bz": "Belice",
      "ca": "Canadá",
      "cc": "Islas Cocos",
      "cd": "Congo (Rep. Dem.)",
      "cf": "República Centroafricana",
      "cg": "Congo",
      "ch": "Suiza",
      "ci": "Costa de Marfil",
      "ck": "Islas Cook",
      "cl": "Chile",
      "cm": "Camerún",
      "cn": "China",
      "co": "Colombia",
      "cr": "Costa Rica",
      "cu": "Cuba",
      "cv": "Cabo Verde",
      "cw": "Curazao",
      "cx": "Isla de Navidad",
      "cy": "Chipre",
      "cz": "República Checa",
      "de": "Alemania",
      "dj": "Yibuti",
      "dk": "Dinamarca",
      "dm": "Dominica",
      "do": "República Dominicana",
      "dz": "Argelia",
      "ec": "Ecuador",
      "ee": "Estonia",
      "eg": "Egipto",
      "eh": "Sahara Occidental",
      "er": "Eritrea",
      "es": "España",
      "et": "Etiopía",
      "eu": "Unión Europea",
      "fi": "Finlandia",
      "fj": "Fiyi",
      "fk": "Islas Malvinas",
      "fm": "Micronesia",
      "fo": "Islas Feroe",
      "fr": "Francia",
      "ga": "Gabón",
      "gb": "Reino Unido",
      "gb-eng": "Inglaterra",
      "gb-nir": "Irlanda del Norte",
      "gb-sct": "Escocia",
      "gb-wls": "Gales",
      "gd": "Granada",
      "ge": "Georgia",
      "gf": "Guayana Francesa",
      "gg": "Guernsey",
      "gh": "Ghana",
      "gi": "Gibraltar",
      "gl": "Groenlandia",
      "gm": "Gambia",
      "gn": "Guinea",
      "gp": "Guadalupe",
      "gq": "Guinea Ecuatorial",
      "gr": "Grecia",
      "gs": "Islas Georgias del Sur y Sándwich del Sur",
      "gt": "Guatemala",
      "gu": "Guam",
      "gw": "Guinea-Bisáu",
      "gy": "Guyana",
      "hk": "Hong Kong",
      "hm": "Islas Heard y McDonald",
      "hn": "Honduras",
      "hr": "Croacia",
      "ht": "Haití",
      "hu": "Hungría",
      "id": "Indonesia",
      "ie": "Irlanda",
      "il": "Israel",
      "im": "Isla de Man",
      "in": "India",
      "io": "Territorio Británico del Océano Índico",
      "iq": "Irak",
      "ir": "Irán",
      "is": "Islandia",
      "it": "Italia",
      "je": "Jersey",
      "jm": "Jamaica",
      "jo": "Jordania",
      "jp": "Japón",
      "ke": "Kenia",
      "kg": "Kirguistán",
      "kh": "Camboya",
      "ki": "Kiribati",
      "km": "Comoras",
      "kn": "San Cristóbal y Nieves",
      "kp": "Corea del Norte",
      "kr": "Corea del Sur",
      "kw": "Kuwait",
      "ky": "Islas Caimán",
      "kz": "Kazajistán",
      "la": "Laos",
      "lb": "Líbano",
      "lc": "Santa Lucía",
      "li": "Liechtenstein",
      "lk": "Sri Lanka",
      "lr": "Liberia",
      "ls": "Lesoto",
      "lt": "Lituania",
      "lu": "Luxemburgo",
      "lv": "Letonia",
      "ly": "Libia",
      "ma": "Marruecos",
      "mc": "Mónaco",
      "md": "Moldavia",
      "me": "Montenegro",
      "mf": "San Martín (Francia)",
      "mg": "Madagascar",
      "mh": "Islas Marshall",
      "mk": "Macedonia del Norte",
      "ml": "Malí",
      "mm": "Myanmar",
      "mn": "Mongolia",
      "mo": "Macao",
      "mp": "Islas Marianas del Norte",
      "mq": "Martinica",
      "mr": "Mauritania",
      "ms": "Montserrat",
      "mt": "Malta",
      "mu": "Mauricio",
      "mv": "Maldivas",
      "mw": "Malawi",
      "mx": "México",
      "my": "Malasia",
      "mz": "Mozambique",
      "na": "Namibia",
      "nc": "Nueva Caledonia",
      "ne": "Níger",
      "nf": "Isla Norfolk",
      "ng": "Nigeria",
      "ni": "Nicaragua",
      "nl": "Países Bajos",
      "no": "Noruega",
      "np": "Nepal",
      "nr": "Nauru",
      "nu": "Niue",
      "nz": "Nueva Zelanda",
      "om": "Omán",
      "pa": "Panamá",
      "pe": "Perú",
      "pf": "Polinesia Francesa",
      "pg": "Papúa Nueva Guinea",
      "ph": "Filipinas",
      "pk": "Pakistán",
      "pl": "Polonia",
      "pm": "San Pedro y Miquelón",
      "pn": "Islas Pitcairn",
      "pr": "Puerto Rico",
      "ps": "Palestina",
      "pt": "Portugal",
      "pw": "Palaos",
      "py": "Paraguay",
      "qa": "Catar",
      "re": "Reunión",
      "ro": "Rumania",
      "rs": "Serbia",
      "ru": "Rusia",
      "rw": "Ruanda",
      "sa": "Arabia Saudita",
      "sb": "Islas Salomón",
      "sc": "Seychelles",
      "sd": "Sudán",
      "se": "Suecia",
      "sg": "Singapur",
      "sh": "Santa Elena, Ascensión y Tristán de Acuña",
      "si": "Eslovenia",
      "sj": "Svalbard y Jan Mayen",
      "sk": "Eslovaquia",
      "sl": "Sierra Leona",
      "sm": "San Marino",
      "sn": "Senegal",
      "so": "Somalia",
      "sr": "Surinam",
      "ss": "Sudán del Sur",
      "st": "Santo Tomé y Príncipe",
      "sv": "El Salvador",
      "sx": "San Martín (Países Bajos)",
      "sy": "Siria",
      "sz": "Suazilandia",
      "tc": "Islas Turcas y Caicos",
      "td": "Chad",
      "tf": "Tierras Australes y Antárticas Francesas",
      "tg": "Togo",
      "th": "Tailandia",
      "tj": "Tayikistán",
      "tk": "Tokelau",
      "tl": "Timor Oriental",
      "tm": "Turkmenistán",
      "tn": "Túnez",
      "to": "Tonga",
      "tr": "Turquía",
      "tt": "Trinidad y Tobago",
      "tv": "Tuvalu",
      "tw": "Taiwán",
      "tz": "Tanzania",
      "ua": "Ucrania",
      "ug": "Uganda",
      "um": "Islas Ultramarinas Menores de los Estados Unidos",
      "un": "Organización de las Naciones Unidas",
      "us": "Estados Unidos",
      "us-ak": "Alaska",
      "us-al": "Alabama",
      "us-ar": "Arkansas",
      "us-az": "Arizona",
      "us-ca": "California",
      "us-co": "Colorado",
      "us-ct": "Connecticut",
      "us-de": "Delaware",
      "us-fl": "Florida",
      "us-ga": "Georgia",
      "us-hi": "Hawái",
      "us-ia": "Iowa",
      "us-id": "Idaho",
      "us-il": "Illinois",
      "us-in": "Indiana",
      "us-ks": "Kansas",
      "us-ky": "Kentucky",
      "us-la": "Luisiana",
      "us-ma": "Massachusetts",
      "us-md": "Maryland",
      "us-me": "Maine",
      "us-mi": "Míchigan",
      "us-mn": "Minnesota",
      "us-mo": "Misuri",
      "us-ms": "Misisipi",
      "us-mt": "Montana",
      "us-nc": "Carolina del Norte",
      "us-nd": "Dakota del Norte",
      "us-ne": "Nebraska",
      "us-nh": "Nuevo Hampshire",
      "us-nj": "Nueva Jersey",
      "us-nm": "Nuevo México",
      "us-nv": "Nevada",
      "us-ny": "Nueva York",
      "us-oh": "Ohio",
      "us-ok": "Oklahoma",
      "us-or": "Oregón",
      "us-pa": "Pensilvania",
      "us-ri": "Rhode Island",
      "us-sc": "Carolina del Sur",
      "us-sd": "Dakota del Sur",
      "us-tn": "Tennessee",
      "us-tx": "Texas",
      "us-ut": "Utah",
      "us-va": "Virginia",
      "us-vt": "Vermont",
      "us-wa": "Washington",
      "us-wi": "Wisconsin",
      "us-wv": "Virginia Occidental",
      "us-wy": "Wyoming",
      "uy": "Uruguay",
      "uz": "Uzbekistán",
      "va": "Ciudad del Vaticano",
      "vc": "San Vicente y las Granadinas",
      "ve": "Venezuela",
      "vg": "Islas Vírgenes Británicas",
      "vi": "Islas Vírgenes de los Estados Unidos",
      "vn": "Vietnam",
      "vu": "Vanuatu",
      "wf": "Wallis y Futuna",
      "ws": "Samoa",
      "xk": "Kosovo",
      "ye": "Yemen",
      "yt": "Mayotte",
      "za": "Sudáfrica",
      "zm": "Zambia",
      "zw": "Zimbabue"
    };
  }
}

function capitalize(str) {
  if (!str) return "";
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

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
    const cat = c.categoría ? capitalize(c.categoría) : "Otros";
    if (!map[cat]) map[cat] = [];
    map[cat].push(c);
  }
  return map;
}

// Generar markdown por país
function generarMarkdownPorPais(data, codigos) {
  const grupos = agruparPorPais(data);
  let md = "";

  for (const pais of Object.keys(grupos).sort()) {
    const nombrePais = codigos[pais] ? codigos[pais] : "País Desconocido";
    md += `### 🌍 ${nombrePais}\n`;
    for (const c of grupos[pais]) {
      md += `- [${c.nombre}](${c.sitio_oficial}) (${c.categoría})\n`;
    }
    md += "\n";
  }

  return md;
}

// Generar markdown por categoría
function generarMarkdownPorCategoria(data, codigos) {
  const grupos = agruparPorCategoria(data);
  let md = "";

  for (const cat of Object.keys(grupos).sort()) {
    md += `### 📂 ${cat}\n`;
    for (const c of grupos[cat]) {
      const nombrePais = codigos[c.país] ? codigos[c.país] : "País Desconocido";
      md += `- [${c.nombre}](${c.sitio_oficial}) (${nombrePais})\n`;
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
  return readme.replace(regex, `${start}\n${contenido}\n${end}`);
}

// MAIN ASYNC
(async () => {
  const codigosPais = await getCodigosPais();

  let readme = fs.readFileSync("README.md", "utf-8");

  const porPais = generarMarkdownPorPais(data, codigosPais);
  const porCategoria = generarMarkdownPorCategoria(data, codigosPais);

  readme = reemplazarBloque(readme, "POR_PAIS", porPais);
  readme = reemplazarBloque(readme, "POR_CATEGORIA", porCategoria);

  fs.writeFileSync("README.md", readme);

  console.log("README actualizado correctamente");
})();