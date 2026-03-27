const { app, BrowserWindow, Menu, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

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
let updatePercent = 0;

function toPrismaSqliteUrl(filePath) {
  return `file:${filePath.split(path.sep).join("/")}`;
}

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

function ensureUserDatabase(bundleRoot) {
  const userDataRoot = app.getPath("userData");
  const targetDbPath = path.join(userDataRoot, "eventrun-pro.db");
  const templateDbPath = path.join(bundleRoot, "data", "eventrun-template.db");

  fs.mkdirSync(userDataRoot, { recursive: true });

  if (!fs.existsSync(targetDbPath)) {
    if (!fs.existsSync(templateDbPath)) {
      throw new Error(`Banco base nao encontrado em ${templateDbPath}`);
    }

    fs.copyFileSync(templateDbPath, targetDbPath);
  }

  return targetDbPath;
}

function ensureUserDatabaseSchema(bundleRoot, targetDbPath) {
  const ensureScriptPath = path.join(bundleRoot, "scripts", "ensure-sqlite-schema.cjs");

  if (!fs.existsSync(ensureScriptPath)) {
    throw new Error(`Script de ajuste do banco nao encontrado em ${ensureScriptPath}`);
  }

  const result = spawnSync(process.execPath, [ensureScriptPath, targetDbPath], {
    cwd: bundleRoot,
    env: process.env,
    windowsHide: true,
    encoding: "utf8",
  });

  if (result.stdout) {
    log("db:ensure:stdout", result.stdout.trim());
  }
  if (result.stderr) {
    log("db:ensure:stderr", result.stderr.trim());
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || "Falha ao ajustar schema do banco local.");
  }
}

function startServer() {
  const bundleRoot = isDev
    ? path.join(__dirname, "..", "app-bundle")
    : path.join(process.resourcesPath, "app-bundle");
  const serverScript = path.join(bundleRoot, "server.js");
  const userDbPath = ensureUserDatabase(bundleRoot);
  ensureUserDatabaseSchema(bundleRoot, userDbPath);

  if (!fs.existsSync(serverScript)) {
    throw new Error(`server.js nao encontrado em ${serverScript}`);
  }

  const env = {
    ...process.env,
    PORT: String(serverPort),
    HOSTNAME: "127.0.0.1",
    ELECTRON_RUN_AS_NODE: "1",
    DATABASE_URL: toPrismaSqliteUrl(userDbPath),
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

  log("server:start", `${serverScript} | db=${userDbPath}`);
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

  function setUpdaterProgress(percent) {
    updatePercent = percent;
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (percent <= 0) {
        mainWindow.setProgressBar(-1);
        mainWindow.setTitle("EventRun Pro");
        return;
      }
      mainWindow.setProgressBar(Math.min(percent / 100, 1));
      mainWindow.setTitle(`EventRun Pro - Atualizando ${Math.floor(percent)}%`);
    }
  }

  autoUpdater.on("error", async (error) => {
    log("updater:error", String(error?.message || error));
    setUpdaterProgress(0);

    const shouldNotifyUser = manualCheckInProgress || updateDownloadRequested;
    if (shouldNotifyUser && mainWindow && !mainWindow.isDestroyed()) {
      await dialog.showMessageBox(mainWindow, {
        type: "error",
        title: "Atualizacao",
        message: "Falha no processo de atualizacao.",
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
        title: "Atualizacao",
        message: `Voce ja esta na versao mais recente (${app.getVersion()}).`,
      });
    }
    manualCheckInProgress = false;
  });

  autoUpdater.on("update-available", async (info) => {
    log("updater:available", `version=${info.version}`);

    const result = await dialog.showMessageBox(mainWindow, {
      type: "question",
      title: "Atualizacao disponivel",
      message: `Nova versao encontrada: ${info.version}.`,
      detail: "Deseja baixar e instalar agora?",
      buttons: ["Atualizar agora", "Depois"],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      updateDownloadRequested = true;
      setUpdaterProgress(1);
      await dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "Atualizacao",
        message: "Download da atualizacao iniciado.",
        detail: "Voce pode continuar usando o programa enquanto baixa.",
      });
      await autoUpdater.downloadUpdate();
      return;
    }

    manualCheckInProgress = false;
  });

  autoUpdater.on("download-progress", (progress) => {
    const percent = Number(progress?.percent || 0);
    setUpdaterProgress(percent);
    log("updater:download-progress", `${percent.toFixed(2)}%`);
  });

  autoUpdater.on("update-downloaded", async () => {
    log("updater:downloaded");
    setUpdaterProgress(100);
    await dialog.showMessageBox({
      type: "info",
      title: "Atualizacao pronta",
      message: "Atualizacao baixada com sucesso.",
      detail: "O aplicativo sera fechado e reiniciado para concluir a instalacao.",
      buttons: ["OK"],
    });

    manualCheckInProgress = false;
    updateDownloadRequested = false;
    autoUpdater.quitAndInstall(true, true);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      log("updater:initial-check-error", String(error?.message || error));
    });
  }, 2500);
}

async function checkForUpdatesManually() {
  if (!updaterConfigured) {
    await dialog.showMessageBox(mainWindow, {
      type: "warning",
      title: "EventRun Pro",
      message: "Atualizacoes automaticas nao estao configuradas.",
      detail: "Verifique o arquivo updater.config.json do aplicativo.",
    });
    return;
  }

  if (manualCheckInProgress || updateDownloadRequested) {
    await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Atualizacao",
      message: "Ja existe uma verificacao/download de atualizacao em andamento.",
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
      message: "Falha ao verificar atualizacoes.",
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
          label: `Versao ${app.getVersion()}`,
          enabled: false,
        },
        {
          label: "Informacoes do programa",
          click: async () => {
            await dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Sobre o EventRun Pro",
              message: "EventRun Pro",
              detail:
                "Sistema para gestao de eventos esportivos com foco em corridas.\n\nInclui projetos, custos, orcamento e regulamento.",
            });
          },
        },
        {
          label: "Verificar atualizacoes",
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
