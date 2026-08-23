# Pagamento manual M-Pesa / e-Mola com comprovativo

Substituir o checkout automático por um fluxo manual: o utilizador transfere para o seu número, submete o comprovativo na app, e você aprova no painel de administração para libertar o Premium.

## Fluxo do utilizador

1. Em **Perfil → Premium**, escolhe o plano (299 MT/mês ou 2.990 MT/ano).
2. Vê um ecrã com as instruções de pagamento: número M-Pesa e número e-Mola, valor exacto e um **código de referência único** gerado pela app (ex.: `MF-7K3QX2`) que deve escrever na mensagem/descrição da transferência.
3. Preenche: método usado (M-Pesa / e-Mola), número de telefone de origem, ID da transacção do SMS de confirmação, e anexa a foto/print do comprovativo.
4. Submete. O pedido fica com estado **pendente** e o ecrã Premium passa a mostrar "Aguardando confirmação" com o código de referência.
5. Quando aprovado, o Premium activa automaticamente e o utilizador recebe uma notificação na app.

## Painel de administração (só para si)

Nova rota `/admin/pagamentos`, visível apenas para contas com papel de administrador:

- Lista de pedidos pendentes com nome, email, plano, valor, método, telefone, ID da transacção, referência e imagem do comprovativo (clicável para ampliar).
- Botão **Aprovar** → activa `is_premium`, define `premium_until` (+30 ou +365 dias), zera `offload_count`.
- Botão **Rejeitar** com motivo → o utilizador vê o motivo no ecrã Premium e pode submeter de novo.
- Separadores para ver aprovados/rejeitados e histórico.

## Detalhes técnicos

### Base de dados

- Tabela `payment_requests`: `id`, `user_id`, `plan` (monthly/yearly), `amount`, `currency` (MZN), `method` (mpesa/emola), `payer_phone`, `transaction_id`, `reference` (único), `proof_url`, `status` (pending/approved/rejected), `reject_reason`, `reviewed_by`, `reviewed_at`, `created_at`.
  - RLS: utilizador vê/cria só os seus; admins vêem e actualizam todos. GRANTs para `authenticated` e `service_role`.
- Tabela `user_roles` + enum `app_role` (`admin`, `user`) + função `has_role()` com `SECURITY DEFINER` e `SET search_path = public` — papéis nunca ficam em `profiles`.
- Migração inicial que atribui `admin` à sua conta.
- Bucket de storage privado `payment-proofs`: utilizador só escreve/lê na sua própria pasta (`<user_id>/...`); admins lêem tudo.
- Função `approve_payment_request(request_id)` (`SECURITY DEFINER`) que valida que o chamador é admin, marca o pedido como aprovado e actualiza `profiles` numa só transacção — evita que o cliente escreva directamente em `is_premium`.

### Frontend

- `src/pages/PremiumPage.tsx`: remove a chamada à PaySuite; passa a mostrar instruções + bottom-sheet de submissão de comprovativo (padrão de bottom-sheet do projecto), e o estado do pedido pendente/rejeitado.
- Novo `src/components/premium/PaymentProofSheet.tsx`: formulário com método, telefone, ID da transacção e upload de imagem.
- Novo `src/pages/AdminPaymentsPage.tsx` + guarda de rota por papel `admin`.
- Novo `src/hooks/usePaymentRequests.ts` (submeter, listar próprios) e `src/hooks/useAdminPayments.ts` (listar todos, aprovar, rejeitar).
- Traduções PT/EN/FR/ES para todos os textos novos.

### Limpeza

- As edge functions `paysuite-create-checkout` e `paysuite-webhook` deixam de ser usadas e são removidas, junto com a entrada correspondente em `supabase/config.toml`.

## O que preciso de si antes de construir

- O número M-Pesa e o número e-Mola que recebem os pagamentos (e o nome que aparece na conta).
- O email da conta que deve ficar como administrador.