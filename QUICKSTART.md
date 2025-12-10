# 🚀 Quick Start - EstomaCare AI

## Para novos desenvolvedores

Se você está começando do zero, siga estes passos:

### 1️⃣ Pré-requisitos

Certifique-se de ter instalado:
- [Node.js 20+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- Uma conta no [Google Cloud / Firebase](https://console.firebase.google.com/)

### 2️⃣ Clone o repositório

```bash
git clone https://github.com/mateuscarlos/estomacare-ai.git
cd estomacare-ai
```

### 3️⃣ Rode o script de setup

Este script interativo irá configurar tudo para você:

```bash
npm run setup
```

O script irá:
- ✅ Instalar Firebase CLI (se necessário)
- ✅ Criar o arquivo `.env.local`
- ✅ Autenticar no Firebase
- ✅ Selecionar o projeto Firebase
- ✅ Instalar todas as dependências
- ✅ Configurar a GEMINI_API_KEY no Secret Manager

### 4️⃣ Obter credenciais

#### Gemini API Key
1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em "Create API Key"
3. Copie a chave gerada

#### Firebase Config
1. Acesse: https://console.firebase.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em **Project Settings (⚙️)** > **General**
4. Em "Your apps", clique no ícone **Web** (`</>`)
5. Registre o app com nome "EstomaCare Web"
6. Copie os valores do `firebaseConfig`

### 5️⃣ Habilitar serviços Firebase

No [Firebase Console](https://console.firebase.google.com/):

1. **Authentication**
   - Vá em Authentication > Sign-in method
   - Habilite: **Email/Password** ✅
   - Habilite: **Google** ✅

2. **Cloud Firestore**
   - Vá em Firestore Database
   - Clique em "Create Database"
   - Escolha "Production mode"
   - Selecione região (ex: `us-central1`)

3. **Cloud Storage**
   - Vá em Storage
   - Clique em "Get Started"
   - Escolha "Production mode"
   - Use a mesma região do Firestore

4. **Cloud Functions** (Requer Billing)
   - Vá em Functions
   - Faça upgrade para **Blaze Plan** (pay-as-you-go)
   - Não se preocupe: tem free tier generoso (2M invocações/mês grátis)

### 6️⃣ Testar localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

Você deve conseguir:
- Ver a tela de login
- Criar uma conta
- Fazer login
- Ver o dashboard (vazio inicialmente)

### 7️⃣ Deploy para produção

```bash
npm run firebase:deploy
```

Aguarde alguns minutos. Sua aplicação estará em:
```
https://seu-projeto.web.app
```

## 🆘 Problemas comuns

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### "Insufficient permissions"
```bash
firebase login
firebase use --add
```

### "Blaze Plan required"
Cloud Functions requerem billing habilitado. Vá em:
**Firebase Console > Settings > Usage and Billing > Modify Plan**

### Build falha
```bash
rm -rf node_modules dist
npm install
npm run build
```

## 📚 Documentação completa

- **[DEPLOY.md](./DEPLOY.md)** - Guia detalhado de deploy
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - O que foi implementado
- **[README.md](./README.md)** - Visão geral do projeto

## 🎯 Checklist de produção

Antes de ir para produção:

- [ ] `.env.local` configurado localmente
- [ ] `GEMINI_API_KEY` no Secret Manager (não no código!)
- [ ] Authentication habilitado (Email + Google)
- [ ] Firestore criado
- [ ] Storage habilitado
- [ ] Blaze Plan ativo
- [ ] Build local funciona (`npm run build`)
- [ ] Deploy concluído
- [ ] Login funciona em produção
- [ ] IA respondendo via Cloud Functions

## 💡 Dicas

1. **Desenvolvimento local:** Use `npm run firebase:emulators` para testar sem gastar quota
2. **Logs:** Use `npm run functions:logs` para debug de Cloud Functions
3. **CI/CD:** Configure GitHub Secrets para deploy automático (veja DEPLOY.md)
4. **Custos:** Monitore uso no Firebase Console > Usage and Billing

---

**Precisa de ajuda?** Abra uma [Issue no GitHub](https://github.com/mateuscarlos/estomacare-ai/issues)
