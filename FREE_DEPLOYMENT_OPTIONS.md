# 🎯 Alternativas de Deploy Gratuitas para OffMe (Sem Custo)

## 🎯 Objetivo

Este documento apresenta alternativas **completamente gratuitas** para deploy do OffMe, eliminando a necessidade de Docker e sem custos mensais.

## 🔍 Análise da Situação Atual

Atualmente, o projeto usa:
- Docker para desenvolvimento local
- Railway + Vercel para produção (com custos potenciais)
- Vários microserviços que precisam ser hospedados

## ✅ Alternativas Gratuitas Recomendadas

### 1. 🛤️ Railway.app (Plano Gratuito) - **Recomendação Principal**

**Status**: Parcialmente configurado (já existe `railway.toml`)

**Vantagens**:
- ✅ **$500/mês de créditos gratuitos** (suficiente para desenvolvimento e pequenos projetos)
- ✅ **Já parcialmente configurado** no seu projeto
- ✅ **Bancos de dados gratuitos** (PostgreSQL, Redis)
- ✅ **Suporte nativo para Scala/Java**
- ✅ **Deploy direto do código fonte** (sem Docker necessário)
- ✅ **Interface moderna e fácil de usar**

**Como configurar**:

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Fazer login
railway login

# 3. Iniciar novo projeto (ou usar existente)
railway init

# 4. Adicionar serviços gratuitos
railway service add postgres  # Banco de dados PostgreSQL gratuito
railway service add redis    # Redis gratuito

# 5. Configurar variáveis de ambiente
railway variables set \
  DB_HOST='${{ DB_HOST }}' \
  DB_USER='${{ DB_USER }}' \
  DB_PASSWORD='${{ DB_PASSWORD }}' \
  JWT_SECRET='seu-segredo-jwt-aqui' \
  IDENTITY_SERVICE_URL='http://identity-service:8081' \
  POST_SERVICE_URL='http://post-service:8082' \
  TIMELINE_SERVICE_URL='http://timeline-service:8083' \
  GRAPH_SERVICE_URL='http://graph-service:8084' \
  NOTIFICATION_SERVICE_URL='http://notification-service:8085' \
  WEBSOCKET_SERVICE_URL='http://websocket-service:8086'

# 6. Fazer deploy (sem Docker)
railway up
```

**Configuração `railway.toml` atualizada (sem Docker)**:
```toml
[build]
buildCommand = "cd backend-scala && sbt stage"
startCommand = "target/universal/stage/bin/offme-api-gateway"

[deploy]
numReplicas = 1
restartPolicyType = "ALWAYS"
restartPolicyMaxRetries = 3
healthcheckPath = "/api/v1/health"
healthcheckTimeout = 30
```

### 2. ⚡ Render.com (Plano Gratuito)

**Vantagens**:
- ✅ **Serviços web gratuitos** (com limitações)
- ✅ **Bancos de dados PostgreSQL gratuitos**
- ✅ **Suporte nativo para Scala/Java**
- ✅ **Interface simples e intuitiva**

**Limitações**:
- ⚠️ Serviços gratuitos dormem após inatividade
- ⚠️ Limite de 750 horas/mês para serviços gratuitos

**Como configurar**:

1. **Criar conta no [Render.com](https://render.com)**
2. **Conectar repositório GitHub**
3. **Criar novo "Web Service" com configuração**:
   - Build Command: `cd backend-scala && sbt stage`
   - Start Command: `target/universal/stage/bin/offme-api-gateway`
   - Region: Oregon (mais próxima do Brasil)
   - Plan: Free

4. **Adicionar variáveis de ambiente**:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, etc.

### 3. ☁️ Vercel (Plano Gratuito) + Railway

**Vantagens**:
- ✅ **Frontend gratuito ilimitado**
- ✅ **Funções serverless gratuitas** (até certo limite)
- ✅ **Integração fácil com Railway para backend**

**Como configurar**:

1. **Frontend na Vercel (gratuito)**:
```bash
cd frontend-web
vercel --prod
```

2. **Backend no Railway (gratuito)**:
```bash
cd backend-scala
railway up
```

3. **Configurar `vercel.json` para apontar para Railway**:
```json
{
  "rewrites": [
    {
      "source": "/api/v1/:path*",
      "destination": "https://seu-projeto.up.railway.app/api/v1/:path*"
    }
  ]
}
```

### 4. 🔥 Firebase (Plano Gratuito)

**Vantagens**:
- ✅ **Plano gratuito generoso** (até certo limite de uso)
- ✅ **Banco de dados, autenticação, storage inclusos**
- ✅ **Funções serverless gratuitas**

**Desafios**:
- ⚠️ Requer adaptação do código para Firestore
- ⚠️ Arquitetura diferente do atual PostgreSQL

**Como configurar**:

1. **Instalar Firebase CLI**:
```bash
npm install -g firebase-tools
firebase login
```

2. **Iniciar projeto Firebase**:
```bash
firebase init functions
```

3. **Adaptar código para Firestore** (exemplo):
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.registerUser = functions.https.onCall(async (data, context) => {
  const user = await admin.auth().createUser({
    email: data.email,
    password: data.password
  });

  await admin.firestore().collection('users').doc(user.uid).set({
    username: data.username,
    createdAt: new Date()
  });

  return { success: true, userId: user.uid };
});
```

### 5. 🌐 Supabase (Alternativa Open-Source Gratuita)

**Vantagens**:
- ✅ **Plano gratuito com PostgreSQL real**
- ✅ **Autenticação, storage, funções inclusos**
- ✅ **API similar ao Firebase mas com PostgreSQL**

**Como configurar**:

1. **Criar projeto no [Supabase](https://supabase.com)**
2. **Configurar banco de dados**:
```bash
# Conectar ao PostgreSQL
psql postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
```

3. **Configurar serviços**:
```bash
# Atualizar configuração para usar Supabase
export DB_HOST=db.your-project.supabase.co
export DB_USER=postgres
export DB_PASSWORD=your-password
export JWT_SECRET=your-secret
```

## 🎯 Comparação de Alternativas Gratuitas

| Solução | Backend Gratuito | Banco de Dados | Escalabilidade | Complexidade |
|---------|------------------|---------------|---------------|--------------|
| **Railway** | ✅ Sim ($500/mês) | ✅ PostgreSQL + Redis | ✅ Automática | 🟢 Baixa |
| **Render** | ✅ Sim (750h/mês) | ✅ PostgreSQL | ⚠️ Manual | 🟢 Baixa |
| **Vercel+Railway** | ✅ Sim | ✅ Railway | ✅ Automática | 🟢 Baixa |
| **Firebase** | ✅ Sim | ✅ Firestore | ✅ Automática | 🟠 Alta |
| **Supabase** | ✅ Sim | ✅ PostgreSQL | ✅ Automática | 🟢 Média |

## 🚀 Recomendação Final: Railway.app

**Por que Railway é a melhor opção gratuita**:

1. **Já parcialmente configurado** - Menos trabalho para implementar
2. **$500/mês de créditos** - Suficiente para desenvolvimento e pequenos projetos
3. **Bancos de dados gratuitos** - PostgreSQL e Redis inclusos
4. **Sem Docker necessário** - Pode usar deploy direto do código
5. **Interface moderna** - Fácil de configurar e monitorar

## 📋 Passos para Implementação (Railway)

1. **Atualizar `railway.toml`**:
```toml
[build]
buildCommand = "cd backend-scala && sbt stage"
startCommand = "target/universal/stage/bin/offme-api-gateway"

[deploy]
numReplicas = 1
restartPolicyType = "ALWAYS"
```

2. **Fazer deploy**:
```bash
cd backend-scala
railway up
```

3. **Configurar frontend**:
```javascript
// frontend-web/src/lib/api.ts
export const API_BASE_URL = 'https://seu-projeto.up.railway.app/api/v1';
```

## 💰 Monitoramento de Custos

Mesmo com planos gratuitos, é importante monitorar o uso:

```bash
# Verificar uso no Railway
railway status
railway logs

# Configurar alertas (no dashboard do Railway)
# Ir para Settings > Billing > Alerts
```

## 📚 Recursos Adicionais

- [Railway Free Tier](https://railway.app/pricing)
- [Render Free Tier](https://render.com/pricing)
- [Vercel Free Tier](https://vercel.com/pricing)
- [Firebase Free Tier](https://firebase.google.com/pricing)
- [Supabase Free Tier](https://supabase.com/pricing)

**✅ Com estas alternativas, você pode executar o OffMe completamente gratuito, sem custos mensais e sem necessidade de Docker!**