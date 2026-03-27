# Prisma Migrations

O historico original de migrations foi gerado em um contexto antigo com `postgresql`.
Como a aplicacao atual usa `sqlite`, esse historico foi arquivado em
`prisma/migrations_archive/postgresql_legacy`.

O fluxo valido a partir de agora e:

1. Alterar `prisma/schema.prisma`
2. Gerar uma nova migration com `npx prisma migrate dev --name <descricao>`
3. Validar com `npx prisma migrate status`
4. Para aplicar migrations em SQLite, preferir `npm run db:migrate:deploy`
5. Em ambiente ja existente, nunca editar `migration_lock.toml` manualmente para trocar provider

Baseline SQLite atual:

- `prisma/migrations/20260327190000_sqlite_baseline`

Em bancos antigos que ja existiam antes da baseline, a reconciliacao deve ser feita com:

- `npx prisma migrate resolve --applied 20260327190000_sqlite_baseline`

Observacao:

- Em alguns cenarios locais com SQLite, o engine do Prisma nao cria o arquivo `.db` vazio sozinho.
- O script `npm run db:migrate:deploy` cria o arquivo antes do `prisma migrate deploy` e evita esse problema.
