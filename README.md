<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🏥 EstomaCare AI

Sistema inteligente de gestão clínica de feridas com análise por Inteligência Artificial, desenvolvido para profissionais de Estomaterapia.

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-8E75B2?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)

View your app in AI Studio: https://ai.studio/apps/drive/1kTEAo3dSK7JtrAx8IyOzwOVggnf6K1_c

## 🌟 Características

### 🤖 IA Integrada (Google Gemini)
- **Análise automática de imagens** de feridas usando visão computacional
- **Sugestões de tratamento personalizadas** baseadas em dados clínicos e visuais
- Preenchimento automático de formulários de avaliação
- Análise TIME (Tissue, Infection, Moisture, Edge) automatizada

### 👥 Gestão de Pacientes
- Cadastro completo de pacientes com comorbidades e alergias
- Histórico detalhado de avaliações e tratamentos
- Upload e armazenamento seguro de imagens de lesões
- Gráficos de evolução da ferida ao longo do tempo

### 🔐 Segurança e Privacidade
- Autenticação via Firebase (Email/Password e Google OAuth)
- Dados armazenados com criptografia no Cloud Firestore
- Regras de segurança granulares (LGPD compliant)
- API Keys protegidas via Cloud Functions (não expostas no frontend)
- Controle de acesso por usuário

### 📊 Relatórios
- Geração de relatórios clínicos em PDF
- Exportação de dados de avaliações
- Visualização gráfica da evolução

## 🛠️ Tecnologias

**Frontend:** React 19, TypeScript, Vite, TailwindCSS, React Router 7  
**Backend:** Firebase (Auth, Firestore, Storage, Functions, Hosting)  
**IA:** Google Gemini AI (gemini-2.5-flash, gemini-3-pro-preview)

## 🚀 Começando

### Pré-requisitos

- Node.js 20+
- Conta Google (para Firebase)
- Gemini API Key ([Obter aqui](https://aistudio.google.com/app/apikey))

### Instalação Local

1. **Clone o repositório:**
```bash
git clone https://github.com/mateuscarlos/estomacare-ai.git
cd estomacare-ai
```

2. **Instale as dependências:**
```bash
npm install
cd functions && npm install && cd ..
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.local.example .env.local
# Edite .env.local com suas credenciais Firebase e Gemini API Key
```

4. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

Acesse: http://localhost:3000

## 📦 Deploy em Produção

📖 **Guia completo de deploy:** [DEPLOY.md](./DEPLOY.md)

### Deploy Rápido

```bash
# 1. Autentique-se no Firebase
firebase login

# 2. Configure a GEMINI_API_KEY no Secret Manager (seguro!)
firebase functions:secrets:set GEMINI_API_KEY

# 3. Deploy completo
npm run firebase:deploy
```

## 📂 Estrutura do Projeto

```
estomacare-ai/
├── components/              # Componentes React
├── services/                # Integrações (Firebase, Gemini AI)
├── functions/src/           # Cloud Functions (Backend serverless)
├── firebase.ts              # Configuração Firebase SDK
├── types.ts                 # Tipos TypeScript
├── firebase.json            # Config Firebase
├── firestore.rules          # Regras de segurança Firestore
└── .github/workflows/       # CI/CD automático
```

## 🔒 Segurança

✅ **API Key protegida no Secret Manager** (não exposta no frontend)  
✅ **Autenticação robusta** via Firebase Auth  
✅ **Regras Firestore** - Usuários só acessam seus dados  
✅ **HTTPS obrigatório** em todas as conexões  
✅ **Conformidade LGPG/HIPAA** - Dados médicos protegidos

## 💰 Custo Estimado (Firebase Blaze Plan)

**Free Tier:** 2M invocações/mês, 50k leituras Firestore, 1GB Storage  
**500 usuários ativos:** $0-20/mês (dentro do free tier)  
**5000 usuários ativos:** $30-80/mês

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra um Pull Request.

## 📝 Licença

MIT License - veja [LICENSE](LICENSE)

## 👨‍💻 Autor

**Mateus Carlos** - [@mateuscarlos](https://github.com/mateuscarlos)

---

Feito com ❤️ para profissionais de Estomaterapia
