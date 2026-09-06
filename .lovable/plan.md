# Corrigir login Google, microfone e assistente Alice

## 1. Login com Google
O botão Google já existe no ecrã de entrada e no de registo, mas o provedor Google não está ativo neste novo espaço de trabalho — por isso qualquer tentativa dá erro de autenticação.

- Ativar o Google como método de entrada gerido (sem precisar de credenciais próprias).
- Manter apenas Google e email, conforme a regra do projeto (sem Apple).
- Mostrar uma mensagem clara se o utilizador fechar a janela do Google a meio.

## 2. Microfone real
- Pedir a permissão do microfone assim que o utilizador toca no botão de falar, com aviso simples se for recusada e instrução de como reativar.
- Verificar se existe microfone disponível antes de tentar ligar, evitando ficar "a ligar" para sempre.
- Libertar o microfone ao fechar a folha de conversa (parar ditado, leitura em voz e o fluxo de áudio).
- Manter o botão de microfone do chat a usar o mesmo pedido de permissão.

## 3. Assistente passa a chamar-se Alice
- A assistente gratuita (voz do telemóvel + inteligência do MindFlow) passa a chamar-se **Alice** em todos os textos e nos quatro idiomas.
- Fica uma só entrada de voz no Offload, para não haver duas "Alice": a assistente gratuita torna-se a principal e a chamada por ElevenLabs fica escondida enquanto o plano gratuito dessa conta não for suficiente (o código fica no projeto, pronto a reativar).

## 4. Como testar o Offload de ponta a ponta
Um pequeno guia dentro da app (texto de ajuda na folha da Alice) e os passos para si:

1. Entrar na app pelo telemóvel (Google ou email).
2. Abrir o Offload no botão central.
3. Escrever "pode criar uma tarefa: comprar pão amanhã às 9h" e confirmar o cartão que aparece; verificar a tarefa na Agenda.
4. Repetir por voz: tocar na Alice, autorizar o microfone, dizer a mesma frase e confirmar.
5. Pedir "pode criar uma despesa de 500 MT em transporte hoje" e conferir em Finanças.
6. Pedir um relatório: "quanto gastei este mês?" e confirmar que responde com os seus dados.
7. Fechar e reabrir o Offload para confirmar que a conversa ficou guardada.

## Notas técnicas
- `supabase--configure_social_auth` com `providers: ["google"]` no mesmo turno da alteração de código.
- `VoiceAssistantSheet.tsx`: renomear textos para Alice, adicionar `enumerateDevices`/tratamento de `NotFoundError` e `NotAllowedError`, e garantir `stop()` + `tts.stop()` no fecho.
- `OffloadPage.tsx`: manter um único botão de voz (`sparkles`) e remover o botão de chamada ElevenLabs da barra de topo.
- Chaves de tradução `offload.assistant*` atualizadas em pt-BR, en-US, fr-FR, es-ES.
