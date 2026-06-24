# OffMe Deployment Guide

## 🚀 Hybrid Railway + Vercel Deployment

### Pré-requisitos
- Conta na [Railway](https://railway.app)
- Conta na [Vercel](https://vercel.com)
- Railway CLI instalado (`npm install -g @railway/cli`)
- Vercel CLI instalado (`npm install -g vercel`)
- Docker instalado (para build local)

---

## 🔧 Nova Arquitetura (Hybrid Deployment)

### Como funciona:
```
🌍 Cliente → Vercel Edge Network (API Gateway) → Railway Microservices → Railway Database
```

### Vantagens:
- ✅ **API Gateway na Edge**: Baixa latência global via Vercel
- ✅ **Microserviços gerenciados**: Infraestrutura confiável no Railway
- ✅ **Custo otimizado**: Aproveita o melhor de ambos os mundos
- ✅ **Escalabilidade**: Edge functions + containers gerenciados

---

## 📋 Passo 1: Configurar Railway (Microserviços)

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
# Configurar JWT Secret (compartilhado com Vercel)
railway variables set --service backend JWT_SECRET=your_256_bit_secret_here

# Configurar Database
# DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD serão preenchidos automaticamente

# Configurar Redis
# REDIS_HOST, REDIS_PORT serão preenchidos automaticamente

# Configurar URLs dos serviços internos
railway variables set --service backend IDENTITY_SERVICE_URL=http://identity-service:8081
railway variables set --service backend POST_SERVICE_URL=http://post-service:8082
railway variables set --service backend TIMELINE_SERVICE_URL=http://timeline-service:8083
railway variables set --service backend GRAPH_SERVICE_URL=http://graph-service:8084
railway variables set --service backend NOTIFICATION_SERVICE_URL=http://notification-service:8085
railway variables set --service backend WEBSOCKET_SERVICE_URL=http://websocket-service:8086
```

### 1.4. Fazer Deploy dos Microserviços
```bash
# Fazer deploy dos serviços (exceto API Gateway)
cd backend-scala
sbt identity-service/universal:packageBin
sbt post-service/universal:packageBin
sbt timeline-service/universal:packageBin
sbt graph-service/universal:packageBin
sbt notification-service/universal:packageBin
sbt websocket-service/universal:packageBin

# Deploy para Railway
railway up

# Ver logs
railway logs

# Ver status
railway status
```

---

## 🌐 Passo 2: Configurar Vercel (API Gateway + Frontend)

### 2.1. Configurar Variáveis de Ambiente no Vercel
```bash
# Navegar para a raiz do projeto
cd /caminho/para/OffMe

# Adicionar variáveis de ambiente para o API Gateway
vercel env add RAILWAY_BACKEND_URL production
vercel env add JWT_SECRET production
vercel env add DB_HOST production
vercel env add DB_PORT production
vercel env add DB_NAME production
vercel env add DB_USER production
vercel env add DB_PASSWORD production
vercel env add REDIS_HOST production
vercel env add REDIS_PORT production

# Adicionar variáveis para o frontend
vercel env add NEXT_PUBLIC_API_URL production "/api/v1"
vercel env add NEXT_PUBLIC_WS_URL production "wss://seu-projeto-production.up.railway.app/ws"
```

### 2.2. Fazer Deploy do API Gateway e Frontend
```bash
# Fazer deploy completo (API Gateway + Frontend)
vercel --prod

# Ou fazer deploy separado:
# Deploy apenas do API Gateway
vercel --prod --scope=api-gateway

# Deploy apenas do Frontend
cd frontend-web && vercel --prod
```

### 2.3. Configurar Domínio
```bash
# Adicionar domínio
vercel domains add offme.vercel.app

# Configurar DNS (no seu registrador de domínio)
# CNAME: offme.vercel.app
```

---

## 🔧 Passo 3: Configurar Integração

### 3.1. Configurar CORS e Rotas
O `vercel.json` já está configurado para:
- Rotear `/api/v1/*` para o API Gateway no Vercel
- Rotear `/ws/*` para WebSocket no Railway
- Servir frontend estático para todas as outras rotas

### 3.2. Testar Integração
```bash
# Testar health check (agora servido pelo Vercel)
curl https://offme.vercel.app/api/v1/health

# Testar registro (API Gateway no Vercel → Identity Service no Railway)
curl -X POST https://offme.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!","displayName":"Test"}'

# Testar WebSocket (direto para Railway)
wscat -c wss://seu-projeto-production.up.railway.app/ws
```

---

## 📦 Passo 4: Configurar Banco de Dados

### 4.1. Aplicar Schemas
```bash
# Conectar ao PostgreSQL (Railway)
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
# Executar script de teste (atualizado para nova arquitetura)
./scripts/test-backend-flow.sh
```

### 5.2. Verificar Serviços
- ✅ **API Gateway**: https://offme.vercel.app/api/v1/health (Vercel)
- ✅ **Microserviços**: https://seu-projeto-production.up.railway.app (Railway)
- ✅ **Frontend**: https://offme.vercel.app
- ✅ **WebSocket**: wss://seu-projeto-production.up.railway.app/ws

---

## 🔄 Passo 6: Configurar CI/CD

### 6.1. Configurar GitHub Actions para Hybrid Deployment
```yaml
# .github/workflows/deploy.yml
name: Hybrid Deploy

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd backend-scala && sbt test

  deploy-railway:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd backend-scala && sbt compile
      - run: cd backend-scala && sbt package
      - run: railway up --service backend

  deploy-vercel:
    needs: deploy-railway
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: vercel --prod
```

---

## 📊 Passo 7: Monitoramento

### 7.1. Configurar Railway Insights
- Acessar dashboard do Railway
- Configurar alertas para microserviços
- Monitorar métricas de banco de dados

### 7.2. Configurar Vercel Analytics
- Acessar dashboard do Vercel
- Configurar monitoring para API Gateway
- Verificar logs de edge functions
- Monitorar latência global

### 7.3. Configurar Alertas Unificados
```bash
# Usar webhooks para integrar Railway + Vercel alerts
vercel webhooks add deploy-succeeded https://seu-webhook-url.com/vercel-deploy
railway webhooks add deploy https://seu-webhook-url.com/railway-deploy
```

---

## 🆘 Solução de Problemas

### Problema: API Gateway não responde
**Solução:**
```bash
# Verificar logs do Vercel
vercel logs

# Testar conexão com Railway
curl https://seu-projeto-production.up.railway.app/api/v1/health

# Verificar variáveis de ambiente
vercel env ls
```

### Problema: CORS
**Solução:**
- Verificar configuração no `vercel.json`
- Certificar-se de que o API Gateway está configurado para aceitar requests do frontend
- Verificar headers na resposta: `Access-Control-Allow-Origin: *`

### Problema: Microserviços não iniciam no Railway
**Solução:**
```bash
# Ver logs detalhados
railway logs --service identity-service

# Verificar ports expostos
railway run netstat -tuln

# Testar conexão entre serviços
railway run curl http://identity-service:8081/api/v1/health
```

### Problema: WebSocket não conecta
**Solução:**
- Verificar se o WebSocket está configurado para Railway (não Vercel)
- Testar conexão direta: `wscat -c wss://seu-projeto-production.up.railway.app/ws`
- Verificar CORS e headers

---

## ✅ Checklist de Deploy (Hybrid)

- [ ] Criar projeto no Railway
- [ ] Adicionar serviços (PostgreSQL, Redis)
- [ ] Configurar variáveis de ambiente no Railway
- [ ] Fazer deploy dos microserviços no Railway
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Fazer deploy do API Gateway no Vercel
- [ ] Fazer deploy do frontend no Vercel
- [ ] Configurar domínio
- [ ] Testar integração API Gateway → Microserviços
- [ ] Testar WebSocket direto
- [ ] Configurar CI/CD
- [ ] Monitorar serviços

---

## 🎓 Dicas para Hybrid Deployment

1. **Variáveis de Ambiente Compartilhadas**: Mantenha JWT_SECRET e DB credentials sincronizados entre Railway e Vercel
2. **Monitoramento Unificado**: Use ferramentas como Datadog ou New Relic para monitorar ambos os ambientes
3. **Latência**: Aproveite a edge network do Vercel para reduzir latência global
4. **Custo**: Monitore o uso no Railway para evitar surpresas com microserviços
5. **Backups**: Configure backups automáticos no Railway para PostgreSQL/Redis
6. **Health Checks**: Configure health checks em ambos os ambientes

---

## 🚀 Parabéns!

Seu sistema OffMe está agora em produção com a nova arquitetura híbrida:
- ✅ **API Gateway na Edge**: Vercel com baixa latência global
- ✅ **Microserviços gerenciados**: Railway com infraestrutura confiável
- ✅ **Banco de dados unificado**: Railway PostgreSQL/Redis
- ✅ **Frontend rápido**: Vercel com deploy instantâneo
- ✅ **CI/CD automatizado**: GitHub Actions para ambos os ambientes
- ✅ **Monitoring completo**: Insights em ambos os provedores

**Performance esperada:**
- 🌍 **Latência reduzida**: API Gateway em +50 regiões globais
- 🚀 **Escalabilidade automática**: Microserviços gerenciados
- 💰 **Custo otimizado**: Pague apenas pelo que usa
- 🔒 **Segurança**: TLS automático, DDoS protection, e muito mais

Aproveite o beta aberto com a nova arquitetura! 🎉
