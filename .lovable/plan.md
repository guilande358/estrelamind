## Objetivo

O chat do Offload conversa, mas hoje **não persiste** os itens de forma confiável nas tabelas `tasks`, `events` e `expenses` — ou cria sem confirmação e sem refletir nas telas Home/Agenda/Finanças. Vou consertar essa ponte mantendo o schema atual. A moeda não pode ser só brasileira coloque o sistema de todas as  moeda com um sistema de cambio inteligente, e colocada a preferencia do usuário, cria também gráficos, relatórios este quando o usuário pedir, e ser possível exportar em formato de arquivos.

## Diagnóstico

1. `OffloadPage.handleSend` só persiste se houver palavra-gatilho **OU** `kind === "create"`. Como a edge sempre devolve `kind: "create"` quando chama `create_items`, hoje cria **sempre, sem confirmação** — contraditório com o cartão de confirmação que deveria existir.
2. O componente `ConfirmationCard` está importado mas **nunca é renderizado** no chat.
3. Erros das mutations (`createTask/createEvent/createExpense`) são engolidos com `console.error` — usuário não vê falha.
4. `consumePendingText` roda só no **mount**: se o usuário já está em `/offload` e abre o overlay de voz pelo FAB, o texto novo não é processado.
5. Após criar, as queries de outras páginas (`["tasks"]`, `["events"]`, `["expenses"]`) são invalidadas pelos hooks, então **Home, Agenda e Finanças atualizam sozinhas** — isso já funciona, só precisa que a inserção aconteça.
6. Prompt da edge pode emitir `date` solto ("sexta-feira") — vou reforçar formato `YYYY-MM-DD` e `HH:MM`.

## O que vou mudar

### `src/pages/OffloadPage.tsx`

- Renderizar `**ConfirmationCard**` dentro da bolha do assistente sempre que `items.length > 0` **e** o usuário **não** disser palavra-gatilho.
- Botão **Confirmar** chama `persistItems` e marca a mensagem como confirmada (campo `items_created: true` em memória + update no Supabase).
- Botão **Descartar** apenas oculta o cartão.
- Auto-criar **só** quando `containsAny(text, AUTO_CREATE_WORDS)` for verdadeiro (resposta do usuário à pergunta).
- `persistItems`: aguardar com `Promise.allSettled`, contar sucessos/falhas e mostrar **toast** com resultado real (ex.: "2 de 3 itens criados, 1 falhou").
- Invalidar explicitamente `["tasks"]`, `["events"]`, `["expenses"]` no `queryClient` para garantir atualização imediata em Home/Agenda/Finanças.
- Trocar `useEffect([])` por `useEffect([pendingText])` para processar texto vindo do overlay sempre que ele chegar.

### `supabase/functions/offload-process/index.ts`

- Reforçar no prompt: `date` **obrigatoriamente** `YYYY-MM-DD`, `time` `HH:MM` 24h; se ambíguo, deixar `null` em vez de inventar.
- Aceitar tipo `income` mapeado como expense negativa (ou tarefa "receita") — manter só os 4 tipos atuais; income vira `expense` com `amount` negativo.
- Garantir que `tool_choice` permaneça `auto` para o modo report continuar funcionando.

### `src/components/offload/ConfirmationCard.tsx`

- Compactar a versão usada em mensagens (sem o card de resposta duplicado, só itens + botões Confirmar/Descartar inline), via prop `compact`.

## Fora de escopo

- Não mexer no schema (tabelas seguem como estão).
- Não mexer em Premium/Paddle/ElevenLabs/auth.
- Não criar tabelas novas.

## Arquivos editados

- `src/pages/OffloadPage.tsx`
- `src/components/offload/ConfirmationCard.tsx`
- `supabase/functions/offload-process/index.ts`

## Verificação após implementar

1. Falar "marca consulta médica amanhã às 10h" → ver cartão de confirmação → tocar Confirmar → checar `tasks` no banco e ver aparecer em Home/Agenda.
2. Falar "gastei 50 reais no mercado hoje, pode criar" → criação automática + aparece em Finanças.
3. Perguntar "quantas tarefas tenho pendentes?" → resposta de relatório, sem criar nada.