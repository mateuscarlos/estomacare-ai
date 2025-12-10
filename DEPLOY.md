# 🚀 Guia de Deploy - EstomaCare AI

## 📋 Pré-requisitos

- Node.js 20 ou superior
- npm ou yarn
- Conta Google (para Firebase)
- Firebase CLI instalado globalmente: `npm install -g firebase-tools`
- Gemini API Key (https://aistudio.google.com/app/apikey)

## 🔧 Configuração Inicial

### 1. Criar Projeto no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nome do projeto: `estomacare-ai` (ou o nome que preferir)
4. Habilite Google Analytics (opcional)
5. Aguarde a criação do projeto

### 2. Configurar Firebase Authentication

1. No Firebase Console, vá em **Authentication**
2. Clique em **Get Started**
3. Habilite os provedores:
   - **Email/Password** ✅
   - **Google** ✅ (Configure OAuth consent screen se necessário)

### 3. Configurar Cloud Firestore

1. No Firebase Console, vá em **Firestore Database**
2. Clique em **Create Database**
3. Escolha **Start in production mode** (as regras já estão no código)
4. Selecione a localização: `us-central` ou mais próxima do seu público

### 4. Configurar Cloud Storage

1. No Firebase Console, vá em **Storage**
2. Clique em **Get Started**
3. Escolha **Start in production mode**
4. Use a mesma localização do Firestore

### 5. Configurar Cloud Functions

1. No Firebase Console, vá em **Functions**
2. Clique em **Get Started**
3. Faça upgrade para o **Blaze Plan** (pay-as-you-go)
   - ⚠️ **Necessário para Cloud Functions**
   - Free tier generoso: 2M invocações/mês grátis

## 🔐 Configurar Variáveis de Ambiente

### 1. Criar arquivo `.env.local` na raiz do projeto

```bash
# Copie o arquivo de exemplo
cp .env.local.example .env.local
```

### 2. Preencher as variáveis no `.env.local`

```env
# Gemini API Key (CRÍTICO - para desenvolvimento local)
GEMINI_API_KEY=AIzaSy...sua_chave_aqui

# Firebase Configuration (pegue no Firebase Console > Project Settings)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=estomacare-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=estomacare-ai
VITE_FIREBASE_STORAGE_BUCKET=estomacare-ai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

**Como obter as variáveis do Firebase:**
1. Firebase Console > ⚙️ Project Settings
2. Scroll até "Your apps"
3. Clique no ícone Web (`</>`)
4. Registre um app com nome "EstomaCare Web"
5. Copie os valores do `firebaseConfig`

### 3. Configurar Secret Manager para Cloud Functions

A `GEMINI_API_KEY` **NÃO DEVE** estar exposta no frontend. Vamos configurá-la no Secret Manager:

#### Opção A: Via Firebase CLI (Recomendado)

```bash
firebase functions:secrets:set GEMINI_API_KEY
# Cole sua Gemini API Key quando solicitado
```

#### Opção B: Via Google Cloud Console

1. Acesse [Secret Manager](https://console.cloud.google.com/security/secret-manager)
2. Clique em **Create Secret**
3. Nome: `GEMINI_API_KEY`
4. Valor: Sua Gemini API Key
5. Clique em **Create**

## 📦 Instalar Dependências

### Frontend

```bash
npm install
```

### Cloud Functions

```bash
cd functions
npm install
cd ..
```

## 🔑 Autenticar Firebase CLI

```bash
firebase login
```

Isso abrirá o navegador para autenticação com sua conta Google.

## 🎯 Configurar Projeto Firebase

### 1. Inicializar Firebase no projeto

```bash
firebase use --add
```

- Selecione seu projeto Firebase da lista
- Apelido (alias): `default`

### 2. Verificar configuração

O arquivo `.firebaserc` deve estar assim:

```json
{
  "projects": {
    "default": "estomacare-ai"
  }
}
```

## 🧪 Testar Localmente

### 1. Rodar Emuladores Firebase (Opcional mas recomendado)

```bash
npm run firebase:emulators
```

Isso iniciará:
- Authentication Emulator (localhost:9099)
- Firestore Emulator (localhost:8080)
- Functions Emulator (localhost:5001)
- Storage Emulator (localhost:9199)
- Hosting Emulator (localhost:5000)

### 2. Rodar aplicação em modo desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🚀 Deploy para Produção

### Deploy Completo (Tudo de uma vez)

```bash
npm run firebase:deploy
```

Isso fará:
1. Build do frontend (`npm run build`)
2. Deploy do Hosting
3. Deploy das Cloud Functions
4. Deploy das regras do Firestore
5. Deploy das regras do Storage

### Deploy Seletivo

#### Apenas Hosting (Frontend)

```bash
npm run firebase:deploy:hosting
```

#### Apenas Cloud Functions (Backend)

```bash
npm run firebase:deploy:functions
```

#### Apenas Firestore Rules

```bash
npm run firebase:deploy:firestore
```

#### Apenas Storage Rules

```bash
npm run firebase:deploy:storage
```

## 🔒 Configurar GitHub Secrets (CI/CD)

Para automatizar o deploy via GitHub Actions:

### 1. Gerar Service Account

```bash
firebase projects:list
firebase projects:service-accounts:create
```

Ou via Firebase Console:
1. Project Settings > Service Accounts
2. Clique em **Generate New Private Key**
3. Salve o arquivo JSON

### 2. Adicionar Secrets no GitHub

Vá em **Settings > Secrets and variables > Actions** do seu repositório:

| Secret Name | Valor |
|-------------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | Conteúdo completo do JSON do service account |
| `VITE_FIREBASE_API_KEY` | Seu Firebase API Key (da config do projeto) |
| `VITE_FIREBASE_AUTH_DOMAIN` | `seu-projeto.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | `seu-projeto.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |

### 3. Push para main = Deploy automático! 🎉

```bash
git add .
git commit -m "Configure Firebase deploy"
git push origin main
```

GitHub Actions irá:
✅ Build da aplicação  
✅ Deploy no Firebase Hosting  
✅ Deploy das Cloud Functions  
✅ Deploy das regras Firestore/Storage

## 🌐 Acessar Aplicação em Produção

Após o deploy, sua aplicação estará disponível em:

```
https://seu-projeto-firebase.web.app
```

Ou

```
https://seu-projeto-firebase.firebaseapp.com
```

## 📊 Monitoramento

### Ver logs das Cloud Functions

```bash
npm run functions:logs
```

Ou via Firebase Console: **Functions > Logs**

### Dashboard do Firebase

Acesse o [Firebase Console](https://console.firebase.google.com/) para:
- Ver analytics de uso
- Monitorar autenticações
- Ver queries do Firestore
- Acompanhar custos

## 💰 Custos Estimados

### Firebase Spark Plan (Grátis)
- ❌ **Não suporta Cloud Functions**

### Firebase Blaze Plan (Pay-as-you-go)

**Free Tier Mensal:**
- Cloud Functions: 2M invocações, 400K GB-segundos
- Hosting: 10 GB armazenamento, 360 MB/dia transferência
- Firestore: 50k leituras, 20k escritas, 1GB storage
- Storage: 5GB armazenamento, 1GB/dia download
- Authentication: Ilimitado

**Custo Incremental (após free tier):**
- Cloud Functions: ~$0.40 por milhão de invocações
- Firestore: $0.06 por 100k leituras
- Storage: $0.026/GB armazenamento

**Estimativa para 500 usuários ativos/mês:**
- **$0-20/mês** (provavelmente dentro do free tier)

**Estimativa para 5000 usuários ativos/mês:**
- **$30-80/mês**

## 🐛 Troubleshooting

### Erro: "Firebase CLI not found"

```bash
npm install -g firebase-tools
```

### Erro: "Insufficient permissions"

1. Verifique se está autenticado: `firebase login`
2. Verifique o projeto: `firebase projects:list`
3. Use o projeto correto: `firebase use seu-projeto-id`

### Erro: "Blaze Plan required for Cloud Functions"

Cloud Functions requerem o plano Blaze (billing habilitado):
1. Firebase Console > ⚙️ Settings > Usage and Billing
2. Clique em **Modify Plan**
3. Escolha **Blaze Plan**
4. Adicione método de pagamento

### Build falha com "process.env not defined"

Certifique-se que o `.env.local` existe e está preenchido corretamente.

### Cloud Functions não executam

1. Verifique os logs: `firebase functions:log`
2. Confirme que a `GEMINI_API_KEY` está no Secret Manager
3. Verifique o código da function em `functions/src/index.ts`

### Imagens não carregam

1. Verifique as regras do Storage em `storage.rules`
2. Confirme que o Storage está habilitado no Firebase Console
3. Veja os logs do navegador (F12) para erros de CORS

## 📚 Recursos Adicionais

- [Firebase Documentation](https://firebase.google.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `firebase functions:log`
2. Consulte o [Firebase Status](https://status.firebase.google.com/)
3. Abra uma issue no repositório GitHub

---

## ✅ Checklist Final

Antes do deploy em produção:

- [ ] `.env.local` criado e preenchido
- [ ] `GEMINI_API_KEY` configurada no Secret Manager
- [ ] Firebase Authentication habilitado (Email + Google)
- [ ] Cloud Firestore criado
- [ ] Cloud Storage habilitado
- [ ] Blaze Plan ativado
- [ ] Build local funciona: `npm run build`
- [ ] Testes locais OK: `npm run dev`
- [ ] GitHub Secrets configurados (se usar CI/CD)
- [ ] Primeiro deploy: `npm run firebase:deploy`
- [ ] Aplicação acessível na URL do Firebase
- [ ] Login funcionando
- [ ] Gemini AI respondendo (via Cloud Functions)
- [ ] Imagens fazendo upload no Storage

🎉 **Parabéns! Sua aplicação está no ar!**
