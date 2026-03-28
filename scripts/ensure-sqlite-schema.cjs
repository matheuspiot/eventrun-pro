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
