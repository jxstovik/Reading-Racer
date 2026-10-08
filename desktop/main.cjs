const {
  app,
  BrowserWindow,
  protocol,
  net,
  session,
  Menu,
  dialog,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);
const smoke = process.argv.includes("--smoke-test");
app.setName("Reading Racer");
if (smoke)
  app.setPath(
    "userData",
    path.join(app.getPath("temp"), "reading-racer-desktop-smoke"),
  );
if (!app.requestSingleInstanceLock()) app.quit();
else {
  let win;
  app.on("second-instance", () => {
    if (win) {
      win.show();
      win.focus();
    }
  });
  app.whenReady().then(async () => {
    const root = path.resolve(__dirname, "../dist");
    protocol.handle("app", (request) => {
      const url = new URL(request.url);
      if (url.host !== "reading-racer")
        return new Response("Not found", { status: 404 });
      let decoded;
      try {
        decoded = decodeURIComponent(url.pathname);
      } catch {
        return new Response("Bad request", { status: 400 });
      }
      const target = path.resolve(root, "." + decoded);
      if (!target.startsWith(root + path.sep) && target !== root)
        return new Response("Forbidden", { status: 403 });
      return net.fetch(
        pathToFileURL(
          target === root ? path.join(root, "index.html") : target,
        ).toString(),
      );
    });
    session.defaultSession.setPermissionRequestHandler(
      (_contents, _permission, callback) => callback(false),
    );
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.webRequest.onBeforeRequest(
      { urls: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*"] },
      (_details, callback) => callback({ cancel: true }),
    );
    session.defaultSession.webRequest.onHeadersReceived((details, callback) =>
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-src 'none'",
          ],
        },
      }),
    );
    win = new BrowserWindow({
      width: 1240,
      height: 860,
      minWidth: 800,
      minHeight: 600,
      title: "Reading Racer",
      icon: path.join(root, "icons/icon-512.png"),
      show: !smoke,
      backgroundColor: "#eef7fc",
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
      },
    });
    win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    win.webContents.on("will-navigate", (event, url) => {
      if (!url.startsWith("app://reading-racer/")) event.preventDefault();
    });
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: "Reading Racer",
          submenu: [
            {
              label: "Full screen",
              accelerator: "F11",
              click: () => win.setFullScreen(!win.isFullScreen()),
            },
            {
              label: "About Reading Racer",
              click: () =>
                dialog.showMessageBox(win, {
                  message: "Reading Racer",
                  detail:
                    "Offline learning adventures for curious little pilots. Progress is saved on this laptop. Open Parent Settings to export a backup.",
                }),
            },
            { role: "quit" },
          ],
        },
      ]),
    );
    await win.loadURL("app://reading-racer/index.html");
    if (smoke) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const audioPath =
        "/audio/" +
        fs
          .readdirSync(path.join(root, "audio"))
          .find((x) => x.endsWith(".ogg"));
      const result = await win.webContents.executeJavaScript(`(async()=>{
        const audio=await fetch(${JSON.stringify(audioPath)});
        const decoded=await new Promise(resolve=>{const clip=new Audio(${JSON.stringify(audioPath)});clip.onloadedmetadata=()=>resolve(clip.duration>0);clip.onerror=()=>resolve(false);setTimeout(()=>resolve(false),4000);});
        localStorage.setItem('desktop-smoke','ok');const storage=localStorage.getItem('desktop-smoke')==='ok';localStorage.removeItem('desktop-smoke');
        let remoteBlocked=false;try{await fetch('https://example.com/reading-racer-smoke');}catch{remoteBlocked=true;}
        return {title:document.title,missions:document.querySelectorAll('.mission-card').length,audio:audio.ok,decoded,storage,secure:window.isSecureContext,nodeAccess:typeof window.require,remoteBlocked};
      })()`);
      console.log("READING_RACER_SMOKE " + JSON.stringify(result));
      app.exit(
        result.missions === 2 &&
          result.audio &&
          result.decoded &&
          result.remoteBlocked &&
          result.storage &&
          result.nodeAccess === "undefined"
          ? 0
          : 1,
      );
    }
  });
  app.on("window-all-closed", () => app.quit());
}
