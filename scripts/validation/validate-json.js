const fs = require("fs");
const Ajv = require("ajv");

/**
 * Validates channels.json (compiled format) against the schema.
 *
 * Usage:
 *   node scripts/validate-json.js [filePath]
 *
 * Default: channels.json
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
  required: ["id", "name", "signals", "country", "category"],
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

const rootSchema = {
  type: "object",
  required: ["channels"],
  properties: {
    version: { type: "string" },
    generated: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}T" },
    total: { type: "integer", minimum: 0 },
    channels: {
      type: "array",
      items: channelSchema,
    },
  },
  additionalProperties: false,
};

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(rootSchema);

const filePath = process.argv[2] || "channels.json";

try {
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  const valid = validate(data);

  if (valid) {
    console.log(`${filePath} is valid (${data.channels.length} channels)`);
    process.exit(0);
  } else {
    console.error(`Validation errors in ${filePath}:\n`);
    for (const err of validate.errors) {
      const loc = err.instancePath || "/";
      console.error(`  ${loc}: ${err.message}`);
    }
    process.exit(1);
  }
} catch (err) {
  console.error(`Error reading ${filePath}: ${err.message}`);
  process.exit(1);
}
