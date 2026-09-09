# Entrada com Google, modo visitante, limite grátis e horas certas

## 1. Entrar com Google em todo o lado

- Botão "Continuar com Google" no ecrã de entrada, no de registo, no ecrã inicial (onboarding) e no Perfil (para quem está como visitante criar conta num toque).
- Depois de entrar, a pessoa vai direta para o Início; se tiver vindo de outra página, volta a essa página.
- Mensagens claras quando a janela do Google é fechada a meio ou o acesso é recusado.
- O painel de pagamentos passa a ficar visível no Perfil apenas para a sua conta de administrador, seja ela aberta por Google ou por email.

## 2. Modo visitante (sem conta)

- Botão "Entrar como visitante" no ecrã inicial e no de entrada.
- O visitante pode ver e criar tarefas, eventos e despesas, mas tudo fica só no aparelho e desaparece quando fecha a sessão.
- Aviso fixo no topo: "Está em modo visitante — os seus dados não serão guardados depois desta sessão."
- O Offload (chat e Alice) fica bloqueado: ao tocar, aparece um cartão a convidar a criar conta com Google.
- No Perfil, o visitante vê "Criar conta para guardar os seus dados" em vez das definições de conta.

## 3. Limite grátis de 5 mensagens no Offload

- Quem cria conta tem 5 mensagens de Offload no total (uma só vez, sem renovação).
- Contador visível na folha do Offload: "Restam X de 5 mensagens grátis".
- À 5.ª mensagem usada aparece um banner flutuante sobre o chat com o valor dos planos (299 MT/mês, 2.990 MT/ano) e o botão "Tornar-me Premium".
- Premium activo = uso ilimitado, sem banner.

## 4. Painel de pagamentos: nome, email e referências seguras

- Cada pedido no painel passa a mostrar o **nome** e o **email** de quem pagou, além do plano, valor, método, telefone, ID da transacção, referência e comprovativo.
- A referência deixa de ser criada no telemóvel: passa a ser gerada no servidor, aleatória e única, para ninguém poder inventar ou repetir uma referência.
- A referência mostrada ao utilizador só aparece depois de o servidor a criar, para o que ele escreve na transferência coincidir sempre com o que você vê.
- Depois de eu preparar isto, submete um comprovativo verdadeiro pelo telemóvel e eu confirmo consigo que o Premium activa e que o seu nome e email aparecem no painel.

## 5. Data e hora reais no Offload

- O Offload passa a usar a data, a hora e o fuso horário do aparelho (Maputo, UTC+2) em vez do horário universal — hoje "amanhã às 9h" pode cair no dia errado.
- Tarefas e eventos criados por voz ou por texto ficam com a hora exacta e aparecem nos Relatórios no dia certo.
- Datas relativas ("hoje", "amanhã", "sexta", "daqui a duas horas") calculadas sobre a hora local.

## Notas técnicas

- `guest` em contexto próprio (`GuestContext`) com armazenamento em `sessionStorage`; `ProtectedRoute` aceita sessão real ou visitante, e o Offload exige sessão real.
- Botão Google reutilizado num componente `GoogleSignInButton` com `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- Migração: coluna `offload_used_total` em `profiles` (protegida pelo trigger existente); `consume_offload_quota()` passa a limite vitalício de 5 e deixa de ser reposta pelo `tick_login()`.
- Migração: `reference` com `DEFAULT` gerado por função `SECURITY DEFINER` + `UNIQUE`; cliente deixa de enviar `reference`.
- Nova edge function `admin-list-payments` (Service Role + verificação `private.has_role`) devolve pedidos com `display_name` e email de `auth.users`; `useAdminPayments` passa a chamá-la.
- `OffloadPage.tsx`/`offload-process`: enviar `localDate`, `localTime` e `timeZone` do cliente no corpo do pedido e usá-los no prompt em vez de `new Date().toISOString()`.
- Traduções novas em pt-BR, en-US, fr-FR e es-ES.
