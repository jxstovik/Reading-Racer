import { createServer } from "node:http";
import { readFile, access } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
try {
  await access(resolve(root, "index.html"));
} catch {
  console.error("Build the game first: npm run build");
  process.exit(1);
}
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(
      new URL(request.url, "http://127.0.0.1").pathname,
    );
    const file = resolve(root, "." + (path === "/" ? "/index.html" : path));
    if (!file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const data = await readFile(file);
    response.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(data);
  } catch {
    response.writeHead(404).end("File not found");
  }
});
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? "Port 4173 is already in use. Close the other preview, then try again."
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(4173, "127.0.0.1", () => {
  const url = "http://127.0.0.1:4173";
  console.log(
    `Reading Racer: ${url}\nKeep this terminal open. Press Ctrl+C to stop.`,
  );
  if (process.argv.includes("--no-open")) return;
  // Keep a regular browser profile so offline storage and microphone permissions persist.
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        ]
      : process.platform === "darwin"
        ? [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          ]
        : [
            "google-chrome",
            "google-chrome-stable",
            "chromium",
            "chromium-browser",
            "microsoft-edge",
          ];
  function openNext(index) {
    if (index >= candidates.length) {
      console.log(
        "Open the URL above in a browser. Chrome or Edge supports app windows.",
      );
      return;
    }
    const child = spawn(
      candidates[index],
      [`--app=${url}`, "--window-size=1200,800"],
      { stdio: "ignore", detached: true },
    );
    child.on("error", () => openNext(index + 1));
    child.unref();
  }
  openNext(0);
});
