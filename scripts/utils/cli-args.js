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
    if (ch[field] !== undefined) ordered[field] = ch[field];
  }
  for (const key of Object.keys(ch)) {
    if (!(key in ordered)) ordered[key] = ch[key];
  }
  return ordered;
}

function toCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function parseArgs(argv, flags) {
  const args = {};
  for (const f of flags) {
    const key = toCamel(f.name);
    if (f.type === "boolean") {
      args[key] = argv.includes(`--${f.name}`);
    } else {
      const idx = argv.indexOf(`--${f.name}`);
      if (idx !== -1 && argv[idx + 1] !== undefined && !argv[idx + 1].startsWith("--")) {
        const val = argv[idx + 1];
        args[key] = f.type === "number" ? parseInt(val, 10) : val;
      } else {
        args[key] = null;
      }
    }
  }
  return args;
}

function applyIndexFilters(arr, args) {
  let result = arr;
  if (args.from !== null) result = result.slice(args.from);
  if (args.to !== null) result = result.slice(0, args.to + 1);
  if (args.limit !== null) result = result.slice(0, args.limit);
  return result;
}

module.exports = { parseArgs, applyIndexFilters, CHANNEL_FIELDS, orderChannelFields };
