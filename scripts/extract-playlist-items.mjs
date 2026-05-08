import fs from "fs";

const htmlPath = "playlist.html";
const playlistId = "PLETRVoEwXSUyqsMax6SRRKyWrBGAs6G8B";
const html = fs.readFileSync(htmlPath, "utf8");

const match = html.match(/var ytInitialData\s*=\s*(\{.*?\});<\/script>/s);
if (!match) {
  console.log("NO_INITIAL_DATA");
  process.exit(1);
}

const data = JSON.parse(match[1]);
const items = [];

const walk = (node) => {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach(walk);
    return;
  }
  if (node.playlistVideoRenderer) {
    const r = node.playlistVideoRenderer;
    const videoId = r.videoId;
    const title = (r.title?.runs || []).map((x) => x.text).join("").trim();
    const index = Number(r.index?.simpleText || 0);
    items.push({
      index,
      videoId,
      title,
      url: videoId ? `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}` : "",
    });
  }
  Object.values(node).forEach(walk);
};

walk(data);

const dedup = [];
const seen = new Set();
for (const item of items) {
  const key = `${item.videoId}|${item.title}`;
  if (seen.has(key)) continue;
  seen.add(key);
  dedup.push(item);
}

dedup.sort((a, b) => a.index - b.index);
fs.writeFileSync("playlist-items.json", JSON.stringify(dedup, null, 2), "utf8");
console.log(`COUNT ${dedup.length}`);
