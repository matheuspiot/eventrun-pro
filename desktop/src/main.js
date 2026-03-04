const { app, BrowserWindow, Menu, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const isDev = !app.isPackaged;
const serverPort = 3210;
const serverUrl = `http://127.0.0.1:${serverPort}`;
let mainWindow = null;
let serverProcess = null;
let restartingServer = false;
let logFilePath = "";
let updaterConfigured = false;
let manualCheckInProgress = false;
let updateDownloadRequested = false;

function log(message, extra = "") {
  try {
    if (!logFilePath) {
      return;
    }
    fs.appendFileSync(
      logFilePath,
      `[${new Date().toISOString()}] ${message}${extra ? ` | ${extra}` : ""}\n`,
      "utf8",
    );
  } catch {
    // noop
  }
}

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
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  serverProcess.stdout.on("data", (chunk) => {
    log("server:stdout", String(chunk).trim());
  });
  serverProcess.stderr.on("data", (chunk) => {
    log("server:stderr", String(chunk).trim());
  });

  serverProcess.on("exit", async (code, signal) => {
    log("server:exit", `code=${code ?? "null"} signal=${signal ?? "null"}`);
    serverProcess = null;

    if (restartingServer || !mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    restartingServer = true;
    try {
      startServer();
      await waitForServer(20);
      if (!mainWindow.isDestroyed()) {
        await mainWindow.loadURL(serverUrl);
      }
    } catch (error) {
      if (!mainWindow.isDestroyed()) {
        await dialog.showMessageBox(mainWindow, {
          type: "error",
          title: "EventRun Pro",
          message: "O servidor interno caiu e nao conseguiu reiniciar.",
          detail: String(error?.message || error),
        });
      }
    } finally {
      restartingServer = false;
    }
  });

  log("server:start", serverScript);
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
    updaterConfigured = false;
    return;
  }
  updaterConfigured = true;

  const githubToken = updaterConfig.githubToken;
  if (githubToken && githubToken !== "PASTE_GITHUB_TOKEN_HERE") {
    autoUpdater.requestHeaders = {
      Authorization: `token ${githubToken}`,
    };
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("error", async (error) => {
    log("updater:error", String(error?.message || error));
    if (mainWindow && !mainWindow.isDestroyed()) {
      await dialog.showMessageBox(mainWindow, {
        type: "error",
        title: "Atualização",
        message: "Falha no processo de atualização.",
        detail: String(error?.message || error),
      });
    }
    manualCheckInProgress = false;
    updateDownloadRequested = false;
  });

  autoUpdater.on("checking-for-update", () => {
    log("updater:checking");
  });

  autoUpdater.on("update-not-available", async () => {
    log("updater:not-available");
    if (manualCheckInProgress && mainWindow && !mainWindow.isDestroyed()) {
      await dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "Atualização",
        message: `Você já está na versão mais recente (${app.getVersion()}).`,
      });
    }
    manualCheckInProgress = false;
  });

  autoUpdater.on("update-available", async (info) => {
    log("updater:available", `version=${info.version}`);

    const result = await dialog.showMessageBox(mainWindow, {
      type: "question",
      title: "Atualização disponível",
      message: `Nova versão encontrada: ${info.version}.`,
      detail: "Deseja baixar e instalar agora?",
      buttons: ["Baixar e instalar", "Agora não"],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      updateDownloadRequested = true;
      await autoUpdater.downloadUpdate();
      return;
    }

    manualCheckInProgress = false;
  });

  autoUpdater.on("update-downloaded", async () => {
    log("updater:downloaded");
    const result = await dialog.showMessageBox({
      type: "info",
      title: "Atualização pronta",
      message: "Atualização baixada com sucesso.",
      detail: "O aplicativo será reiniciado para concluir a instalação.",
      buttons: ["Instalar agora", "Depois"],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall(false, true);
    }

    manualCheckInProgress = false;
    updateDownloadRequested = false;
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      log("updater:initial-check-error", String(error?.message || error));
      // ignore check errors
    });
  }, 2500);
}

async function checkForUpdatesManually() {
  if (!updaterConfigured) {
    await dialog.showMessageBox(mainWindow, {
      type: "warning",
      title: "EventRun Pro",
      message: "Atualizações automáticas não estão configuradas.",
      detail: "Verifique o arquivo updater.config.json do aplicativo.",
    });
    return;
  }

  if (manualCheckInProgress || updateDownloadRequested) {
    await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Atualização",
      message: "Já existe uma verificação/download de atualização em andamento.",
    });
    return;
  }

  manualCheckInProgress = true;
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    manualCheckInProgress = false;
    await dialog.showMessageBox(mainWindow, {
      type: "error",
      title: "EventRun Pro",
      message: "Falha ao verificar atualizações.",
      detail: String(error?.message || error),
    });
  }
}

function setupAppMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: "Sobre",
      submenu: [
        {
          label: `Versão ${app.getVersion()}`,
          enabled: false,
        },
        {
          label: "Informações do programa",
          click: async () => {
            await dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Sobre o EventRun Pro",
              message: "EventRun Pro",
              detail:
                "Sistema para gestão de eventos esportivos com foco em corridas.\n\nInclui projetos, custos, orçamento e regulamento.",
            });
          },
        },
        {
          label: "Verificar atualizações",
          click: async () => {
            await checkForUpdatesManually();
          },
        },
        { type: "separator" },
        { label: "Sair", role: "quit" },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
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

  mainWindow.webContents.on("render-process-gone", async (_event, details) => {
    log("renderer:gone", JSON.stringify(details));
    await dialog.showMessageBox(mainWindow, {
      type: "error",
      title: "EventRun Pro",
      message: "A interface travou e sera recarregada.",
      detail: `reason=${details.reason} exitCode=${details.exitCode}`,
    });
    if (!mainWindow.isDestroyed()) {
      await mainWindow.loadURL(serverUrl);
    }
  });
}

app.whenReady().then(async () => {
  logFilePath = path.join(app.getPath("userData"), "eventrun-desktop.log");
  log("app:ready", `isPackaged=${app.isPackaged}`);
  setupAppMenu();
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
