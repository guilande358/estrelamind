

## Analise Completa e Plano para Finalizar o MindFlow

### Diagnostico: O que esta pronto vs O que falta

**Pronto (30% do app):**
- Design system e UI de todas as telas (Onboarding, Login, Register, Home, Agenda, Financas, Offload, Perfil)
- i18next com 4 idiomas (pt-BR, en-US, fr-FR, es-ES)
- Seletor de idioma no Perfil com persistencia no banco
- Hooks de Web Speech API (STT e TTS)
- Edge functions criadas: elevenlabs-tts, elevenlabs-stt, offload-process
- Banco de dados: tabelas profiles, tasks, events, expenses com RLS
- ElevenLabs conectado via connector

**Faltando (70% do app) -- Tudo que e necessario para funcionar de verdade:**

---

### Bloco 1: Autenticacao Real (Critico)

Login e Register sao falsos -- usam `setTimeout` simulando sucesso. Nenhuma chamada ao sistema de autenticacao.

**O que fazer:**
- Integrar `supabase.auth.signUp()` no RegisterPage
- Integrar `supabase.auth.signInWithPassword()` no LoginPage
- Criar contexto de autenticacao (`AuthContext`) com estado do usuario
- Proteger rotas (`/home`, `/agenda`, etc.) com redirect para `/login` se nao autenticado
- Adicionar logout funcional no PerfilPage
- Criar perfil automaticamente no registro (trigger `handle_new_user` ja existe)
- Implementar "Esqueci minha senha" com `supabase.auth.resetPasswordForEmail()`

---

### Bloco 2: Dados Reais no Dashboard (Home)

HomePage mostra dados hardcoded: "5 tarefas, 2 contas, 3 eventos" e lista fixa.

**O que fazer:**
- Buscar tarefas do dia do banco (`tasks` onde `due_date = today`)
- Buscar eventos do dia (`events` onde `start_date = today`)
- Buscar despesas pendentes (`expenses` onde `paid = false`)
- Mostrar contadores reais nos cards de stats
- Lista de tarefas interativa: marcar como concluida via `UPDATE tasks SET completed = true`
- Sugestao da IA: usar dados reais para gerar insight (ex: "Voce tem 3 contas vencendo esta semana")

---

### Bloco 3: CRUD Completo de Tarefas

Nenhuma operacao de criar/editar/deletar tarefas existe.

**O que fazer:**
- Criar componente `TaskForm` (modal/sheet) para adicionar tarefa
- Campos: titulo, descricao, data, hora, prioridade, categoria
- Botao FAB (+) na HomePage abre o formulario
- Toggle de completar tarefa no card
- Swipe ou botao para deletar tarefa
- Editar tarefa ao clicar no card

---

### Bloco 4: CRUD Completo de Eventos (Agenda)

AgendaPage mostra eventos hardcoded e nao permite interacao.

**O que fazer:**
- Buscar eventos reais do banco para o dia selecionado
- Botao "Novo" funcional: abre formulario de evento
- Campos: titulo, descricao, data/hora inicio, data/hora fim, categoria, local, lembrete
- Navegacao entre dias/meses funcional (os botoes ChevronLeft/Right)
- Calendario mensal completo (nao so 7 dias)
- Deletar/editar evento

---

### Bloco 5: CRUD Completo de Financas

FinancasPage mostra categorias e contas hardcoded.

**O que fazer:**
- Buscar despesas reais do banco
- Calcular gastos por categoria dinamicamente
- Botao "Adicionar" funcional: formulario de despesa
- Campos: titulo, valor, data, categoria, pago/pendente, recorrente
- Marcar conta como paga
- Definir orcamento por categoria (nova tabela `budgets` ou coluna)
- Graficos reais com Recharts (ja instalado, nao usado)

---

### Bloco 6: Fluxo Completo do Offload com IA

O botao "Processar" nao faz nada. A edge function `offload-process` existe mas nao e chamada.

**O que fazer:**
- Conectar botao "Processar" a edge function `offload-process`
- Mostrar loading/estado de processamento
- Exibir cards de confirmacao com itens extraidos pela IA (tarefa, evento, despesa, lembrete)
- Botao "Confirmar" salva os itens no banco de dados
- Botao "Editar" permite ajustar antes de salvar
- Integrar TTS: ler resposta da IA em voz alta (Web Speech gratuito ou ElevenLabs premium)
- Fluxo voice-in/voice-out completo: falar -> transcrever -> processar -> mostrar -> ler resposta

---

### Bloco 7: Integracao ElevenLabs Premium no Frontend

Edge functions de TTS e STT existem mas nao sao chamadas pelo app.

**O que fazer:**
- Criar hook `useElevenLabs` que chama as edge functions
- Adicionar toggle no Perfil: "Qualidade de voz" (Padrao/Premium)
- No Offload: se premium, usar ElevenLabs STT em vez de Web Speech API
- Nas respostas da IA: usar ElevenLabs TTS para audio de alta qualidade
- Verificar `is_premium` do perfil para decidir qual servico usar

---

### Bloco 8: Perfil Real e Configuracoes Funcionais

PerfilPage mostra "Joao Silva" hardcoded. Switches nao funcionam.

**O que fazer:**
- Carregar dados reais do perfil (nome, email, avatar)
- Editar nome e avatar
- Dark mode funcional com `next-themes` (ja instalado)
- Notificacoes toggle funcional (Web Push Notifications ou permissao)
- Selecao de modo (profissional/estudante/familia) salva no banco
- Botao de logout
- Toggle "Ler respostas automaticamente" para TTS
- Toggle "Qualidade de voz" (Padrao/Premium)

---

### Bloco 9: Protecao de Rotas e Navegacao

Qualquer pessoa acessa `/home` sem login. O botao (+) nao funciona.

**O que fazer:**
- Componente `ProtectedRoute` que verifica sessao
- Redirect automatico para `/login` se nao autenticado
- Redirect automatico para `/home` se ja autenticado (nas rotas de auth)
- FAB (+) com menu de opcoes: Nova Tarefa, Novo Evento, Nova Despesa, Offload Rapido

---

### Bloco 10: PWA e Experiencia Mobile

`vite-plugin-pwa` esta instalado mas nao configurado.

**O que fazer:**
- Configurar service worker no `vite.config.ts`
- Criar `manifest.json` com icones e cores do MindFlow
- Splash screen
- Instalar prompt ("Adicionar a tela inicial")
- Cache de assets para uso offline

---

### Ordem de Implementacao Recomendada

A implementacao deve seguir esta sequencia para evitar dependencias quebradas:

1. **Autenticacao** (Bloco 1) -- base para tudo
2. **Protecao de rotas** (Bloco 9) -- seguranca
3. **Perfil real** (Bloco 8) -- dados do usuario
4. **CRUD Tarefas** (Bloco 3) -- funcionalidade core
5. **CRUD Eventos** (Bloco 4) -- funcionalidade core
6. **CRUD Financas** (Bloco 5) -- funcionalidade core
7. **Dashboard real** (Bloco 2) -- depende dos CRUDs
8. **Offload com IA** (Bloco 6) -- fluxo principal do app
9. **ElevenLabs premium** (Bloco 7) -- upgrade de voz
10. **PWA** (Bloco 10) -- polimento final

---

### Detalhes Tecnicos

**Novos arquivos a criar:**
- `src/contexts/AuthContext.tsx` -- contexto de autenticacao
- `src/components/ProtectedRoute.tsx` -- guarda de rotas
- `src/components/tasks/TaskForm.tsx` -- formulario de tarefa
- `src/components/tasks/TaskCard.tsx` -- card interativo de tarefa
- `src/components/events/EventForm.tsx` -- formulario de evento
- `src/components/expenses/ExpenseForm.tsx` -- formulario de despesa
- `src/components/offload/ConfirmationCard.tsx` -- card de confirmacao IA
- `src/components/offload/AIResponseCard.tsx` -- resposta da IA
- `src/components/shared/QuickAddMenu.tsx` -- menu do FAB (+)
- `src/hooks/useTasks.ts` -- hook de CRUD tarefas
- `src/hooks/useEvents.ts` -- hook de CRUD eventos
- `src/hooks/useExpenses.ts` -- hook de CRUD despesas
- `src/hooks/useProfile.ts` -- hook de perfil
- `src/hooks/useElevenLabs.ts` -- hook de voz premium

**Arquivos a modificar:**
- `src/App.tsx` -- AuthProvider + ProtectedRoute
- `src/pages/LoginPage.tsx` -- auth real
- `src/pages/RegisterPage.tsx` -- auth real
- `src/pages/HomePage.tsx` -- dados reais + CRUD
- `src/pages/AgendaPage.tsx` -- dados reais + CRUD
- `src/pages/FinancasPage.tsx` -- dados reais + CRUD
- `src/pages/OffloadPage.tsx` -- fluxo IA completo
- `src/pages/PerfilPage.tsx` -- dados reais + configuracoes
- `src/components/layout/AppLayout.tsx` -- protecao
- `vite.config.ts` -- PWA config

**Migracao de banco necessaria:**
- Tabela `budgets` (orcamento por categoria) -- opcional, pode ser coluna em expenses
- Nenhuma outra alteracao de schema necessaria, as tabelas existentes cobrem tudo

**Nenhuma dependencia nova necessaria** -- tudo ja esta instalado (recharts, next-themes, react-hook-form, zod, vite-plugin-pwa).

