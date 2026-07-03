const { execFile } = require("child_process");

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/utils/youtube-channel-id.js <youtube-url>");
  process.exit(1);
}

execFile("yt-dlp", ["--print", "channel_id", url], (err, stdout) => {
  if (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
  const id = stdout.trim().split("\n")[0];
  if (id) process.stdout.write(`${id}\n`);
});
