# Keeping an Eye on the Chat

Overlay desktop para exibir mensagens de chat do Twitch com avatar animado.

## Visão Geral

Aplicação Electron que observa o chat popout do Twitch via DOM, normaliza mensagens e exibe uma por vez com avatar animado e balão de fala. O avatar usa GSAP para animações de fala, piscar e expressões.

## Arquitetura

```
src/                    # Código fonte TypeScript
├── main/               # Processo principal Electron
│   ├── index.ts        # Entry point, cria janela overlay
│   └── chatSource.ts   # Observador DOM do chat Twitch
├── preload/            # Script de preload
│   └── index.ts        # contextBridge para IPC
├── renderer/           # Processo de renderização
│   ├── index.html      # HTML do overlay
│   ├── scripts/        # Lógica de UI e animação
│   │   ├── displayController.ts  # Fila de mensagens
│   │   ├── avatarUI.ts           # Componente do avatar
│   │   └── avatarAnimator.ts     # Animações GSAP
│   └── styles/         # CSS
└── shared/             # Tipos compartilhados
    └── types/          # ChatMessage, OverlayConfig

dist/                   # JavaScript compilado (gerado)
```

## Comandos

```bash
npm run typecheck       # Verificar tipos sem compilar
npm run build:ts        # Compilar TypeScript para dist/
npm start               # Executar (compila automaticamente)
npm run start:diag      # Executar com diagnósticos
```

## Fluxo de Dados

1. `chatSource.ts` observa DOM do chat Twitch via BrowserView
2. Mensagens são enviadas via IPC para o renderer
3. `displayController.ts` gerencia fila e timing
4. `avatarUI.ts` renderiza avatar + balão
5. `avatarAnimator.ts` anima boca/olhos com GSAP

## Variáveis de Ambiente

| Variável | Default | Descrição |
|----------|---------|-----------|
| TWITCH_CHAT_URL | - | URL do chat popout (obrigatório) |
| DISPLAY_SECONDS | 5 | Tempo de exibição por mensagem |
| OVERLAY_ANCHOR | bottom-left | Posição: bottom-left/right, top-left/right |
| OVERLAY_MARGIN | 24 | Margem em pixels |
| MAX_MESSAGE_LENGTH | 140 | Trunca mensagens longas |
| IGNORE_COMMAND_PREFIX | ! | Ignora comandos começando com |
| IGNORE_USERS | - | Usuários ignorados (separados por vírgula) |
| DIAGNOSTICS | 0 | Habilita logs de diagnóstico |

## Convenções de Código

- TypeScript estrito (`strict: true`)
- CommonJS para compatibilidade com Electron
- Tipos compartilhados em `src/shared/types/`
- Renderer scripts são carregados via `<script>` tags
- GSAP é copiado para `dist/renderer/vendor/`

## Pontos de Atenção

- A janela overlay é transparente e ignora mouse events
- O chat source usa MutationObserver no DOM do Twitch
- Mensagens duplicadas são filtradas por ID
- A fila tem limite máximo (descarta antigas quando cheia)

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->