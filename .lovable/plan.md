

## Plano: Configurar Paddle com credenciais reais + Google OAuth + Remover Apple

### 1. Configurar Paddle com os Price IDs fornecidos

**PremiumPage.tsx**: Substituir as variáveis de env pelos IDs reais fornecidos:
- Client token: `live_e60c295432d15f2b8e061d1872b`
- Monthly: `pri_01kjt54b506e1mgs7k17xey4mv`
- Yearly: `pri_01kjt4zkpq67hspzfke0bdearz`

**usePaddle.ts**: Usar o token diretamente e mudar environment para `production`.

### 2. Implementar Google Sign-In real

Usar a integração gerenciada do Lovable Cloud (`lovable.auth.signInWithOAuth("google")`). Será necessário:
- Usar a ferramenta "Configure Social Login" para gerar o módulo lovable
- Atualizar o botão Google no **LoginPage** para chamar o OAuth real
- Adicionar botão Google também no **RegisterPage**

### 3. Remover botão Apple

- **LoginPage.tsx**: Remover o botão Apple, manter apenas Google (layout full-width em vez de grid 2 colunas)

### 4. PWA + OAuth compatibility

- **vite.config.ts**: Adicionar `navigateFallbackDenylist: [/^\/~oauth/]` ao workbox para não cachear redirects OAuth

### Arquivos a modificar
- `src/pages/PremiumPage.tsx` — IDs do Paddle hardcoded
- `src/hooks/usePaddle.ts` — token e environment production
- `src/pages/LoginPage.tsx` — remover Apple, Google OAuth real
- `src/pages/RegisterPage.tsx` — adicionar Google OAuth
- `vite.config.ts` — navigateFallbackDenylist

