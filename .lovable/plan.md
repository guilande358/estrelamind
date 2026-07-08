## Objetivo

1. Substituir a integração Paddle pela **Paysuite** (pagamentos + ativação de `is_premium`).
2. Aplicar paywall real no **Offload**: usuários gratuitos têm **5 descarregamentos por ciclo de 5 logins** (contador reseta a cada 5 logins). Premium = ilimitado.

Restante do app continua livre (Agenda, Finanças, Tarefas, Relatórios) — só o Offload é limitado, que é o diferencial de IA que justifica upgrade.

## Parte 1 — Trocar Paddle por Paysuite

### Remoções

- Desinstalar `@paddle/paddle-js` do `package.json`.
- Apagar `src/hooks/usePaddle.ts`.
- Apagar edge function `supabase/functions/paddle-webhook/index.ts`.
- Remover secret `PADDLE_API_KEY` (fica órfão, sem uso).

### Credenciais Paysuite

Antes de codar, preciso pedir ao usuário via `add_secret`:

- `PAYSUITE_API_KEY` — chave privada da API Paysuite (obtida em [https://paysuite.tech](https://paysuite.tech) no painel do merchant).
- `PAYSUITE_WEBHOOK_SECRET` — segredo compartilhado que o usuário cadastra no painel Paysuite para assinar webhooks.

### Novas edge functions

`**supabase/functions/paysuite-create-checkout/index.ts**` (verify_jwt em código)

- Recebe `{ plan: "monthly" | "yearly" }`.
- Valida JWT, pega `user_id` e `email`.
- Chama `POST https://paysuite.tech/api/v1/payments` com:
  - `amount` (299 MZN mensal / 2990 MZN anual — valores a confirmar com o usuário)
  - `reference` = `user_id`
  - `return_url` = `${origin}/perfil?upgraded=true`
  - `callback_url` = URL pública da função `paysuite-webhook`
- Retorna `checkout_url` para o frontend redirecionar.

`**supabase/functions/paysuite-webhook/index.ts**` (público, sem JWT)

- Valida assinatura HMAC com `PAYSUITE_WEBHOOK_SECRET`.
- Em evento `payment.success`: `UPDATE profiles SET is_premium = true, premium_until = now() + interval '30 days' (ou 1 ano)` para o `user_id` da `reference`.
- Em `payment.failed` / `refund`: loga, mantém `is_premium` como está (não desativa em falha isolada).
- Usa `service_role` para escrever em `profiles`.

### Frontend

- `PremiumPage.tsx`: remover checkout Paddle. Botões chamam `supabase.functions.invoke("paysuite-create-checkout", { body: { plan } })` e fazem `window.location.href = data.checkout_url`.
- Atualizar preços exibidos para MZN (Paysuite é MZ-nativo). Manter tradução i18n.

## Parte 2 — Paywall de Offload (5 por ciclo de 5 logins)

### Schema (migration)

Adicionar em `profiles`:

- `offload_count integer default 0` — descarregamentos usados no ciclo atual.
- `login_count integer default 0` — logins acumulados no ciclo atual.
- `premium_until timestamptz` — data-limite do Premium ativo (para expiração automática).

### Lógica de ciclo

- No login (em `AuthContext` após sessão estabelecida): incrementar `login_count`. Se atingir 5 → resetar `offload_count = 0` e `login_count = 0`.
- Antes de cada envio no `OffloadPage.handleSend`:
  - Se `is_premium` (e `premium_until > now()`) → sem limite.
  - Senão: ler `offload_count`. Se `>= 5` → bloquear com toast + CTA "Torne-se Premium" e navegar para `/premium`. Se `< 5` → incrementar e prosseguir.
- Toda a contagem/reset é feita em uma RPC `consume_offload_quota()` (SECURITY DEFINER, search_path=public) que retorna `{ allowed: boolean, remaining: number }` — evita corrida cliente-side.

### UI

- Indicador discreto no topo do OffloadPage: "3 de 5 descarregamentos restantes" (só para não-Premium).
- Ao atingir o limite: modal/toast com botão "Desbloquear ilimitado" → `/premium`.

## Parte 3 — Expiração automática de Premium

- No `useProfile`, considerar `is_premium && premium_until > now()` como Premium real. Se `premium_until` passou, tratar como não-premium (mesmo com flag true) para forçar renovação.

## Fora de escopo

- Não mexer em Offload IA (edge function `offload-process` fica como está).
- Não mexer em Agenda, Finanças, Tarefas, Relatórios, Multi-moeda.
- Não mexer em auth Google.
- Não criar tabelas novas — só colunas em `profiles`.

## Perguntas antes de começar

1. **Preços em MZN**: qual o valor mensal e anual que devo usar no checkout Paysuite? (sugestão: 299 MZN/mês, 2.990 MZN/ano). use a sugestao dos precos.
2. **Trial**: manter oferta de 7/14 dias grátis? Paysuite não suporta trial nativo — implementaríamos setando `premium_until = now() + 7d` sem cobrança no primeiro checkout. Ou removemos o trial? mantenha o trial
3. **Credenciais Paysuite prontas?** Você já tem conta merchant e API key, ou precisa criar primeiro em [https://paysuite.tech](https://paysuite.tech)? ja tenho, pode gerar o formulario para colar as credinciais.

## Verificação após implementar

1. Fazer 5 offloads como usuário grátis → 6º deve ser bloqueado com CTA.
2. Fazer 5 logins → contador reseta, volta a permitir 5 offloads.
3. Simular webhook Paysuite `payment.success` → `is_premium=true`, offloads voltam a ser ilimitados.
4. `premium_until` no passado → volta a aplicar limite.