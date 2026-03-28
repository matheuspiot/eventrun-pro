const fs = require("node:fs");
const path = require("node:path");
const initSqlJs = require("sql.js");
const initSqliteDb = require("./init-sqlite-db.cjs");

const { schemaSql } = initSqliteDb;

function getExistingColumns(db, tableName) {
  const result = db.exec(`PRAGMA table_info("${tableName}");`);
  const values = result[0]?.values || [];
  return new Set(values.map((row) => row[1]));
}

function ensureColumn(db, tableName, columnName, definitionSql) {
  const columns = getExistingColumns(db, tableName);
  if (!columns.has(columnName)) {
    db.run(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${definitionSql};`);
  }
}

function slugifyUsername(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function buildBaseUsername(user) {
  const username = slugifyUsername(user.username);
  if (username.length >= 3) return username;

  const emailBase = slugifyUsername(String(user.email || "").split("@")[0]);
  if (emailBase.length >= 3) return emailBase;

  const nameBase = slugifyUsername(user.name);
  if (nameBase.length >= 3) return nameBase;

  return `user-${String(user.id).slice(0, 8).toLowerCase()}`;
}

function ensureUniqueUsernames(db) {
  const result = db.exec('SELECT "id", "name", "email", "username" FROM "User" ORDER BY "createdAt" ASC, "id" ASC;');
  const rows = result[0]?.values || [];
  if (rows.length === 0) {
    return;
  }

  const used = new Set();
  const updates = [];

  for (const row of rows) {
    const user = {
      id: String(row[0]),
      name: row[1] ?? "",
      email: row[2] ?? "",
      username: row[3] ?? "",
    };

    const base = buildBaseUsername(user);
    let candidate = base;
    let suffix = 2;

    while (used.has(candidate) || candidate.length < 3) {
      const raw = `${base}-${suffix}`;
      candidate = raw.slice(0, 24);
      suffix += 1;
    }

    used.add(candidate);

    if (candidate !== user.username) {
      updates.push({ id: user.id, username: candidate });
    }
  }

  if (updates.length === 0) {
    return;
  }

  db.run("BEGIN TRANSACTION;");
  try {
    for (const update of updates) {
      const escapedUsername = update.username.replace(/'/g, "''");
      const escapedId = update.id.replace(/'/g, "''");
      db.run(`UPDATE "User" SET "username" = '${escapedUsername}' WHERE "id" = '${escapedId}';`);
    }
    db.run("COMMIT;");
  } catch (error) {
    db.run("ROLLBACK;");
    throw error;
  }
}

async function ensureSqliteSchema(fileArg) {
  if (!fileArg) {
    throw new Error("Informe o caminho do arquivo SQLite a ser ajustado.");
  }

  const targetPath = path.resolve(process.cwd(), fileArg);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  const SQL = await initSqlJs();
  const db = fs.existsSync(targetPath)
    ? new SQL.Database(fs.readFileSync(targetPath))
    : new SQL.Database();

  db.run(schemaSql);

  ensureColumn(db, "User", "role", "TEXT NOT NULL DEFAULT 'ADMIN'");
  ensureColumn(db, "User", "username", "TEXT");
  ensureUniqueUsernames(db);
  db.run('DROP INDEX IF EXISTS "User_username_key";');
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");');

  ensureColumn(db, "Event", "modalidades", "TEXT");
  ensureColumn(db, "Event", "distancias", "TEXT");
  ensureColumn(db, "Event", "capacidadeMaxima", "INTEGER");
  ensureColumn(db, "Event", "limiteTecnico", "TEXT");
  ensureColumn(db, "Event", "cronogramaResumo", "TEXT");
  ensureColumn(db, "Event", "patrocinadores", "TEXT");
  ensureColumn(db, "Event", "fornecedores", "TEXT");

  ensureColumn(db, "EventBudget", "logoDataUrl", "TEXT");
  ensureColumn(
    db,
    "EventBudget",
    "taxaCancelamentoReembolsoPercentual",
    "REAL NOT NULL DEFAULT 0",
  );

  ensureColumn(db, "RegulationConfig", "templateTipo", "TEXT NOT NULL DEFAULT 'CORRIDA_RUA'");
  ensureColumn(db, "RegulationConfig", "permiteTransferencia", "BOOLEAN NOT NULL DEFAULT false");
  ensureColumn(
    db,
    "RegulationConfig",
    "permiteRetiradaTerceiros",
    "BOOLEAN NOT NULL DEFAULT true",
  );
  ensureColumn(db, "RegulationConfig", "exigeAtestadoMedico", "BOOLEAN NOT NULL DEFAULT false");
  ensureColumn(db, "RegulationConfig", "logoDataUrl", "TEXT");
  ensureColumn(db, "RegulationConfig", "faixaEtariaInicio", "INTEGER NOT NULL DEFAULT 18");
  ensureColumn(db, "RegulationConfig", "faixaEtariaFim", "INTEGER NOT NULL DEFAULT 80");
  ensureColumn(db, "RegulationConfig", "intervaloFaixaEtaria", "INTEGER NOT NULL DEFAULT 5");
  ensureColumn(db, "RegulationConfig", "kitDescricao", "TEXT");
  ensureColumn(db, "RegulationConfig", "premiacaoDescricao", "TEXT");
  ensureColumn(db, "RegulationConfig", "regrasGeraisExtra", "TEXT");
  ensureColumn(db, "RegulationConfig", "documentosObrigatorios", "TEXT");
  ensureColumn(db, "RegulationConfig", "politicaCancelamento", "TEXT");
  ensureColumn(db, "EventOperationTask", "lembreteEm", "DATETIME");

  fs.writeFileSync(targetPath, Buffer.from(db.export()));
  db.close();

  console.log(`Schema SQLite garantido em: ${targetPath}`);
}

module.exports = ensureSqliteSchema;

if (require.main === module) {
  ensureSqliteSchema(process.argv[2]).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
