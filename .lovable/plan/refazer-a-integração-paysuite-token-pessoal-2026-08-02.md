# Refazer a integração PaySuite (token pessoal)

Reconstruir a integração de pagamento seguindo a documentação oficial da PaySuite, sem qualquer suposição de conta empresarial, e pedir o token de API novamente por formulário seguro.

## O que muda

### 1. Novo token de API
Abrir o formulário seguro para você colar o token atual da PaySuite (substitui `PAYSUITE_API_KEY`). Nenhum campo extra de conta/empresa será pedido — só o token.

### 2. Edge function de checkout (reescrita)
`paysuite-create-checkout` refeita de forma enxuta, exatamente como na documentação:
- `POST https://paysuite.tech/api/v1/payments`
- corpo: `amount` (string com 2 casas, MZN), `reference` (≤ 50 caracteres, codificando usuário + plano), `description`, `callback_url`, `return_url`
- sem envio de `method` fixo — o cliente escolhe (M-Pesa, e-Mola, cartão) na página de checkout da PaySuite
- valida o JWT do usuário antes de criar o pagamento
- erros da PaySuite são devolvidos com a mensagem original para aparecerem na tela

### 3. Edge function de webhook (reescrita)
`paysuite-webhook` refeita conforme a documentação:
- lê o corpo bruto e valida `X-Webhook-Signature` (HMAC-SHA256) quando houver segredo configurado
- se não houver assinatura, confirma o pagamento via `GET /api/v1/payments/{id}` com o token, aceitando apenas status `paid`
- em `payment.success`, extrai usuário e plano do `reference` e ativa Premium (`is_premium`, `premium_until` +30 ou +365 dias, `offload_count` zerado)
- `payment.failed` e demais eventos são registrados e ignorados com `200`

### 4. Tela Premium
`src/pages/PremiumPage.tsx` continua chamando `paysuite-create-checkout`, com os preços em MZN (299 MT/mês, 2.990 MT/ano) e mensagens de erro reais vindas da PaySuite.

## Observação importante
Se a PaySuite continuar respondendo `403 — "API access is only available for company accounts."` para o token, isso é uma restrição do lado deles, não do código. A integração ficará pronta e correta; nesse caso o passo seguinte seria trocar o token por um habilitado para API. O código não vai conter nenhuma dependência de conta empresarial.

## Detalhes técnicos
- Arquivos: `supabase/functions/paysuite-create-checkout/index.ts`, `supabase/functions/paysuite-webhook/index.ts`
- `supabase/config.toml` mantém `verify_jwt = false` só para o webhook
- Formato do `reference`: `<uuid sem hífens (32)><M|Y><timestamp base36>`
- Nenhuma mudança de banco de dados é necessária
