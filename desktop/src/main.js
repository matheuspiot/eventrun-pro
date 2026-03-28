const { app, BrowserWindow, Menu, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const isDev = !app.isPackaged;
const serverPort = 3210;
const serverUrl = `http://127.0.0.1:${serverPort}`;
const maxServerRestartAttempts = 2;

let mainWindow = null;
let updateWindow = null;
let serverProcess = null;
let restartingServer = false;
let isQuitting = false;
let serverRestartAttempts = 0;
let logFilePath = "";
let updaterConfigured = false;
let manualCheckInProgress = false;
let updateDownloadRequested = false;
let updatePercent = 0;

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
      throw new Error(`Banco base não encontrado em ${templateDbPath}`);
    }

    fs.copyFileSync(templateDbPath, targetDbPath);
  }

  return targetDbPath;
}

function ensureUserDatabaseSchema(bundleRoot, targetDbPath) {
  const ensureScriptPath = path.join(bundleRoot, "scripts", "ensure-sqlite-schema.cjs");

  if (!fs.existsSync(ensureScriptPath)) {
    throw new Error(`Script de ajuste do banco não encontrado em ${ensureScriptPath}`);
  }

  const result = spawnSync(process.execPath, [ensureScriptPath, targetDbPath], {
    cwd: bundleRoot,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
    },
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
    throw new Error(`server.js não encontrado em ${serverScript}`);
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

    if (isQuitting || restartingServer || !mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    if (code === 0) {
      return;
    }

    serverRestartAttempts += 1;
    if (serverRestartAttempts > maxServerRestartAttempts) {
      if (!mainWindow.isDestroyed()) {
        await dialog.showMessageBox(mainWindow, {
          type: "error",
          title: "EventRun Pro",
          message: "O servidor interno falhou ao iniciar.",
          detail: "O aplicativo será fechado para evitar consumo excessivo de memória.",
        });
      }
      app.quit();
      return;
    }

    restartingServer = true;
    try {
      await sleep(1200);
      startServer();
      await waitForServer(20);
      serverRestartAttempts = 0;
      if (!mainWindow.isDestroyed()) {
        await mainWindow.loadURL(serverUrl);
      }
    } catch (error) {
      if (!mainWindow.isDestroyed()) {
        await dialog.showMessageBox(mainWindow, {
          type: "error",
          title: "EventRun Pro",
          message: "O servidor interno caiu e não conseguiu reiniciar.",
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
    await sleep(500);
  }

  throw new Error("Servidor Next não respondeu a tempo.");
}

function getUpdateWindowHtml() {
  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data:;" />
      <title>Atualização</title>
      <style>
        :root {
          --bg: #eef5ff;
          --surface: rgba(255,255,255,0.96);
          --text: #101828;
          --muted: #475467;
          --border: #d0d5dd;
          --accent: #007aff;
          --success: #43a047;
          --warning: #ff9500;
          --danger: #f44336;
        }
        * { box-sizing: border-box; }
        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        body {
          margin: 0;
          font-family: "SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at top left, rgba(0,122,255,0.10), transparent 28%),
            radial-gradient(circle at bottom right, rgba(130,215,255,0.18), transparent 30%),
            linear-gradient(180deg, #f8fbff 0%, var(--bg) 100%);
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }
        .card {
          width: 100%;
          max-width: 500px;
          border-radius: 30px;
          border: 1px solid rgba(255,255,255,0.7);
          background: var(--surface);
          box-shadow: 0 24px 70px rgba(16,24,40,0.12);
          padding: 28px;
        }
        .eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #667085;
        }
        h1 {
          margin: 12px 0 0;
          font-size: 34px;
          line-height: 1;
          letter-spacing: -0.04em;
        }
        p {
          margin: 0;
        }
        .desc {
          margin-top: 14px;
          font-size: 14px;
          line-height: 1.6;
          color: var(--muted);
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          background: #eef2ff;
          color: #344054;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--accent);
        }
        .bar {
          margin-top: 18px;
          height: 12px;
          width: 100%;
          border-radius: 999px;
          overflow: hidden;
          background: #e7eef7;
          border: 1px solid #dbe4ee;
        }
        .fill {
          height: 100%;
          width: 0%;
          border-radius: 999px;
          background: linear-gradient(90deg, #003bc1 0%, #007aff 100%);
          transition: width 240ms ease;
        }
        .fill.indeterminate {
          width: 42%;
          animation: slide 1.2s ease-in-out infinite;
        }
        .meta {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          color: #667085;
        }
        .note {
          margin-top: 18px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: #f8fbff;
          padding: 14px;
          font-size: 13px;
          line-height: 1.5;
          color: var(--muted);
        }
        @keyframes slide {
          0% { transform: translateX(-80%); }
          50% { transform: translateX(90%); }
          100% { transform: translateX(220%); }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="eyebrow">EventRun Pro</div>
        <h1 id="title">Verificando atualização</h1>
        <p id="description" class="desc">Consultando a versão publicada para saber se existe uma atualização nova.</p>
        <div id="pill" class="pill"><span id="dot" class="dot"></span><span id="phase">Verificação</span></div>
        <div class="bar"><div id="fill" class="fill indeterminate"></div></div>
        <div class="meta"><span id="meta-left">Aguarde</span><span id="meta-right">--</span></div>
        <div id="note" class="note">Você pode acompanhar o processo por aqui. O aplicativo vai avisar antes de reiniciar.</div>
      </div>
      <script>
        window.__setUpdateState = (payload) => {
          const fill = document.getElementById("fill");
          const dot = document.getElementById("dot");
          const pill = document.getElementById("pill");
          document.getElementById("title").textContent = payload.title;
          document.getElementById("description").textContent = payload.description;
          document.getElementById("phase").textContent = payload.phase;
          document.getElementById("meta-left").textContent = payload.metaLeft || "";
          document.getElementById("meta-right").textContent = payload.metaRight || "";
          document.getElementById("note").textContent = payload.note || "";

          fill.classList.toggle("indeterminate", !!payload.indeterminate);
          fill.style.width = payload.indeterminate ? "42%" : \`\${Math.max(0, Math.min(100, payload.progress || 0))}%\`;

          const palette = {
            info: { bg: "#eef2ff", text: "#344054", dot: "#007aff" },
            success: { bg: "#ecfdf3", text: "#027a48", dot: "#43a047" },
            warning: { bg: "#fff7ed", text: "#c2410c", dot: "#ff9500" },
            danger: { bg: "#fef3f2", text: "#b42318", dot: "#f44336" }
          };
          const current = palette[payload.tone || "info"];
          pill.style.background = current.bg;
          pill.style.color = current.text;
          dot.style.background = current.dot;
          fill.style.background = payload.tone === "success"
            ? "linear-gradient(90deg, #2e7d32 0%, #43a047 100%)"
            : payload.tone === "danger"
              ? "linear-gradient(90deg, #d32f2f 0%, #f44336 100%)"
              : payload.tone === "warning"
                ? "linear-gradient(90deg, #ef6c00 0%, #ff9500 100%)"
                : "linear-gradient(90deg, #003bc1 0%, #007aff 100%)";
        };
      </script>
    </body>
  </html>`;
}

async function ensureUpdateWindow() {
  if (updateWindow && !updateWindow.isDestroyed()) {
    return updateWindow;
  }

  updateWindow = new BrowserWindow({
    width: 560,
    height: 380,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    modal: true,
    autoHideMenuBar: true,
    parent: mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined,
    backgroundColor: "#eef5ff",
    title: "Atualização",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  updateWindow.on("closed", () => {
    updateWindow = null;
  });

  updateWindow.setMenuBarVisibility(false);

  await updateWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getUpdateWindowHtml())}`);
  return updateWindow;
}

async function showUpdateWindow(payload) {
  const windowRef = await ensureUpdateWindow();
  if (windowRef.isDestroyed()) {
    return;
  }

  if (!windowRef.isVisible()) {
    windowRef.show();
  }

  const serialized = JSON.stringify(payload).replace(/</g, "\\u003c");
  await windowRef.webContents.executeJavaScript(`window.__setUpdateState(${serialized});`, true);
}

function closeUpdateWindow() {
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.close();
  }
}

async function setUpdaterProgress(percent) {
  updatePercent = percent;
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (percent <= 0) {
      mainWindow.setProgressBar(-1);
      mainWindow.setTitle("EventRun Pro");
    } else {
      mainWindow.setProgressBar(Math.min(percent / 100, 1));
      mainWindow.setTitle(`EventRun Pro - Atualizando ${Math.floor(percent)}%`);
    }
  }

  if (manualCheckInProgress || updateDownloadRequested) {
    await showUpdateWindow({
      tone: "info",
      phase: updateDownloadRequested ? "Download" : "Verificação",
      title: updateDownloadRequested ? "Baixando atualização" : "Verificando atualização",
      description: updateDownloadRequested
        ? "O pacote novo está sendo baixado. Você pode continuar acompanhando o progresso aqui."
        : "Consultando a versão publicada para saber se existe uma atualização nova.",
      progress: percent,
      indeterminate: percent <= 0,
      metaLeft: updateDownloadRequested ? "Download em andamento" : "Aguarde",
      metaRight: percent > 0 ? `${Math.floor(percent)}%` : "--",
      note: updateDownloadRequested
        ? "Assim que o download terminar, o aplicativo vai preparar a instalação e reiniciar."
        : "A verificação confere a versão instalada com a release pública mais recente.",
    });
  }
}

async function finishUpdateWindow(payload, delayMs = 1600) {
  await showUpdateWindow(payload);
  await sleep(delayMs);
  closeUpdateWindow();
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
    await setUpdaterProgress(0);

    const shouldNotifyUser = manualCheckInProgress || updateDownloadRequested;
    if (shouldNotifyUser) {
      await finishUpdateWindow({
        tone: "danger",
        phase: "Falha",
        title: "Falha na atualização",
        description: "Não foi possível concluir o processo de atualização.",
        progress: 100,
        indeterminate: false,
        metaLeft: "Processo interrompido",
        metaRight: "Erro",
        note: String(error?.message || error),
      }, 2600);
    }

    manualCheckInProgress = false;
    updateDownloadRequested = false;
  });

  autoUpdater.on("checking-for-update", async () => {
    log("updater:checking");
    if (manualCheckInProgress) {
      await showUpdateWindow({
        tone: "info",
        phase: "Verificação",
        title: "Verificando atualização",
        description: "Consultando a versão publicada para saber se existe uma atualização nova.",
        progress: 15,
        indeterminate: true,
        metaLeft: "Conectando ao GitHub",
        metaRight: "--",
        note: "A verificação compara sua versão atual com a release pública mais recente.",
      });
    }
  });

  autoUpdater.on("update-not-available", async () => {
    log("updater:not-available");
    if (manualCheckInProgress) {
      await finishUpdateWindow({
        tone: "success",
        phase: "Concluído",
        title: "Tudo em dia",
        description: `Você já está na versão mais recente (${app.getVersion()}).`,
        progress: 100,
        indeterminate: false,
        metaLeft: "Versão instalada",
        metaRight: app.getVersion(),
        note: "Nenhuma ação extra é necessária neste momento.",
      });
    }
    manualCheckInProgress = false;
  });

  autoUpdater.on("update-available", async (info) => {
    log("updater:available", `version=${info.version}`);

    if (manualCheckInProgress) {
      await showUpdateWindow({
        tone: "warning",
        phase: "Atualização encontrada",
        title: `Nova versão: ${info.version}`,
        description: "Foi encontrada uma atualização disponível para o EventRun Pro.",
        progress: 100,
        indeterminate: false,
        metaLeft: "Versão atual",
        metaRight: app.getVersion(),
        note: "Confirme o download para continuar com a instalação guiada.",
      });
    }

    const result = await dialog.showMessageBox(mainWindow, {
      type: "question",
      title: "Atualização disponível",
      message: `Nova versão encontrada: ${info.version}.`,
      detail: "Deseja baixar e instalar agora?",
      buttons: ["Atualizar agora", "Depois"],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      updateDownloadRequested = true;
      await setUpdaterProgress(1);
      await autoUpdater.downloadUpdate();
      return;
    }

    closeUpdateWindow();
    manualCheckInProgress = false;
  });

  autoUpdater.on("download-progress", async (progress) => {
    const percent = Number(progress?.percent || 0);
    await setUpdaterProgress(percent);
    log("updater:download-progress", `${percent.toFixed(2)}%`);
  });

  autoUpdater.on("update-downloaded", async () => {
    log("updater:downloaded");
    await setUpdaterProgress(100);
    await finishUpdateWindow({
      tone: "success",
      phase: "Instalação",
      title: "Atualização pronta para instalar",
      description: "O download terminou e o aplicativo vai reiniciar para concluir a instalação.",
      progress: 100,
      indeterminate: true,
      metaLeft: "Download concluído",
      metaRight: "Preparando",
      note: "Aguarde alguns segundos. O EventRun Pro será fechado para instalar a nova versão e reabrir em seguida.",
    });
    await sleep(2600);

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
      message: "Atualizações automáticas não estão configuradas.",
      detail: "Verifique o arquivo updater.config.json do aplicativo.",
    });
    return;
  }

  if (manualCheckInProgress || updateDownloadRequested) {
    await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Atualização",
      message: "Já existe uma verificação ou download de atualização em andamento.",
    });
    return;
  }

  manualCheckInProgress = true;
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    manualCheckInProgress = false;
    await finishUpdateWindow({
      tone: "danger",
      phase: "Falha",
      title: "Falha ao verificar atualização",
      description: "Não foi possível consultar a release pública agora.",
      progress: 100,
      indeterminate: false,
      metaLeft: "Processo interrompido",
      metaRight: "Erro",
      note: String(error?.message || error),
    }, 2400);
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
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    return;
  }

  startServer();
  await waitForServer();
  serverRestartAttempts = 0;

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
      message: "A interface travou e será recarregada.",
      detail: `reason=${details.reason} exitCode=${details.exitCode}`,
    });
    if (!mainWindow.isDestroyed()) {
      await mainWindow.loadURL(serverUrl);
    }
  });
}

app.on("second-instance", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

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
  isQuitting = true;
  closeUpdateWindow();
  stopServer();
});
