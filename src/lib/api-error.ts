export function toApiErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const normalized = raw.toLowerCase();

  if (normalized.includes("jwt_secret")) {
    return "Configuração ausente: JWT_SECRET.";
  }

  if (
    normalized.includes("database_url") ||
    normalized.includes("can't reach database server") ||
    normalized.includes("cant reach database server") ||
    normalized.includes("p1001")
  ) {
    return "Falha de conexão com o banco de dados. Verifique o DATABASE_URL.";
  }

  return "Erro interno do servidor.";
}
