# 🚀 Deploy RC-BioScan IA Pro - Guia Rápido

## ✅ Status do Build

```
✓ Build concluído com sucesso!
- dist/assets/react-vendor-DF3nNwgj.js    11.18 kB │ gzip:  3.95 kB
- dist/assets/index-CI6DWERD.js          209.73 kB │ gzip: 65.87 kB
```

**Bundle Total:** ~220 KB (comprimido: ~70 KB) ✨

---

## 📦 Deploy na Vercel

### Opção 1: Via Interface Web (Mais Simples)

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Add New Project"**
3. Selecione o repositório `RC-BioScan-IA-Pro`
4. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Adicione a variável de ambiente:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyCi509PAtDLnH3hXGR7bYrGbW3B92EBHYg`
6. Clique em **"Deploy"**

### Opção 2: Via CLI (Terminal)

```bash
# 1. Instalar Vercel CLI (se ainda não tem)
npm install -g vercel

# 2. Fazer login
vercel login

# 3. Deploy
cd c:\rcscan\RC-BioScan-IA-Pro
vercel

# Responda as perguntas:
# - Set up and deploy? Yes
# - Which scope? (seu usuário)
# - Link to existing project? No
# - What's your project's name? rc-bioscan-ia-pro
# - In which directory is your code located? ./
# - Want to override the settings? No

# 4. Configurar variável de ambiente
vercel env add GEMINI_API_KEY production
# Cole: AIzaSyCi509PAtDLnH3hXGR7bYrGbW3B92EBHYg

# 5. Redeploy para aplicar a variável
vercel --prod
```

---

## ⚙️ Configuração Pós-Deploy

### 1. Verificar Variável de Ambiente
No painel da Vercel:
1. Vá para **Settings** → **Environment Variables**
2. Confirme que `GEMINI_API_KEY` está configurada
3. Se não estiver, adicione manualmente:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyCi509PAtDLnH3hXGR7bYrGbW3B92EBHYg`
   - **Environments:** Production, Preview, Development

### 2. Teste a Aplicação
1. Acesse a URL do deploy (ex: `https://rc-bioscan-ia-pro.vercel.app`)
2. Faça upload de uma imagem de teste
3. Verifique no console do navegador os logs de compressão:
   ```
   Image compressed: 2.85 MB, quality: 75%
   ```

---

## 🎯 Checklist Pós-Deploy

- [ ] URL da aplicação funcionando
- [ ] Upload de imagens funciona sem travar
- [ ] Análise retorna resultados em português
- [ ] Logs de compressão aparecem no console
- [ ] Múltiplas imagens podem ser enviadas
- [ ] Relatório é gerado corretamente

---

## 🔍 Troubleshooting

### Erro: "GEMINI_API_KEY not configured"
**Solução:**
1. Vá para Settings → Environment Variables na Vercel
2. Adicione `GEMINI_API_KEY` com o valor correto
3. Faça redeploy (Deployments → três pontos → Redeploy)

### Erro: Payload too large / Request Entity Too Large
**Solução:**
- Verifique se as otimizações em `analysisService.ts` foram aplicadas
- Confirme que MAX_DIMENSION = 1920 e qualidade adaptativa está ativa
- Monitore logs de compressão no console

### Build falha na Vercel
**Solução:**
- Verifique se `terser` está em `package.json` como devDependency
- Execute `npm install` localmente para atualizar package-lock.json
- Faça commit e push do package-lock.json atualizado

---

## 📊 Monitoramento

### Performance
- **First Load:** < 2s (esperado)
- **Bundle Size:** ~220 KB (otimizado)
- **API Response:** 10-30s (dependendo da IA)

### Logs Importantes
No console do navegador durante uso:
```javascript
Image compressed: 2.85 MB, quality: 75%
Image compressed: 3.12 MB, quality: 70%
Image compressed: 2.43 MB, quality: 85%
```

---

## 🚀 Próximos Passos

### Opcional: Custom Domain
1. Na Vercel, vá para **Settings** → **Domains**
2. Adicione seu domínio customizado
3. Configure DNS conforme instruções

### Opcional: Analytics
1. Habilite Vercel Analytics em Settings
2. Monitore visitas e performance
3. Identifique gargalos de performance

---

## ✨ Resultado Final

Com o deploy concluído, você terá:
- ✅ Aplicação rodando 24/7 na Vercel
- ✅ Compressão inteligente de imagens
- ✅ API key segura no backend
- ✅ Build otimizado (220 KB)
- ✅ Performance excelente
- ✅ Sem travamentos com imagens pesadas

**URL esperada:** `https://rc-bioscan-ia-pro-[seu-usuario].vercel.app`

---

**Desenvolvido por Rosemary Costa – CABELO IA**  
www.cabeloia.com.br | WhatsApp: +55 11 92102-2430
