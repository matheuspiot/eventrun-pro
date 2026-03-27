# EventRun Pro

Sistema para gestao de eventos esportivos com foco em corridas. A aplicacao cobre cadastro de eventos, biblioteca de custos, planejamento de orcamento, regulamento, proposta comercial e empacotamento desktop com auto-update via GitHub Releases.

## Stack

- Next.js
- React
- Prisma
- SQLite
- Electron
- electron-builder

## Modulos principais

- `Dashboard`: resumo financeiro e lista de projetos
- `Orcamento`: simulacao financeira por evento
- `Biblioteca de custos`: custos padrao reutilizaveis
- `Regulamento`: configuracao e exportacao de PDF
- `Marketing`: proposta comercial em PDF
- `Desktop`: shell Electron com atualizacao automatica

## Ambiente local

Crie o arquivo `.env` com os valores necessarios. O projeto usa pelo menos:

```env
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=troque-este-segredo
```

## Comandos

```bash
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run db:init
npm run desktop:prepare
npm run desktop:dist:win
```

## Fluxo local

1. Instale dependencias com `npm install`.
2. Gere o client do Prisma com `npm run prisma:generate`.
3. Inicialize o banco local se necessario com `npm run db:init`.
4. Rode a aplicacao com `npm run dev`.

## Desktop e atualizacoes

O aplicativo desktop publica releases publicas no GitHub e os usuarios instalados recebem novas versoes pelo mecanismo de auto-update.

Antes de qualquer pedido para "subir atualizacao", leia obrigatoriamente:

- [RELEASE_PROCESS.md](/d:/Documentos/Clube%20Piot/EventRun%20Pro/RELEASE_PROCESS.md)

Resumo da regra:

1. Consultar a release publica atual.
2. Descobrir a versao mais recente publicada.
3. Gerar sempre uma versao nova em `desktop/package.json`.
4. Buildar os artefatos novos.
5. Publicar a release com a mesma versao.

## Estrutura relevante

- `src/app`: rotas e paginas
- `src/modules`: logica por dominio
- `src/lib`: auth, prisma e utilitarios
- `prisma`: schema e migrations
- `desktop`: shell Electron e publicacao
- `scripts`: automacoes de build e banco

## Observacao operacional

Se o objetivo for publicar uma nova atualizacao desktop, o procedimento correto nao deve ser feito de memoria. O arquivo `RELEASE_PROCESS.md` existe justamente para ser lido antes de qualquer release.
