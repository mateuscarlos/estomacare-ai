#!/usr/bin/env node

/**
 * Script de configuração inicial do EstomaCare AI
 * Este script ajuda a configurar o projeto Firebase
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🏥 EstomaCare AI - Setup Wizard\n');
  console.log('Este script irá ajudá-lo a configurar o projeto para deploy.\n');

  // Check if firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('❌ Firebase CLI não encontrado.');
    console.log('📦 Instalando Firebase CLI...\n');
    try {
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
      console.log('✅ Firebase CLI instalado com sucesso!\n');
    } catch (installError) {
      console.error('❌ Erro ao instalar Firebase CLI. Por favor, instale manualmente:');
      console.error('   npm install -g firebase-tools\n');
      process.exit(1);
    }
  }

  console.log('✅ Firebase CLI encontrado\n');

  // Check if .env.local exists
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('📝 Criando arquivo .env.local...\n');
    
    console.log('Para obter suas credenciais Firebase:');
    console.log('1. Acesse: https://console.firebase.google.com/');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá em Project Settings (⚙️) > General');
    console.log('4. Scroll até "Your apps" e clique no ícone Web (</>)');
    console.log('5. Copie os valores do firebaseConfig\n');

    const geminiKey = await question('Cole sua GEMINI_API_KEY: ');
    const apiKey = await question('Cole VITE_FIREBASE_API_KEY: ');
    const authDomain = await question('Cole VITE_FIREBASE_AUTH_DOMAIN: ');
    const projectId = await question('Cole VITE_FIREBASE_PROJECT_ID: ');
    const storageBucket = await question('Cole VITE_FIREBASE_STORAGE_BUCKET: ');
    const messagingSenderId = await question('Cole VITE_FIREBASE_MESSAGING_SENDER_ID: ');
    const appId = await question('Cole VITE_FIREBASE_APP_ID: ');

    const envContent = `# Gemini API Key (for local development only)
GEMINI_API_KEY=${geminiKey}

# Firebase Configuration
VITE_FIREBASE_API_KEY=${apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${authDomain}
VITE_FIREBASE_PROJECT_ID=${projectId}
VITE_FIREBASE_STORAGE_BUCKET=${storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
VITE_FIREBASE_APP_ID=${appId}
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Arquivo .env.local criado com sucesso!\n');
  } else {
    console.log('✅ Arquivo .env.local já existe\n');
  }

  // Check if user is logged in to Firebase
  console.log('🔐 Verificando autenticação Firebase...\n');
  try {
    execSync('firebase projects:list', { stdio: 'ignore' });
    console.log('✅ Você já está autenticado no Firebase\n');
  } catch (error) {
    console.log('❌ Você não está autenticado no Firebase');
    const shouldLogin = await question('Deseja fazer login agora? (s/n): ');
    
    if (shouldLogin.toLowerCase() === 's') {
      console.log('🔓 Abrindo navegador para autenticação...\n');
      try {
        execSync('firebase login', { stdio: 'inherit' });
        console.log('✅ Autenticação concluída!\n');
      } catch (loginError) {
        console.error('❌ Erro ao fazer login. Tente manualmente: firebase login\n');
      }
    }
  }

  // Select Firebase project
  console.log('📂 Configurando projeto Firebase...\n');
  const shouldSetProject = await question('Deseja selecionar um projeto Firebase agora? (s/n): ');
  
  if (shouldSetProject.toLowerCase() === 's') {
    console.log('📋 Listando projetos disponíveis...\n');
    try {
      execSync('firebase use --add', { stdio: 'inherit' });
      console.log('✅ Projeto configurado!\n');
    } catch (error) {
      console.error('❌ Erro ao configurar projeto. Tente manualmente: firebase use --add\n');
    }
  }

  // Install dependencies
  console.log('📦 Instalando dependências...\n');
  const shouldInstall = await question('Deseja instalar as dependências agora? (s/n): ');
  
  if (shouldInstall.toLowerCase() === 's') {
    console.log('📥 Instalando dependências do frontend...\n');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependências do frontend instaladas!\n');
    } catch (error) {
      console.error('❌ Erro ao instalar dependências do frontend\n');
    }

    console.log('📥 Instalando dependências das Cloud Functions...\n');
    try {
      execSync('cd functions && npm install', { stdio: 'inherit', shell: true });
      console.log('✅ Dependências das Cloud Functions instaladas!\n');
    } catch (error) {
      console.error('❌ Erro ao instalar dependências das Cloud Functions\n');
    }
  }

  // Configure Secret Manager
  console.log('🔐 Configurando Secret Manager para Cloud Functions...\n');
  console.log('⚠️  IMPORTANTE: A GEMINI_API_KEY deve estar no Secret Manager,');
  console.log('    não no código, para segurança em produção.\n');
  
  const shouldSetSecret = await question('Deseja configurar GEMINI_API_KEY no Secret Manager agora? (s/n): ');
  
  if (shouldSetSecret.toLowerCase() === 's') {
    console.log('📝 Configurando secret...\n');
    try {
      execSync('firebase functions:secrets:set GEMINI_API_KEY', { stdio: 'inherit' });
      console.log('✅ Secret configurado com sucesso!\n');
    } catch (error) {
      console.error('❌ Erro ao configurar secret. Tente manualmente:\n');
      console.error('   firebase functions:secrets:set GEMINI_API_KEY\n');
    }
  }

  console.log('\n✅ Setup concluído!\n');
  console.log('📚 Próximos passos:\n');
  console.log('1. Verifique se o Firebase Authentication está habilitado:');
  console.log('   - Email/Password');
  console.log('   - Google OAuth\n');
  console.log('2. Verifique se o Cloud Firestore está criado\n');
  console.log('3. Verifique se o Cloud Storage está habilitado\n');
  console.log('4. Execute localmente: npm run dev\n');
  console.log('5. Faça o deploy: npm run firebase:deploy\n');
  console.log('📖 Consulte DEPLOY.md para mais detalhes.\n');

  rl.close();
}

main().catch(error => {
  console.error('❌ Erro durante o setup:', error);
  rl.close();
  process.exit(1);
});
