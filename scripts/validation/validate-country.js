const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");

/**
 * Validates a single country file against the schema.
 *
 * Usage:
 *   node scripts/validate-country.js countries/cl.json
 *   node scripts/validate-country.js --all
 */

const signalSchema = {
  type: "object",
  required: ["type", "url"],
  properties: {
    type: { type: "string", enum: ["m3u8", "iframe", "audio"] },
    url: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
};

const channelSchema = {
  type: "object",
  required: ["id", "name", "signals", "category"],
  properties: {
    id: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1 },
    logo: { type: ["string", "null"] },
    signals: { type: "array", items: signalSchema },
    youtube: { type: ["string", "null"] },
    last_youtube_livestreams: {
      type: ["array", "null"],
      items: { type: "string" },
    },
    last_checked: { type: ["string", "null"] },
    twitch: { type: ["string", "null"] },
    website: { type: ["string", "null"] },
    country: {
      oneOf: [{ type: "string", pattern: "^[a-z]{2}(-[a-z]{2,3})?$" }, { type: "null" }],
    },
    category: {
      type: "string",
      enum: [
        "animation",
        "auto",
        "business",
        "classic",
        "culture",
        "entertainment",
        "general",
        "kids",
        "legislative",
        "lifestyle",
        "music",
        "news",
        "outdoor",
        "relax",
        "religious",
        "science",
        "sports",
        "weather",
      ],
    },
  },
  additionalProperties: false,
};

const countryFileSchema = {
  type: "object",
  required: ["country", "channels"],
  properties: {
    country: {
      oneOf: [
        { type: "string", pattern: "^[a-z]{2}(-[a-z]{2,3})?$" },
        { type: "string", const: "_unknown" },
      ],
    },
    channels: { type: "array", items: channelSchema },
  },
  additionalProperties: false,
};

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(countryFileSchema);

function validateFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    if (!validate(data)) {
      console.error(`  Errors in ${path.basename(filePath)}:\n`);
      for (const err of validate.errors) {
        const loc = err.instancePath || "/";
        console.error(`    ${loc}: ${err.message}`);
      }
      return false;
    }

    console.log(`  ${path.basename(filePath)}: ${data.channels.length} channels`);
    return true;
  } catch (err) {
    console.error(`  Error reading ${path.basename(filePath)}: ${err.message}`);
    return false;
  }
}

const arg = process.argv[2];
const countriesDir = path.join(__dirname, "../..", "countries");

if (arg === "--all") {
  const files = fs.readdirSync(countriesDir).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.error("No country files found in countries/");
    process.exit(1);
  }

  console.log(`Validating ${files.length} country files...\n`);

  let allValid = true;
  for (const file of files) {
    const ok = validateFile(path.join(countriesDir, file));
    if (!ok) allValid = false;
  }

  console.log(allValid ? "\nAll files valid." : "\nSome files have errors.");
  process.exit(allValid ? 0 : 1);
} else if (arg) {
  const filePath = path.resolve(arg);
  const ok = validateFile(filePath);
  process.exit(ok ? 0 : 1);
} else {
  console.log("Usage:");
  console.log("  node scripts/validate-country.js countries/cl.json");
  console.log("  node scripts/validate-country.js --all");
  process.exit(1);
}
