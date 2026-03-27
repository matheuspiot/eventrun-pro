# Processo de Release

Este documento e a fonte de verdade para publicar uma nova versao do `EventRun Pro Desktop`.

## Regra principal

Antes de qualquer release:

1. Consulte a release publica mais recente no GitHub.
2. Confirme qual e a versao atual publicada.
3. Gere sempre uma versao nova e unica.
4. Nunca reutilize uma versao ja publicada.

Quando a release publica e criada corretamente, quem ja tem o programa instalado recebe a atualizacao pelo auto-update.

## Onde a versao precisa bater

- `desktop/package.json`
- nome do instalador gerado em `desktop/dist`
- `desktop/dist/latest.yml`
- tag/version da release publica no GitHub

Se esses pontos nao estiverem alinhados, o auto-update pode falhar ou nao detectar a nova versao.

## Fluxo obrigatorio

1. Abrir a pagina de releases do repositorio `matheuspiot/eventrun-pro`.
2. Identificar a ultima versao publicada.
3. Atualizar `desktop/package.json` para uma versao maior que a atual.
4. Gerar os artefatos:

```bash
npm run desktop:dist:win
```

5. Validar se os arquivos novos existem em `desktop/dist`:

```text
EventRun.Pro.Setup.<nova-versao>.exe
EventRun.Pro.Setup.<nova-versao>.exe.blockmap
latest.yml
```

6. Fazer commit e push.
7. Criar a release publica no GitHub com a mesma versao.
8. Anexar os artefatos gerados em `desktop/dist`.
9. Publicar a release.

## Checklist rapido

- Li a release publica atual no GitHub
- A versao nova e diferente da ultima publicada
- `desktop/package.json` foi atualizado
- O build desktop terminou sem erro
- O `latest.yml` foi regenerado
- O instalador `.exe` da nova versao existe
- Commit e push foram enviados
- A release publica foi criada com a mesma versao dos artefatos

## Observacoes

- O auto-update esta configurado para release publica do GitHub em `desktop/package.json`.
- O repositorio configurado para publicacao esta em `desktop/updater.config.json`.
- Se o pedido for "subir atualizacao", este arquivo deve ser lido antes de executar qualquer publicacao.
