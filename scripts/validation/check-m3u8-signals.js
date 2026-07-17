const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { parseArgs, applyIndexFilters } = require("../utils/cli-args.js");

const COUNTRIES_DIR = path.join(__dirname, "../..", "countries");
const DEAD_SIGNALS_DIR = path.join(__dirname, "../..", "docs", "dead-signals");
const BUILD_SCRIPT = path.join(__dirname, "..", "core", "build-channels.js");

const CONCURRENCY = 10;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;
const HLS_HEADER = "#EXTM3U";
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

// ponytail: simple round-robin UA rotation, no rate limiter
let uaIndex = 0;
function nextUA() {
  return USER_AGENTS[uaIndex++ % USER_AGENTS.length];
}

const args = parseArgs(process.argv.slice(2), [
  { name: "id", type: "string" },
  { name: "country", type: "string" },
  { name: "limit", type: "number" },
  { name: "from", type: "number" },
  { name: "to", type: "number" },
  { name: "update", type: "boolean" },
  { name: "restore", type: "boolean" },
  { name: "dry-run", type: "boolean" },
  { name: "automatic", type: "boolean" },
  { name: "verbose", type: "boolean" },
]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchUrl(url, timeout = REQUEST_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith("https:");
    const mod = isHttps ? https : http;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeout);

    const done = (result) => {
      clearTimeout(timer);
      resolve(result);
    };

    const req = mod.get(
      url,
      {
        signal: ac.signal,
        headers: {
          "User-Agent": nextUA(),
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
        },
        rejectUnauthorized: false,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          const redirect = res.headers.location.startsWith("http")
            ? res.headers.location
            : new URL(res.headers.location, url).href;
          done(fetchUrl(redirect, timeout));
          return;
        }
        const chunks = [];
        let size = 0;
        res.on("data", (chunk) => {
          size += chunk.length;
          if (size > 65536) {
            res.destroy();
            done({ ok: false, error: "response too large", status: res.statusCode });
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (res.statusCode !== 200) {
            done({ ok: false, error: `HTTP ${res.statusCode}`, status: res.statusCode });
            return;
          }
          const isHls = body.startsWith(HLS_HEADER);
          done({
            ok: isHls,
            error: isHls ? null : "not valid HLS (missing #EXTM3U)",
            status: res.statusCode,
            body: isHls ? body : null,
          });
        });
      },
    );
    req.on("error", (err) => {
      done({
        ok: false,
        error: err.message === "The operation was aborted" ? "timeout" : err.message,
        status: null,
      });
    });
  });
}

function signalLabel(r) {
  if (r.ok) return `${r.status} OK`;
  if (r.error === "not valid HLS (missing #EXTM3U)") return `${r.status} DEAD`;
  if (r.status) return `${r.status} ERR`;
  return "ERR";
}

async function checkSignal(url, signalIndex) {
  let lastError, lastStatus;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await fetchUrl(url);
    if (result.ok) return { ok: true, signalIndex, status: result.status };
    lastError = result.error;
    lastStatus = result.status;
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS + Math.random() * 1000);
    }
  }
  return { ok: false, signalIndex, error: lastError, status: lastStatus };
}

function orderFields(obj) {
  const fields = [
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
  const ordered = {};
  for (const f of fields) {
    if (obj[f] !== undefined) ordered[f] = obj[f];
  }
  for (const k of Object.keys(obj)) {
    if (!(k in ordered)) ordered[k] = obj[k];
  }
  return ordered;
}

function loadDeadSignals(country) {
  const filePath = path.join(DEAD_SIGNALS_DIR, `${country}-dead-signals.json`);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return { country, channels: [] };
  }
}

function saveDeadSignals(country, data) {
  const filePath = path.join(DEAD_SIGNALS_DIR, `${country}-dead-signals.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function getDeadSignalsChannel(data, channelId) {
  return data.channels.find((c) => c.id === channelId);
}

function getCountryChannel(data, channelId) {
  return data.channels.find((c) => c.id === channelId);
}

function loadCountry(country) {
  const filePath = path.join(COUNTRIES_DIR, `${country}.json`);
  try {
    return { data: JSON.parse(fs.readFileSync(filePath, "utf8")), filePath };
  } catch {
    return null;
  }
}

function saveCountry(filePath, data) {
  data.channels = data.channels.map(orderFields);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function rebuild() {
  const { execSync } = require("child_process");
  execSync(`node "${BUILD_SCRIPT}"`, { stdio: "inherit", cwd: path.join(__dirname, "../..") });
}

async function checkAndMoveSignals() {
  if (!fs.existsSync(COUNTRIES_DIR)) {
    console.error("Error: countries/ directory not found");
    process.exit(1);
  }

  let files = fs.readdirSync(COUNTRIES_DIR).filter((f) => f.endsWith(".json"));
  if (args.country) {
    files = files.filter((f) => f === `${args.country}.json`);
    if (files.length === 0) {
      console.error(`Error: no country file found for "${args.country}"`);
      process.exit(1);
    }
  }

  let allChannels = [];

  for (const file of files) {
    const filePath = path.join(COUNTRIES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const country = path.basename(file, ".json");

    for (const channel of data.channels) {
      const m3u8Signals = (channel.signals || [])
        .map((s, i) => ({ ...s, index: i }))
        .filter((s) => s.type === "m3u8");
      if (m3u8Signals.length === 0) continue;
      if (args.id && channel.id !== args.id) continue;

      allChannels.push({ file, filePath, country, data, channel, m3u8Signals });
    }
  }

  allChannels = applyIndexFilters(allChannels, args);

  if (allChannels.length === 0) {
    console.log("No channels with M3U8 signals to check.");
    return;
  }

  if (args.verbose) {
    console.log(`Checking ${allChannels.length} channel(s) with M3U8 signals...`);
    console.log(
      `Mode: ${args.dryRun ? "DRY RUN" : args.update ? "UPDATE" : "READ-ONLY"}${args.automatic ? " (automatic)" : ""}`,
    );
    console.log("");
  }

  const results = { ok: 0, dead: 0, errors: 0 };
  const deadSignalsByCountry = {};
  const modifiedData = new Map();

  let checkedCount = 0;
  const total = allChannels.length;
  for (let i = 0; i < allChannels.length; i += CONCURRENCY) {
    const batch = allChannels.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(({ filePath, country, data, channel, m3u8Signals }) =>
        (async () => {
          try {
            const signalResults = await Promise.all(
              m3u8Signals.map((s) => checkSignal(s.url, s.index)),
            );
            const deadIndices = new Set();

            let okCount = 0,
              deadCount = 0,
              errCount = 0;
            for (const r of signalResults) {
              if (r.ok) {
                results.ok++;
                okCount++;
                if (args.verbose) {
                  const shortUrl =
                    m3u8Signals.find((s) => s.index === r.signalIndex)?.url?.slice(0, 80) || "";
                  console.log(
                    `  [${signalLabel(r)}] ${channel.id} signal[${r.signalIndex}]: ${shortUrl}`,
                  );
                }
              } else if (r.error === "not valid HLS (missing #EXTM3U)") {
                results.dead++;
                deadCount++;
                deadIndices.add(r.signalIndex);
                if (args.verbose) {
                  const shortUrl =
                    m3u8Signals.find((s) => s.index === r.signalIndex)?.url?.slice(0, 80) || "";
                  console.log(
                    `  [${signalLabel(r)}] ${channel.id} signal[${r.signalIndex}]: ${shortUrl}`,
                  );
                }
              } else {
                results.errors++;
                errCount++;
                deadIndices.add(r.signalIndex);
                if (args.verbose) {
                  const shortUrl =
                    m3u8Signals.find((s) => s.index === r.signalIndex)?.url?.slice(0, 80) || "";
                  console.log(
                    `  [${signalLabel(r)}] ${channel.id} signal[${r.signalIndex}]: ${shortUrl} (${r.error})`,
                  );
                }
              }
            }

            const labelParts = [];
            if (okCount) labelParts.push(`${okCount} OK`);
            if (deadCount) labelParts.push(`${deadCount} DEAD`);
            if (errCount) labelParts.push(`${errCount} ERR`);
            checkedCount++;
            console.log(`[${checkedCount}/${total}] ${channel.id}: ${labelParts.join(", ")}`);

            channel.last_checked = new Date().toISOString();
            modifiedData.set(filePath, data);

            if (deadIndices.size === 0) return;

            // Build list of dead signal objects (in reverse index order to splice safely)
            const deadSignals = m3u8Signals.filter((s) => deadIndices.has(s.index));

            if (!args.update || args.dryRun) {
              for (const s of deadSignals) {
                const shortUrl = s.url.slice(0, 80);
                console.log(`  → Would remove dead signal from ${channel.id}: ${shortUrl}`);
              }
              return;
            }

            // Remove dead signals from channel (reverse order to preserve indices)
            const sortedDead = [...deadIndices].sort((a, b) => b - a);
            for (const idx of sortedDead) {
              channel.signals.splice(idx, 1);
            }

            // Add to dead-signals file
            if (!deadSignalsByCountry[country]) {
              deadSignalsByCountry[country] = loadDeadSignals(country);
            }
            const dsData = deadSignalsByCountry[country];
            let dsChannel = getDeadSignalsChannel(dsData, channel.id);
            if (!dsChannel) {
              dsChannel = { ...channel, signals: [] };
              dsData.channels.push(dsChannel);
            }
            for (const s of deadSignals) {
              const exists = dsChannel.signals.some((ds) => ds.url === s.url && ds.type === s.type);
              if (!exists) {
                dsChannel.signals.push({ type: s.type, url: s.url });
              }
            }

            for (const s of deadSignals) {
              const shortUrl = s.url.slice(0, 80);
              console.log(`  [MOVED] ${channel.id} → ${country}-dead-signals.json: ${shortUrl}`);
            }
          } catch (err) {
            checkedCount++;
            results.errors++;
            console.log(`[${checkedCount}/${total}] ${channel.id}: CRASHED — ${err.message}`);
          }
        })(),
      ),
    );
  }

  // Save all modified country files
  if (args.update && !args.dryRun) {
    for (const [fp, d] of modifiedData) {
      saveCountry(fp, d);
    }
  }

  // Save all modified dead-signals files
  if (args.update && !args.dryRun) {
    if (!fs.existsSync(DEAD_SIGNALS_DIR)) {
      fs.mkdirSync(DEAD_SIGNALS_DIR, { recursive: true });
    }
    for (const [country, dsData] of Object.entries(deadSignalsByCountry)) {
      saveDeadSignals(country, dsData);
    }
  }

  console.log("");
  console.log("=== Results ===");
  console.log(`  OK:    ${results.ok} signals`);
  console.log(`  Dead:  ${results.dead} signals`);
  console.log(`  Err:   ${results.errors} signals`);

  if (args.dryRun) {
    console.log("\n[Dry run] No files were modified");
  } else if (args.update && (results.dead > 0 || results.errors > 0)) {
    console.log("\nRebuilding channels.json...");
    rebuild();
  }

  if (!args.update) {
    console.log("\nUse --update to apply changes, --dry-run to preview.");
  }
}

async function checkAndRestoreSignals() {
  if (!fs.existsSync(DEAD_SIGNALS_DIR)) {
    console.error("Error: docs/dead-signals/ directory not found");
    process.exit(1);
  }

  let files = fs.readdirSync(DEAD_SIGNALS_DIR).filter((f) => f.endsWith("-dead-signals.json"));
  if (args.country) {
    files = files.filter((f) => f === `${args.country}-dead-signals.json`);
    if (files.length === 0) {
      console.error(`Error: no dead-signals file found for "${args.country}"`);
      process.exit(1);
    }
  }

  // Collect all signals from dead-signals files
  let allDeadSignals = []; // { country, file, data, channel, signal, signalIndex }

  for (const file of files) {
    const filePath = path.join(DEAD_SIGNALS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const country = file.replace("-dead-signals.json", "");

    for (const channel of data.channels) {
      if (args.id && channel.id !== args.id) continue;
      const m3u8Signals = (channel.signals || [])
        .map((s, i) => ({ ...s, index: i }))
        .filter((s) => s.type === "m3u8");
      if (m3u8Signals.length === 0) continue;
      for (const s of m3u8Signals) {
        allDeadSignals.push({ country, file, data, channel, signal: s });
      }
    }
  }

  allDeadSignals = applyIndexFilters(allDeadSignals, args);

  if (allDeadSignals.length === 0) {
    console.log("No dead M3U8 signals found to restore.");
    return;
  }

  if (args.verbose) {
    console.log(`Checking ${allDeadSignals.length} dead signal(s) for potential restore...`);
    console.log(
      `Mode: ${args.dryRun ? "DRY RUN" : args.update ? "RESTORE" : "READ-ONLY"}${args.automatic ? " (automatic)" : ""}`,
    );
    console.log("");
  }

  const results = { restored: 0, stillDead: 0 };
  const modifiedCountries = new Set();
  const modifiedDeadFiles = new Set();

  let checkedCount = 0;
  const total = allDeadSignals.length;
  for (let i = 0; i < allDeadSignals.length; i += CONCURRENCY) {
    const batch = allDeadSignals.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(({ country, file, data, channel, signal }) =>
        (async () => {
          try {
            const r = await checkSignal(signal.url, signal.index);

            checkedCount++;
            if (!r.ok) {
              results.stillDead++;
              if (args.verbose) {
                const shortUrl = signal.url.slice(0, 80);
                console.log(`  [${signalLabel(r)}] ${channel.id}: ${shortUrl} (${r.error})`);
              }
              console.log(`[${checkedCount}/${total}] ${channel.id}: DEAD`);
              return;
            }

            results.restored++;
            const shortUrl = signal.url.slice(0, 80);
            console.log(
              `[${checkedCount}/${total}] ${channel.id}: [${signalLabel(r)}] ${shortUrl}`,
            );

            if (!args.update || args.dryRun) {
              console.log(`  → Would restore signal to ${country}.json`);
              return;
            }

            // Remove signal from dead-signals channel
            channel.signals.splice(signal.index, 1);

            // Add signal to country file
            let countryData = loadCountry(country);
            if (!countryData) {
              console.log(`  → Creating ${country}.json`);
              countryData = {
                data: { country, channels: [] },
                filePath: path.join(COUNTRIES_DIR, `${country}.json`),
              };
            }
            let cc = getCountryChannel(countryData.data, channel.id);
            if (!cc) {
              cc = { ...channel, signals: [] };
              countryData.data.channels.push(cc);
            }
            cc.signals.push({ type: "m3u8", url: signal.url });
            saveCountry(countryData.filePath, countryData.data);
            modifiedCountries.add(country);

            // Save dead-signals file (remove empty channels, then save)
            data.channels = data.channels.filter((c) => (c.signals || []).length > 0);
            saveDeadSignals(country, data);
            modifiedDeadFiles.add(file);
          } catch (err) {
            checkedCount++;
            results.stillDead++;
            console.log(`[${checkedCount}/${total}] ${channel.id}: CRASHED — ${err.message}`);
          }
        })(),
      ),
    );
  }

  console.log("");
  console.log("=== Results ===");
  console.log(`  Restored: ${results.restored} signals`);
  console.log(`  Still dead: ${results.stillDead} signals`);

  if (args.dryRun) {
    console.log("\n[Dry run] No files were modified");
  } else if (args.update && results.restored > 0) {
    console.log("\nRebuilding channels.json...");
    rebuild();
  }

  if (!args.update) {
    console.log("\nUse --update to apply changes, --dry-run to preview.");
  }
}

(async () => {
  if (args.restore) {
    await checkAndRestoreSignals();
  } else {
    await checkAndMoveSignals();
  }
})();
