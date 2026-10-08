// Package the official Electron distribution without a second dependency tree.
import {
  cp,
  mkdir,
  rename,
  writeFile,
  chmod,
  rm,
  readFile,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
if (process.platform !== "linux" || process.arch !== "x64")
  throw new Error("This packager currently targets Linux x64.");
const release = path.join(root, "release");
const stage = path.join(release, "Reading-Racer");
await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
await cp(path.join(root, "node_modules/electron/dist"), stage, {
  recursive: true,
});
await rename(path.join(stage, "electron"), path.join(stage, "reading-racer"));
const appDir = path.join(stage, "resources/app");
await mkdir(appDir, { recursive: true });
await cp(path.join(root, "dist"), path.join(appDir, "dist"), {
  recursive: true,
});
await cp(path.join(root, "desktop"), path.join(appDir, "desktop"), {
  recursive: true,
});
await writeFile(
  path.join(appDir, "package.json"),
  JSON.stringify({
    name: pkg.name,
    version: pkg.version,
    main: pkg.main,
    description: pkg.description,
  }),
);
await cp(
  path.join(root, "scripts/install-desktop.sh"),
  path.join(stage, "install-desktop.sh"),
);
await writeFile(
  path.join(stage, "START-HERE.txt"),
  "Double-click reading-racer to play. Run ./install-desktop.sh once to add Reading Racer to your application menu. This app includes offline narration and needs no server. Open Parent Settings to import/export progress. The browser and desktop app store progress separately.\n",
);
const archive = path.join(release, `Reading-Racer-${pkg.version}-x64.tar.gz`);
execFileSync("tar", ["-czf", archive, "-C", release, "Reading-Racer"], {
  stdio: "inherit",
});
const debRoot = path.join(release, "deb-stage");
await rm(debRoot, { recursive: true, force: true });
const opt = path.join(debRoot, "opt/reading-racer");
await mkdir(opt, { recursive: true });
await cp(stage, opt, { recursive: true });
const applications = path.join(debRoot, "usr/share/applications");
await mkdir(applications, { recursive: true });
await writeFile(
  path.join(applications, "reading-racer.desktop"),
  "[Desktop Entry]\nName=Reading Racer\nComment=Offline learning adventures for little pilots\nExec=/opt/reading-racer/reading-racer\nIcon=/opt/reading-racer/resources/app/dist/icons/icon-512.png\nTerminal=false\nType=Application\nCategories=Education;Game;\nStartupWMClass=reading-racer\n",
);
await mkdir(path.join(debRoot, "DEBIAN"), { recursive: true });
await writeFile(
  path.join(debRoot, "DEBIAN/control"),
  `Package: reading-racer\nVersion: ${pkg.version}\nSection: education\nPriority: optional\nArchitecture: amd64\nMaintainer: jxstovik\nDepends: libgtk-3-0 | libgtk-3-0t64, libnss3, libasound2 | libasound2t64, libgbm1, libxss1\nDescription: Offline learning adventures for little pilots\n Reading, phonics, counting, shapes, patterns, stories and nature.\n`,
);
// Electron's setuid helper remains available on systems where user namespaces are disabled.
await chmod(path.join(opt, "chrome-sandbox"), 0o4755);
execFileSync(
  "dpkg-deb",
  [
    "--root-owner-group",
    "--build",
    debRoot,
    path.join(release, `Reading-Racer-${pkg.version}-amd64.deb`),
  ],
  { stdio: "inherit" },
);
await rm(debRoot, { recursive: true, force: true });
console.log(`Created ${archive} and the Debian installer.`);
