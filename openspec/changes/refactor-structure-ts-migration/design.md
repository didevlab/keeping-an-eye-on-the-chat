## Context
O projeto "keeping-an-eye-on-the-chat" esta estavel como MVP em JavaScript. A mudanca proposta reorganiza a estrutura de pastas e inicia uma migracao incremental para TypeScript, preservando o comportamento atual (overlay + hidden window, start:diag, e variaveis de ambiente).

## Goals / Non-Goals
- Goals:
  - Documentar a arquitetura atual antes de qualquer refatoracao.
  - Propor estrutura de pastas com separacao clara (main / renderer / preload / shared / config / scripts / docs).
  - Introduzir TypeScript de forma incremental, com JS + TS coexistindo e build/transpile funcional durante a transicao.
  - Preservar start/start:diag e comportamento do MVP (overlay/hidden, logs de diagnostico).
  - Atualizar documentacao e troubleshooting.
- Non-Goals:
  - Reescrever logica de negocio ou alterar comportamento funcional.
  - Trocar Electron por outra stack ou adicionar bundler pesado.
  - Migrar 100% do codigo para TS em uma unica etapa.

## Current Architecture (Inventory)
### Entry points e modulos principais
- Main process: `src/main.js` (Electron app lifecycle, overlay window, IPC para renderer).
- Hidden chat window + observador: `src/chatSource.js` (TwitchChatSource cria BrowserWindow oculto e injeta MutationObserver).
- Preload: `src/renderer/preload.js` (contextBridge expone `overlayChat.getConfig()` e `overlayChat.onMessage()`).
- Renderer: `src/renderer/index.html` (carrega `displayController.js`, `avatarUI.js`, `avatarAnimator.js`, `avatarUI.css`, e `gsap` via node_modules).
- Renderer logica:
  - `src/renderer/displayController.js` (fila e timing dos bubbles).
  - `src/renderer/avatarUI.js` e `src/renderer/avatarAnimator.js` (UI e animacoes via GSAP).

### Scripts NPM (package.json)
- `check-deps`: valida `node_modules` e `cross-env`.
- `start`: `electron .`
- `start:overlay`: `cross-env OVERLAY_DEBUG=0 DIAGNOSTICS=0 electron .`
- `start:diag`: `cross-env OVERLAY_DEBUG=1 DIAGNOSTICS=1 electron .`
- `build:win`, `build:win:zip`, `build:win:nsis`, `dist`: electron-builder.
- `prestart`, `prestart:overlay`, `prestart:diag`: sempre rodam `check-deps`.

### Variaveis de ambiente usadas
- `TWITCH_CHAT_URL`: URL do chat popout (vazia/invalida desativa chat source).
- `OVERLAY_DEBUG`: habilita debug UI no overlay (1). Em dev, default ativo se nao for 0.
- `DIAGNOSTICS`: habilita logs de diagnostico (1).
- `DEVTOOLS`: abre DevTools no dev (1).
- `DISPLAY_SECONDS`: duracao do bubble (default 5).
- `OVERLAY_ANCHOR`: bottom-left | bottom-right | top-left | top-right.
- `OVERLAY_MARGIN`: margem em px (default 24).
- `BUBBLE_MAX_WIDTH`: largura maxima do bubble (default 420).
- `MAX_MESSAGE_LENGTH`: truncamento de texto (default 140).
- `IGNORE_COMMAND_PREFIX`: prefixo ignorado (default "!").
- `IGNORE_USERS`: lista separada por virgula (case-insensitive).
- `MAX_QUEUE_LENGTH`: limite de fila (default 50).
- `EXIT_ANIMATION_MS`: duracao da animacao de saida (default 400).

### Fluxo de janelas (overlay + hidden)
- Overlay: criado em `createWindow()` com BrowserWindow transparente, always-on-top, sem frame, ignore mouse, e preload em `src/renderer/preload.js`.
- Hidden: `TwitchChatSource.start()` cria BrowserWindow `show: false`, carrega `TWITCH_CHAT_URL` e injeta o observer via `executeJavaScript`.
- IPC: mensagens normalizadas sao enviadas do main para o renderer via `ipcRenderer`/`webContents.send('chat-message')`.

### MutationObserver e seletores criticos (chatSource)
- Container selectors:
  - `[data-test-selector="chat-scrollable-area__message-container"]`
  - `[data-a-target="chat-scrollable-area__message-container"]`
  - `[role="log"]`
  - `.chat-scrollable-area__message-container`
- Message selectors:
  - `[data-a-target="chat-line-message"]`
  - `[data-test-selector="chat-line-message"]`
  - `[data-a-target="chat-message"]`
  - `.chat-line__message`
- Username selectors:
  - `[data-a-target="chat-message-username"]`
  - `[data-test-selector="chat-message-username"]`
  - `.chat-author__display-name`
- Text selectors:
  - `[data-a-target="chat-message-text"]`
  - `[data-test-selector="chat-message-text"]`
  - `.chat-line__message-body`
- Ignore selectors (system notices):
  - `[data-a-target="user-notice-line"]`
  - `[data-a-target="chat-deleted-message"]`
  - `[data-a-target="chat-line-delete-message"]`
  - `.chat-line__status`
- Timestamp selectors: `time`, `[data-a-target="chat-timestamp"]`.

### Dependencias que influenciam build/run
- Runtime: `electron`.
- Build: `electron-builder`.
- Dev/runtime scripts: `cross-env`.
- Renderer animacoes: `gsap` (carregado via `node_modules`).

### Build/packaging atual
- `package.json` define `main: src/main.js` e `build.files` inclui `src/**/*` e `package.json`.
- Output do electron-builder em `dist/`.
- Scripts de execucao: `packaging/windows/*.bat`.

## Target Structure (Proposta)
### Layout proposto
```
.
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   ├── chatSource.ts
│   │   └── windows/
│   │       └── overlayWindow.ts
│   ├── preload/
│   │   └── index.ts
│   ├── renderer/
│   │   ├── index.html
│   │   ├── styles/
│   │   │   └── avatarUI.css
│   │   ├── scripts/
│   │   │   ├── displayController.ts
│   │   │   ├── avatarUI.ts
│   │   │   └── avatarAnimator.ts
│   │   └── assets/
│   └── shared/
│       └── types/
├── config/
│   ├── tsconfig.base.json
│   ├── tsconfig.main.json
│   ├── tsconfig.renderer.json
│   ├── tsconfig.preload.json
│   ├── eslint.config.js (opcional)
│   └── prettier.config.cjs (opcional)
├── scripts/
│   └── check-deps.js
├── docs/
├── packaging/
└── dist/
```

### Mapeamento antes -> depois (exemplos principais)
- `src/main.js` -> `src/main/index.ts` (inicialmente `.js` ate migrar).
- `src/chatSource.js` -> `src/main/chatSource.ts`.
- `src/renderer/preload.js` -> `src/preload/index.ts`.
- `src/renderer/index.html` -> `src/renderer/index.html` (permanece, ajusta paths de scripts).
- `src/renderer/displayController.js` -> `src/renderer/scripts/displayController.ts`.
- `src/renderer/avatarUI.js` -> `src/renderer/scripts/avatarUI.ts`.
- `src/renderer/avatarAnimator.js` -> `src/renderer/scripts/avatarAnimator.ts`.
- `src/renderer/avatarUI.css` -> `src/renderer/styles/avatarUI.css`.
- `src/renderer/assets/*` -> `src/renderer/assets/*` (permanece).
- `scripts/check-deps.js` -> `scripts/check-deps.js` (permanece).
- `packaging/windows/*.bat` -> `packaging/windows/*.bat` (permanece).
- Novo: `src/shared/types/chatMessage.ts` (tipos compartilhados).
- Novo: `config/tsconfig.*` para TS/Electron.

## Technical Decisions
### Module system (CJS vs ESM)
- Decisao: manter CommonJS no curto prazo.
- Justificativa: evitar quebra de compatibilidade no Electron atual e reduzir risco durante a migracao incremental.
- Implementacao prevista: `module: "CommonJS"` no TS, sem `"type": "module"` no package.json.

### TypeScript config minima e segura
- `allowJs: true` para coexistencia JS + TS.
- `noEmit` no typecheck e `outDir: dist/` no build.
- Configs separadas por processo (main/preload/renderer) para ajustar `lib` e `types`.
- Dependencias previstas: `typescript` e `@types/node`.

### Build output e assets
- Saida padrao: `dist/`.
- `tsc` copia JS para `dist/` quando `allowJs` e `outDir` estao ativos.
- Assets estaticos (HTML/CSS) precisam de script de copia para `dist/renderer`.
- `electron-builder` deve apontar para `dist/**/*` quando o entrypoint migrar.

### Path aliases/imports
- Decisao: nao introduzir alias no primeiro passo.
- Motivo: sem bundler, aliases exigem runtime resolution extra.
- Plano: usar imports relativos; revisar aliases apenas quando houver pipeline de build apropriado.

### Qualidade sem bloquear fluxo
- Adicionar `npm run typecheck` separado do build.
- Lint/format ficam opcionais na primeira etapa, mas documentados como proxima fase.

## Migration Plan (Incremental)
### Etapa 0 - Baseline
- Registrar o estado atual (logs e comportamento) com `npm run start:diag` e variaveis exigidas.
- Consolidar inventario de entrypoints, scripts, variaveis e seletores.

### Etapa 1 - Reorganizacao de pastas (JS puro)
- Mover arquivos para a nova estrutura mantendo extensoes `.js`.
- Atualizar `main` do package.json e paths de preload/renderer.
- Ajustar paths em `index.html` para novos subfolders.
- Validar start/start:diag com comportamento identico.

### Etapa 2 - Introducao de TypeScript (tooling)
- Adicionar configs TS em `config/`.
- `allowJs: true` + `typecheck` separado.
- Script para copiar assets estaticos para `dist/`.
- Documentar comandos novos (typecheck/build).

### Etapa 3 - Primeiras migracoes TS
- Migrar modulos de menor risco (ex.: tipos compartilhados e `chatSource`).
- Manter JS restante com `allowJs`.
- Atualizar entrypoint para usar `dist/` quando necessario.

### Etapa 4 - Expansao e endurecimento
- Migrar renderer/preload gradualmente.
- Opcional: adicionar ESLint/Prettier e ajustar regras.
- Revisar `checkJs` e remover JS legado quando aplicavel.

## Risks / Trade-offs
- Quebra de paths de preload/renderer: mitigar com revisao de import paths e teste de start:diag.
- Assets nao copiados para `dist/`: mitigar com script de copia e validacao de UI.
- Divergencias CJS/ESM: mitigar mantendo CommonJS no curto prazo.
- Regressao de logs/diagnosticos: mitigar com comparacao direta dos logs baseline.
- Electron builder incluir arquivos errados: mitigar ajustando `build.files` e validando `dist/`.

## Validation Checklist by Stage
- Etapa 0:
  - `npm ci`
  - `TWITCH_CHAT_URL=... DIAGNOSTICS=1 npm run start:diag`
  - Registrar logs e comportamento do overlay/hidden window.
- Etapa 1:
  - `npm run start` e `npm run start:diag` iniciam sem erro.
  - Overlay permanece transparente e always-on-top; hidden window carrega chat.
- Etapa 2:
  - `npm run typecheck` passa.
  - `npm run build` gera `dist/` com JS + assets.
- Etapa 3:
  - `npm run start:diag` continua funcional usando `dist/`.
  - Comparar logs com baseline.
- Etapa 4:
  - `npm run start:diag` e `npm run start` continuam OK.
  - Documentacao revisada e completa.

## Open Questions
- O projeto deseja adicionar bundler (ex.: Vite/webpack) em fases futuras, ou manter build leve com `tsc` + copia de assets?
