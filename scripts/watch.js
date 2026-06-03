const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Watches countries/ directory for changes and auto-rebuilds channels.json.
 *
 * Uses Node.js built-in fs.watch (no external dependencies).
 * Press Ctrl+C to stop.
 */

const COUNTRIES_DIR = path.join(__dirname, "..", "countries");
const BUILD_SCRIPT = path.join(__dirname, "build-channels.js");

let isBuilding = false;
let buildTimeout = null;

function build() {
  if (isBuilding) return;
  isBuilding = true;

  const start = Date.now();
  try {
    execSync(`node "${BUILD_SCRIPT}"`, { stdio: "inherit", cwd: path.join(__dirname, "..") });
    const elapsed = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] Rebuilt in ${elapsed}ms`);
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Build failed:`, err.message);
  } finally {
    isBuilding = false;
  }
}

function debouncedBuild() {
  if (buildTimeout) clearTimeout(buildTimeout);
  buildTimeout = setTimeout(build, 300);
}

if (!fs.existsSync(COUNTRIES_DIR)) {
  console.error("Error: countries/ directory not found");
  process.exit(1);
}

console.log(`Watching countries/ for changes...`);
console.log("Press Ctrl+C to stop.\n");

// Initial build
build();

// Watch for changes
fs.watch(COUNTRIES_DIR, { recursive: false }, (eventType, filename) => {
  if (filename && filename.endsWith(".json")) {
    console.log(`[${new Date().toLocaleTimeString()}] Change detected: ${filename}`);
    debouncedBuild();
  }
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nStopping watcher...");
  process.exit(0);
});
