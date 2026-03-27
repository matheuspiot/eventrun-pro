const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function ensureSqliteFileExists(databaseUrl) {
  if (!databaseUrl || !databaseUrl.startsWith("file:")) {
    return;
  }

  const relativePath = databaseUrl.slice("file:".length);
  const schemaPath = path.resolve(process.cwd(), "prisma", "schema.prisma");
  const schemaDir = path.dirname(schemaPath);
  const dbPath = path.resolve(schemaDir, relativePath);

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  if (!fs.existsSync(dbPath)) {
    fs.closeSync(fs.openSync(dbPath, "w"));
  }
}

function main() {
  const databaseUrl = process.env.DATABASE_URL;
  ensureSqliteFileExists(databaseUrl);

  const command =
    process.platform === "win32"
      ? { file: "cmd.exe", args: ["/c", "npx", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"] }
      : { file: "npx", args: ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"] };

  const result = spawnSync(command.file, command.args, {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

main();
