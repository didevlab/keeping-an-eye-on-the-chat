## 1. Baseline e documentacao atual
- [x] 1.1 Executar baseline: `npm ci` e `TWITCH_CHAT_URL=... DIAGNOSTICS=1 npm run start:diag` e registrar logs.
- [x] 1.2 Documentar entrypoints, scripts npm, variaveis de ambiente, fluxo de janelas, seletores e dependencias.

## 2. Nova estrutura de pastas (JS primeiro)
- [x] 2.1 Criar estrutura `src/main`, `src/preload`, `src/renderer/{scripts,styles,assets}`, `src/shared`.
- [x] 2.2 Mover arquivos JS/CSS/HTML conforme mapeamento e ajustar paths/imports.
- [x] 2.3 Atualizar `package.json` (campo `main`, `build.files`) e manter scripts start/start:diag.
- [x] 2.4 Validar `npm run start` e `npm run start:diag` sem regressao.

## 3. Tooling TypeScript
- [x] 3.1 Adicionar dependencias dev: `typescript`, `@types/node` (e outras se necessario).
- [x] 3.2 Criar `config/tsconfig.*` com `allowJs` e configs por processo.
- [x] 3.3 Adicionar `npm run typecheck` (noEmit) separado de `npm run build`.
- [x] 3.4 Criar script para copiar assets estaticos para `dist/renderer`.

## 4. Migracao incremental para TS
- [x] 4.1 Criar tipos compartilhados em `src/shared` (ex.: ChatMessage).
- [x] 4.2 Migrar `chatSource` e/ou preload para TS com risco baixo.
- [x] 4.3 Manter JS restante com `allowJs` e ajustar imports gradualmente.

## 5. Documentacao e contribuicao
- [x] 5.1 Atualizar README e CONFIGURATION com nova estrutura e comandos (dev/build/diag).
- [x] 5.2 Atualizar docs com variaveis suportadas e troubleshooting (ex.: ERR_NAME_NOT_RESOLVED).
- [x] 5.3 Adicionar guia de contribuicao para novas features na arquitetura nova.

## 6. Validacao final
- [x] 6.1 `npm run typecheck` passa.
- [x] 6.2 `npm run build` gera `dist/` esperado.
- [x] 6.3 `TWITCH_CHAT_URL=... DIAGNOSTICS=1 npm run start:diag` mantem comportamento do MVP.
