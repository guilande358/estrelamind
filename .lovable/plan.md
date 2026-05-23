## Objetivo

Transformar o "Offload" de uma aba comum num **botão de ação principal (FAB)** centralizado na barra inferior, com fluxo de gravação por voz global, comando "terminado" para parar, e uma nova tela tipo **chat de voz** com relatórios, notificações e criação automática por voz.

## 1. Nova barra inferior com FAB central

Reformular `BottomNavigation.tsx`:

```text
[ Home ]  [ Agenda ]  ( 🎙 FAB )  [ Finanças ]  [ Perfil ]
```

- 4 abas normais (Home, Agenda, Finanças, Perfil) divididas 2+2.
- Botão central grande, circular, elevado (~64px), com gradiente (`gradient-calm`), sombra e leve `scale-on-tap`.
- O FAB **não navega** diretamente — ele aciona o modo de escuta global.
- Remover "Offload" da lista de abas normais.

## 2. Modo de escuta global (overlay)

Criar `src/components/offload/VoiceCaptureOverlay.tsx` + hook `src/hooks/useVoiceCapture.ts`:

- Ao tocar o FAB em qualquer rota, abre overlay full-screen com:
  - Anel animado de microfone com **gradiente azul→verde→violeta** pulsando conforme volume (usar `AnalyserNode` do `MediaStream` para amplitude → escala/cor).
  - Texto "Ouvindo…" no idioma atual (i18n).
  - Transcrição parcial ao vivo.
  - Botão "Cancelar".
- Usa `useSpeechRecognition` já existente (idioma vem de `i18n.language`).
- **Detecção de palavra de parada multi-idioma**: ao detectar no transcript final/parcial qualquer um de
`terminado | terminei | pronto | finalizar | done | finished | stop | terminé | fini | terminado | listo | acabado`
→ para a gravação e dispara processamento.
- O texto enviado é limpo da palavra-gatilho final.

## 3. Roteamento após captura

- Ao terminar (por "terminado" ou botão), navegar para `/offload` passando o texto capturado em `location.state` (ou store leve em Context).
- Se o usuário já estiver em `/offload`, apenas injetar no chat sem navegar.

## 4. Nova `/offload` como Chat de Voz

Refatorar `OffloadPage.tsx` para layout de **chat conversacional**:

- Lista de mensagens (usuário ↔ MindFlow AI), com bolhas estilo iMessage.
- Mensagem do usuário = transcrição capturada; mensagem da IA = `response` + cards de itens detectados (`ConfirmationCard`).
- Header com badges de **notificações não lidas** (mensagens da IA ainda não "ouvidas"/abertas) e botão "Ler em voz alta" (TTS / ElevenLabs se premium).
- FAB também disponível na própria página para continuar gravando.
- Persistir histórico em `localStorage` (chave por `user.id`) — sem nova tabela neste plano.

## 5. Comandos de voz dentro do chat

Estender o edge function `offload-process` para classificar a intenção do texto:

- `create` — criar itens (já existe). Gatilhos de criação automática: detectar no texto qualquer de
`"pode criar" | "cria isso" | "cria pra mim" | "crie" | "create it" | "go ahead" | "please create" | "créalo" | "crée-le"`
→ no front, ao receber a resposta da IA, **pular o passo de confirmação** e chamar `handleConfirm` automaticamente.
- `report` — perguntas como "quantas tarefas pendentes?", "quanto gastei esse mês?", "o que tenho amanhã?". O edge function recebe também um resumo agregado das tabelas (tasks/events/expenses do usuário do mês corrente) e responde em linguagem natural.
- `notifications` — "tenho mensagens novas?" / "leia as não lidas" → cliente responde lendo as mensagens marcadas não-lidas via TTS.

Mudanças no edge function:

- Adicionar tool `answer_report` com parâmetros `{ kind: 'tasks'|'events'|'expenses'|'mixed', response: string }`.
- Receber payload `{ text, language, context: { pendingTasks, todayEvents, monthExpensesTotal, ... } }`.
- Cliente busca esses agregados antes de invocar (queries simples já com hooks existentes).
- `tool_choice` passa de forçado para `auto` (deixar o modelo escolher entre `create_items` e `answer_report`).

## 6. Resposta falada

- Toda resposta da IA é falada automaticamente (ElevenLabs se premium, Web Speech caso contrário) e marcada como "lida" só após reprodução / abertura.
- Toggle "silenciar respostas" no header do chat (persistido em localStorage).

## 7. i18n

Adicionar chaves em `pt-BR / en-US / fr-FR / es-ES`:

- `offload.listening`, `offload.sayDone`, `offload.stopWords` (lista), `offload.autoCreated`, `offload.unread`, `offload.muteVoice`, `offload.report.*`.

## 8. Arquivos afetados

- `src/components/layout/BottomNavigation.tsx` — novo layout com FAB.
- `src/components/layout/AppLayout.tsx` — renderizar `<VoiceCaptureOverlay />` global.
- `src/components/offload/VoiceCaptureOverlay.tsx` — **novo**.
- `src/hooks/useVoiceCapture.ts` — **novo** (estado global via Context ou Zustand-lite com `useSyncExternalStore`).
- `src/contexts/VoiceCaptureContext.tsx` — **novo**.
- `src/pages/OffloadPage.tsx` — reescrito como chat.
- `src/components/offload/ChatMessage.tsx` — **novo**.
- `supabase/functions/offload-process/index.ts` — adicionar tool `answer_report` + contexto agregado.
- `src/i18n/locales/*.json` — novas chaves.
- `src/App.tsx` — envolver com `VoiceCaptureProvider`.

## Fora de escopo (manter como está)

- Paddle / Premium / Perfil.
- Schema do banco (sem novas tabelas; histórico do chat fica em localStorage por enquanto — posso migrar para Supabase num passo futuro se quiser persistência cross-device).
- Login social / autenticação.

## Confirmações que preciso de você

1. **Histórico do chat**: ok manter em `localStorage` por agora, ou já criar tabela `offload_messages` no Supabase? cria no supabase
2. **FAB**: prefere ícone de microfone ✅ ou estilo "onda sonora" animada? aplique as duas mais o mais simplis para o plano free
3. **Auto-criar sem confirmar** quando o usuário diz "pode criar" — confirma que NÃO quer mostrar o card de confirmação nesse caso? sim