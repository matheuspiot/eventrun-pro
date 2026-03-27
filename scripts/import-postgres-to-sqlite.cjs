const { execFileSync } = require("node:child_process");
const path = require("node:path");

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function runPsqlQuery({ psqlPath, host, user, database, password, sql }) {
  const output = execFileSync(
    psqlPath,
    ["-h", host, "-U", user, "-d", database, "-t", "-A", "-c", sql],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        PGPASSWORD: password,
      },
    },
  );

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function loadRows(config, tableName) {
  const sql = `COPY (SELECT row_to_json(t) FROM (SELECT * FROM "${tableName}" ORDER BY "id") t) TO STDOUT;`;
  return runPsqlQuery({ ...config, sql }).map((line) => JSON.parse(line));
}

function toDate(value) {
  return value ? new Date(value) : null;
}

function toNumber(value) {
  return value == null ? null : Number(value);
}

async function main() {
  const targetDatabaseUrl = getArgValue("--target-db");
  if (!targetDatabaseUrl) {
    throw new Error("Use --target-db com o caminho/URL do SQLite de destino.");
  }

  const force = hasFlag("--force");
  process.env.DATABASE_URL = targetDatabaseUrl;

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  const pgConfig = {
    psqlPath:
      getArgValue("--psql-path") || "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
    host: getArgValue("--pg-host") || "127.0.0.1",
    user: getArgValue("--pg-user") || "postgres",
    database: getArgValue("--pg-db") || "eventrun_pro",
    password: getArgValue("--pg-password") || "postgres",
  };

  try {
    const existingTargetCount = await prisma.organization.count();
    if (existingTargetCount > 0 && !force) {
      throw new Error("O banco SQLite de destino nao esta vazio. Use --force para sobrescrever.");
    }

    const organizations = loadRows(pgConfig, "Organization");
    const users = loadRows(pgConfig, "User");
    const events = loadRows(pgConfig, "Event");
    const costItems = loadRows(pgConfig, "CostItem");
    const budgets = loadRows(pgConfig, "EventBudget");
    const budgetItems = loadRows(pgConfig, "EventBudgetItem");
    const regulations = loadRows(pgConfig, "RegulationConfig");

    if (force) {
      await prisma.eventBudgetItem.deleteMany();
      await prisma.regulationConfig.deleteMany();
      await prisma.eventBudget.deleteMany();
      await prisma.costItem.deleteMany();
      await prisma.event.deleteMany();
      await prisma.user.deleteMany();
      await prisma.organization.deleteMany();
    }

    await prisma.organization.createMany({
      data: organizations.map((item) => ({
        id: item.id,
        name: item.name,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })),
    });

    await prisma.user.createMany({
      data: users.map((item) => ({
        id: item.id,
        organizationId: item.organizationId,
        name: item.name,
        email: item.email,
        passwordHash: item.passwordHash,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })),
    });

    await prisma.event.createMany({
      data: events.map((item) => ({
        id: item.id,
        organizationId: item.organizationId,
        nomeEvento: item.nomeEvento,
        dataEvento: new Date(item.dataEvento),
        cidade: item.cidade,
        estado: item.estado,
        localLargada: item.localLargada,
        organizador: item.organizador,
        cnpjOrganizador: item.cnpjOrganizador,
        status: item.status,
        criadoEm: new Date(item.criadoEm),
        atualizadoEm: new Date(item.atualizadoEm),
      })),
    });

    await prisma.costItem.createMany({
      data: costItems.map((item) => ({
        id: item.id,
        organizationId: item.organizationId,
        nome: item.nome,
        categoria: item.categoria,
        tipoCusto: item.tipoCusto,
        unidade: item.unidade,
        custoPadrao: Number(item.custoPadrao),
        descricao: item.descricao,
        criadoEm: new Date(item.criadoEm),
        atualizadoEm: new Date(item.atualizadoEm),
      })),
    });

    await prisma.eventBudget.createMany({
      data: budgets.map((item) => ({
        id: item.id,
        eventId: item.eventId,
        logoDataUrl: item.logoDataUrl,
        metaInscritos: item.metaInscritos,
        patrocinioPrevisto: toNumber(item.patrocinioPrevisto),
        lucroAlvoPercentual: toNumber(item.lucroAlvoPercentual),
        taxaPlataformaPercentual: toNumber(item.taxaPlataformaPercentual),
        impostoPercentual: toNumber(item.impostoPercentual),
        taxaCancelamentoReembolsoPercentual: toNumber(item.taxaCancelamentoReembolsoPercentual),
        criadoEm: new Date(item.criadoEm),
        atualizadoEm: new Date(item.atualizadoEm),
      })),
    });

    await prisma.eventBudgetItem.createMany({
      data: budgetItems.map((item) => ({
        id: item.id,
        eventBudgetId: item.eventBudgetId,
        costItemId: item.costItemId,
        quantidade: toNumber(item.quantidade),
        valorUnitario: toNumber(item.valorUnitario),
        tipoCusto: item.tipoCusto,
      })),
    });

    await prisma.regulationConfig.createMany({
      data: regulations.map((item) => ({
        id: item.id,
        eventId: item.eventId,
        possuiKids: item.possuiKids,
        possuiChip: item.possuiChip,
        possuiPremiacaoDinheiro: item.possuiPremiacaoDinheiro,
        logoDataUrl: item.logoDataUrl,
        faixaEtariaInicio: item.faixaEtariaInicio,
        faixaEtariaFim: item.faixaEtariaFim,
        intervaloFaixaEtaria: item.intervaloFaixaEtaria,
        tempoLimiteMinutos: item.tempoLimiteMinutos,
        plataformaInscricao: JSON.stringify(item.plataformaInscricao || []),
        valorInscricao: toNumber(item.valorInscricao),
        limiteVagas: item.limiteVagas,
        emailContato: item.emailContato,
        whatsappContato: item.whatsappContato,
        dataInicioInscricao: new Date(item.dataInicioInscricao),
        dataFimInscricao: new Date(item.dataFimInscricao),
        criadoEm: new Date(item.criadoEm),
        atualizadoEm: new Date(item.atualizadoEm),
      })),
    });

    console.log(
      JSON.stringify(
        {
          imported: {
            organizations: organizations.length,
            users: users.length,
            events: events.length,
            costItems: costItems.length,
            budgets: budgets.length,
            budgetItems: budgetItems.length,
            regulations: regulations.length,
          },
          targetDatabaseUrl,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
