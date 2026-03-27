const fs = require("node:fs");
const path = require("node:path");
const initSqliteDb = require("./init-sqlite-db.cjs");

const projectRoot = path.resolve(__dirname, "..");
const desktopRoot = path.join(projectRoot, "desktop");
const outputRoot = path.join(desktopRoot, "app-bundle");
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const staticRoot = path.join(projectRoot, ".next", "static");
const publicRoot = path.join(projectRoot, "public");
const templateDataRoot = path.join(outputRoot, "data");
const templateDbPath = path.join(templateDataRoot, "eventrun-template.db");
const outputScriptsRoot = path.join(outputRoot, "scripts");
const sqlJsSourceRoot = path.join(projectRoot, "node_modules", "sql.js");
const sqlJsOutputRoot = path.join(outputRoot, "node_modules", "sql.js");

async function main() {
  if (!fs.existsSync(standaloneRoot)) {
    throw new Error("Build standalone nao encontrado. Rode npm run build antes.");
  }

  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });

  fs.cpSync(standaloneRoot, outputRoot, { recursive: true, dereference: true });

  const outputStatic = path.join(outputRoot, ".next", "static");
  fs.mkdirSync(path.dirname(outputStatic), { recursive: true });
  if (fs.existsSync(staticRoot)) {
    fs.cpSync(staticRoot, outputStatic, { recursive: true, dereference: true });
  }

  const outputPublic = path.join(outputRoot, "public");
  if (fs.existsSync(publicRoot)) {
    fs.cpSync(publicRoot, outputPublic, { recursive: true, dereference: true });
  }

  fs.mkdirSync(templateDataRoot, { recursive: true });
  fs.rmSync(templateDbPath, { force: true });
  await initSqliteDb(templateDbPath);

  fs.mkdirSync(outputScriptsRoot, { recursive: true });
  fs.copyFileSync(
    path.join(projectRoot, "scripts", "ensure-sqlite-schema.cjs"),
    path.join(outputScriptsRoot, "ensure-sqlite-schema.cjs"),
  );
  fs.copyFileSync(
    path.join(projectRoot, "scripts", "init-sqlite-db.cjs"),
    path.join(outputScriptsRoot, "init-sqlite-db.cjs"),
  );

  if (!fs.existsSync(sqlJsSourceRoot)) {
    throw new Error(`Dependencia sql.js nao encontrada em ${sqlJsSourceRoot}`);
  }
  fs.rmSync(sqlJsOutputRoot, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(sqlJsOutputRoot), { recursive: true });
  fs.cpSync(sqlJsSourceRoot, sqlJsOutputRoot, { recursive: true, dereference: true });

  const envSource = fs.existsSync(path.join(projectRoot, ".env"))
    ? path.join(projectRoot, ".env")
    : path.join(projectRoot, ".env.example");
  if (fs.existsSync(envSource)) {
    fs.copyFileSync(envSource, path.join(outputRoot, ".env"));
  }

  console.log("Bundle desktop pronto em:", outputRoot);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
