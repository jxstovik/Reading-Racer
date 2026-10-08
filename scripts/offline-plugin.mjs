import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";

// Precache exactly the files produced by this build; no remote font dependency.
export function offlinePlugin() {
  let output;
  return {
    name: "reading-racer-offline",
    apply: "build",
    configResolved(config) {
      output = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      async function walk(dir) {
        const files = await readdir(dir, { withFileTypes: true });
        const nested = await Promise.all(
          files.map((file) =>
            file.isDirectory()
              ? walk(resolve(dir, file.name))
              : resolve(dir, file.name),
          ),
        );
        return nested.flat().filter((path) => !path.endsWith("/sw.js"));
      }
      const files = (await walk(output)).sort();
      const digest = createHash("sha256");
      for (const file of files) digest.update(await readFile(file));
      const cache = `reading-racer-${digest.digest("hex").slice(0, 16)}`;
      const urls = files.map(
        (path) => "/" + relative(output, path).replaceAll("\\", "/"),
      );
      await writeFile(
        resolve(output, "sw.js"),
        `
const CACHE = ${JSON.stringify(cache)};
const FILES = ${JSON.stringify(urls)};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('reading-racer-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    // Serve a coherent cached shell while a newer build is waiting to activate.
    event.respondWith(caches.open(CACHE).then((cache) => cache.match('/index.html')).then((response) => response || fetch(event.request)));
  } else if (FILES.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then((cache) => cache.match(url.pathname)).then((response) => response || fetch(event.request)));
  }
});
`,
      );
    },
  };
}
