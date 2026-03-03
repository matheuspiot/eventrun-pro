const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const isDev = !app.isPackaged;
const serverPort = 3210;
const serverUrl = `http://127.0.0.1:${serverPort}`;
let mainWindow = null;
let serverProcess = null;

function loadUpdaterConfig() {
  try {
    const configPath = isDev
      ? path.join(__dirname, "..", "updater.config.json")
      : path.join(process.resourcesPath, "app.asar", "updater.config.json");
    const raw = fs.readFileSync(configPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function startServer() {
  const bundleRoot = isDev
    ? path.join(__dirname, "..", "app-bundle")
    : path.join(process.resourcesPath, "app-bundle");
  const serverScript = path.join(bundleRoot, "server.js");

  if (!fs.existsSync(serverScript)) {
    throw new Error(`server.js nao encontrado em ${serverScript}`);
  }

  const env = {
    ...process.env,
    PORT: String(serverPort),
    HOSTNAME: "127.0.0.1",
    ELECTRON_RUN_AS_NODE: "1",
  };

  serverProcess = spawn(process.execPath, [serverScript], {
    cwd: bundleRoot,
    env,
    stdio: "ignore",
    windowsHide: true,
  });

  serverProcess.on("exit", () => {
    serverProcess = null;
  });
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
}

async function waitForServer(maxTries = 60) {
  for (let i = 0; i < maxTries; i += 1) {
    try {
      const response = await fetch(serverUrl);
      if (response.ok || response.status < 500) {
        return;
      }
    } catch {
      // ignore and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Servidor Next nao respondeu a tempo.");
}

function setupAutoUpdater() {
  const updaterConfig = loadUpdaterConfig();
  if (!updaterConfig) {
    return;
  }

  const githubToken = updaterConfig.githubToken;
  if (githubToken && githubToken !== "PASTE_GITHUB_TOKEN_HERE") {
    autoUpdater.requestHeaders = {
      Authorization: `token ${githubToken}`,
    };
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("error", (error) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("app:update-error", error.message);
    }
  });

  autoUpdater.on("update-downloaded", async () => {
    const result = await dialog.showMessageBox({
      type: "info",
      title: "Atualizacao pronta",
      message: "Uma atualizacao foi baixada. Deseja reiniciar para instalar agora?",
      buttons: ["Instalar agora", "Depois"],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall(true, true);
    }
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {
      // ignore check errors
    });
  }, 2500);
}

async function createWindow() {
  startServer();
  await waitForServer();

  mainWindow = new BrowserWindow({
    title: "EventRun Pro",
    width: 1360,
    height: 860,
    minWidth: 1120,
    minHeight: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await mainWindow.loadURL(serverUrl);
}

app.whenReady().then(async () => {
  try {
    await createWindow();
    if (!isDev) {
      setupAutoUpdater();
    }
  } catch (error) {
    await dialog.showMessageBox({
      type: "error",
      title: "EventRun Pro",
      message: "Falha ao iniciar o aplicativo.",
      detail: String(error?.message || error),
    });
    app.quit();
  }
});

app.on("window-all-closed", () => {
  stopServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopServer();
});
