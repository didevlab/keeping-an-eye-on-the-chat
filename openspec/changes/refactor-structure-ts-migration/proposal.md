# Change: Refatoracao incremental (estrutura de pastas + migracao JS->TS)

## Why
O MVP esta estavel em JavaScript, mas precisa evoluir para uma estrutura de pastas mais clara e iniciar uma migracao incremental para TypeScript sem regressao de comportamento (incluindo start:diag e o fluxo overlay/hidden window).

## What Changes
- Inventariar e documentar a arquitetura atual, incluindo entrypoints, scripts npm, variaveis de ambiente, fluxo de janelas e seletores criticos.
- Propor nova estrutura de pastas (main / renderer / preload / shared / config / scripts / docs) e mapear cada arquivo atual para seu novo destino.
- Introduzir TypeScript de forma incremental (JS + TS coexistindo), com typecheck separado do build e estrategia de saida para dist/.
- Documentar decisoes de modulo (CJS vs ESM), imports e aliases (se aplicavel), e garantir consistencia no Electron.
- Atualizar documentacao e troubleshooting para refletir nova estrutura, comandos e requisitos.

## Impact
- Affected specs: organize-codebase (nova capacidade para organizacao do repositorio e migracao incremental).
- Affected code: src/, scripts/, docs/, package.json, packaging/, configs TS/ESLint/Prettier.
- Risco principal: regressao nos comandos start/start:diag e fluxo de janelas; mitigado por validacao por etapa.
