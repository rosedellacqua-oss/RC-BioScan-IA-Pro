# Configurar Variável de Ambiente no Vercel

## Via CLI (Recomendado)

```bash
# 1. Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# 2. Fazer login
vercel login

# 3. Linkar o projeto
cd RC-BioScan-IA-Pro
vercel link

# 4. Adicionar a variável de ambiente
vercel env add GEMINI_API_KEY

# Quando solicitado:
# - Cole a key: AIzaSyAt2mjkn0Cy4PuliRoC22m_s2YteSGHX0k
# - Escolha: Production, Preview, Development (todas)

# 5. Fazer redeploy
vercel --prod
```

## Via Dashboard (Alternativa)

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: **RC-BioScan-IA-Pro**
3. **Settings** → **Environment Variables**
4. **Add New Variable**:
   - Key: `GEMINI_API_KEY`
   - Value: `AIzaSyAt2mjkn0Cy4PuliRoC22m_s2YteSGHX0k`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
5. **Save**
6. **Deployments** → Clique nos 3 pontos do último deploy → **Redeploy**

## Verificar se funcionou

Após o deploy, teste a aplicação. Se ainda der erro 500, verifique os logs:

```bash
vercel logs --follow
```

Ou na dashboard: **Deployments** → Selecione o deployment → **Logs**
