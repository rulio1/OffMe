# OffMe Deployment Guide

## 🚀 Railway + Vercel Deployment

### Pré-requisitos
- Conta na [Railway](https://railway.app)
- Conta na [Vercel](https://vercel.com)
- Railway CLI instalado (`npm install -g @railway/cli`)
- Vercel CLI instalado (`npm install -g vercel`)

---

## 📋 Passo 1: Configurar Railway

### 1.1. Criar Projeto no Railway
```bash
# Login
railway login

# Criar novo projeto
railway init

# Navegar para o diretório do projeto
cd /caminho/para/OffMe
```

### 1.2. Adicionar Serviços Gerenciados
```bash
# Adicionar PostgreSQL
railway service add postgres

# Adicionar Redis
railway service add redis

# Verificar serviços
railway service list
```

### 1.3. Configurar Variáveis de Ambiente
```bash
# Configurar JWT Secret
railway variables set --service backend JWT_SECRET=your_256_bit_secret_here

# Configurar URLs dos serviços (serão preenchidas automaticamente pelo Railway)
# DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# REDIS_HOST, REDIS_PORT
```

### 1.4. Fazer Deploy do Backend
```bash
# Fazer deploy
railway up

# Ver logs
railway logs

# Ver status
railway status
```

---

## 🌐 Passo 2: Configurar Vercel

### 2.1. Fazer Deploy do Frontend
```bash
# Navegar para frontend
cd frontend-web

# Fazer deploy
vercel --prod

# Configurar variáveis de ambiente
vercel env add RAILWAY_BACKEND_URL production
```

### 2.2. Configurar Domínio
```bash
# Adicionar domínio
vercel domains add offme.vercel.app

# Configurar DNS (no seu registrador de domínio)
# CNAME: offme.vercel.app
```

---

## 🔧 Passo 3: Configurar Integração

### 3.1. Configurar CORS
No `vercel.json`, certifique-se de que as rotas de API estão corretas:
```json
{
  "routes": [
    {
      "src": "/api/v1/(.*)",
      "dest": "https://seu-projeto-production.up.railway.app/api/v1/$1"
    }
  ]
}
```

### 3.2. Testar Integração
```bash
# Testar health check
curl https://offme.vercel.app/api/v1/health

# Testar registro
curl -X POST https://offme.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!","displayName":"Test"}'
```

---

## 📦 Passo 4: Configurar Banco de Dados

### 4.1. Aplicar Schemas
```bash
# Conectar ao PostgreSQL
psql postgresql://offme:password@host:port/offme

# Aplicar schema
\i schemas/postgres/001_init.sql
```

### 4.2. Configurar Cassandra (opcional)
```bash
# Usar Astra DB ou configurar manualmente
cqlsh -f schemas/cassandra/001_init.cql
```

---

## 🎉 Passo 5: Testar Sistema Completo

### 5.1. Testar Fluxo Completo
```bash
# Executar script de teste
./scripts/test-backend-flow.sh
```

### 5.2. Verificar Serviços
- ✅ Backend: https://seu-projeto-production.up.railway.app
- ✅ Frontend: https://offme.vercel.app
- ✅ Health: https://offme.vercel.app/api/v1/health

---

## 🔄 Passo 6: Configurar CI/CD

### 6.1. Configurar GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: railway up --service backend

  deploy-frontend:
    needs: deploy-backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd frontend-web && vercel --prod
```

---

## 📊 Passo 7: Monitoramento

### 7.1. Configurar Railway Insights
- Acessar dashboard do Railway
- Configurar alertas
- Monitorar métricas

### 7.2. Configurar Vercel Analytics
- Acessar dashboard do Vercel
- Configurar monitoring
- Verificar logs

---

## 🆘 Solução de Problemas

### Problema: Conexão com Banco de Dados
**Solução:**
```bash
# Verificar variáveis de ambiente
railway variables list

# Testar conexão manualmente
psql postgresql://offme:password@host:port/offme
```

### Problema: CORS
**Solução:**
- Verificar configuração no `vercel.json`
- Certificar-se de que o backend está configurado para aceitar requests do frontend

### Problema: Services não iniciam
**Solução:**
```bash
# Ver logs detalhados
railway logs --service backend

# Verificar ports expostos
railway run netstat -tuln
```

---

## ✅ Checklist de Deploy

- [ ] Criar projeto no Railway
- [ ] Adicionar serviços (PostgreSQL, Redis)
- [ ] Configurar variáveis de ambiente
- [ ] Fazer deploy do backend
- [ ] Fazer deploy do frontend
- [ ] Configurar domínio
- [ ] Testar integração
- [ ] Configurar CI/CD
- [ ] Monitorar serviços

---

## 🎓 Dicas

1. **Use Railway Variables**: Para configurações sensíveis
2. **Monitore Logs**: `railway logs` para debug
3. **Escale Gradualmente**: Ajuste replicas conforme necessário
4. **Configure Alertas**: Para downtime e erros
5. **Use Railway Plugins**: Para backups e monitoring

---

## 🚀 Parabéns!

Seu sistema OffMe está agora em produção com:
- ✅ Backend escalável na Railway
- ✅ Frontend rápido na Vercel
- ✅ Banco de dados gerenciado
- ✅ CI/CD automatizado
- ✅ Monitoring completo

Aproveite o beta aberto! 🎉