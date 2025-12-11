# GitHub Copilot Instructions - EstomaCare AI

## 📚 Contexto do Projeto

**EstomaCare AI** é um sistema de gestão clínica de feridas com IA para profissionais de Estomaterapia.

### Stack Tecnológica
- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS
- **Backend:** Firebase (Auth, Firestore, Storage, Functions, Hosting)
- **IA:** Google Gemini AI (gemini-2.0-flash-exp)
- **Runtime:** Node.js 20 LTS
- **CI/CD:** GitHub Actions

## 🏗️ Arquitetura

### Estrutura de Pastas
```
estomacare-ai/
├── components/          # Componentes React
│   ├── Dashboard.tsx
│   ├── PatientDetail.tsx
│   ├── PatientList.tsx
│   ├── PatientFormModal.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   └── Layout.tsx
├── services/           # Camada de serviços
│   ├── firebaseAuthService.ts    # Autenticação
│   ├── firestoreService.ts       # Database
│   ├── storageService.ts         # Armazenamento
│   ├── firebaseGeminiService.ts  # IA (client)
│   ├── pdfService.ts             # Geração de PDFs
│   ├── appCheckService.ts        # Firebase App Check
│   ├── analyticsService.ts       # Firebase Analytics
│   └── performanceService.ts     # Performance Monitoring
├── functions/src/      # Cloud Functions (Backend)
│   ├── index.ts        # Funções serverless
│   ├── middleware/     # Middleware (rate limiting, etc)
│   └── utils/          # Utilities (monitoring, logging)
├── firebase.ts         # Configuração Firebase SDK
├── types.ts           # Definições TypeScript
└── .github/workflows/ # CI/CD
```

### Firebase Collections (Firestore)

```typescript
// Collection: users
{
  id: string;          // Firebase UID
  name: string;
  email: string;
  specialty: string;
  createdAt: timestamp;
  updatedAt: timestamp;
}

// Collection: patients
{
  id: string;
  userId: string;      // Foreign key to users
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Outro';
  comorbidities: string[];
  allergies: string[];
  photoUrl: string;    // Firebase Storage URL
  createdAt: timestamp;
  updatedAt: timestamp;
}

// Collection: lesions
{
  id: string;
  patientId: string;   // Foreign key to patients
  type: 'PRESSURE_ULCER' | 'VENOUS_ULCER' | 'DIABETIC_FOOT' | 'SURGICAL' | 'TRAUMATIC' | 'STOMA';
  location: string;
  startDate: string;
  previousTreatments: string[];
  assessments: Assessment[];  // Array aninhado
  createdAt: timestamp;
  updatedAt: timestamp;
}

// Collection: rateLimits (interno)
{
  userId: string;      // Document ID
  requests: number[];  // Timestamps
  lastCleanup: timestamp;
}
```

## 🔐 Regras de Segurança

### Firestore Rules
- Usuários só acessam seus próprios dados
- Pacientes vinculados ao userId
- Lesões vinculadas ao patientId (que por sua vez está vinculado ao userId)
- Rate limits gerenciados internamente

### Storage Rules
- Uploads limitados a 10MB
- Apenas imagens (image/*)
- Path: `lesions/{userId}/{imageId}`

### Cloud Functions
- API Key do Gemini no Secret Manager (não exposta)
- Autenticação obrigatória via Firebase Auth
- Rate limiting: 100 req/min por usuário (tratamento), 50 req/min (análise de imagem)
- App Check habilitado

## 🎯 Princípios de Código

### 1. Sempre use Firebase SDK modular (v10+)
```typescript
// ✅ Correto
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// ❌ Errado
import firebase from 'firebase/app';
```

### 2. Sempre trate erros do Firebase
```typescript
try {
  await addDoc(collection(db, 'patients'), data);
} catch (error: any) {
  console.error('Error:', error);
  if (error.code === 'permission-denied') {
    throw new Error('Você não tem permissão');
  }
  throw new Error('Erro ao salvar');
}
```

### 3. Sempre valide dados antes do Firestore
```typescript
// ✅ Correto
const cleanData = JSON.parse(JSON.stringify(data));
await updateDoc(docRef, cleanData);

// ❌ Errado
await updateDoc(docRef, data); // Pode conter funções/undefined
```

### 4. Use TypeScript estritamente
```typescript
// ✅ Correto
const patient: Patient = {
  id: docRef.id,
  userId: currentUser.id,
  name: formData.name,
  // ...
};

// ❌ Errado
const patient: any = { ... };
```

### 5. Cloud Functions devem ser idempotentes
```typescript
// ✅ Correto - Pode ser chamado múltiplas vezes
export const getTreatmentSuggestion = onCall(async (request) => {
  const { lesion, assessment } = request.data;
  // Sempre retorna o mesmo resultado para os mesmos inputs
  return await callGeminiAPI(lesion, assessment);
});
```

### 6. Sempre use Performance Monitoring
```typescript
import { performanceService } from '../services/performanceService';

// Wrap operações assíncronas
const patients = await performanceService.measureAsync(
  'fetch_patients',
  () => getUserPatients(userId)
);
```

### 7. Sempre log eventos importantes
```typescript
import { analyticsService } from '../services/analyticsService';

// Log eventos de negócio
analyticsService.logPatientCreated();
analyticsService.logAISuggestionRequest();
```

## 🔒 Segurança CRÍTICA

### ❌ NUNCA faça isso:
1. Expor API keys no código frontend
2. Armazenar senhas em plain text
3. Fazer queries sem autenticação
4. Permitir uploads ilimitados
5. Retornar dados de outros usuários
6. Commitar `.env.local` no Git
7. Desabilitar App Check em produção

### ✅ SEMPRE faça isso:
1. Use Secret Manager para API keys
2. Valide autenticação em todas as requests
3. Implemente rate limiting
4. Sanitize inputs do usuário
5. Use HTTPS em produção
6. Habilite Firebase App Check
7. Log eventos de segurança

## 📝 Padrões de Código

### Nomenclatura
- **Componentes:** PascalCase (`PatientDetail.tsx`)
- **Funções:** camelCase (`getUserPatients()`)
- **Constantes:** UPPER_SNAKE_CASE (`GEMINI_API_KEY`)
- **Types/Interfaces:** PascalCase (`Patient`, `Lesion`)

### Estrutura de Função
```typescript
/**
 * Get all patients for a specific user
 * @param userId - The user ID
 * @returns Array of patients
 */
export const getUserPatients = async (userId: string): Promise<Patient[]> => {
  try {
    // Implementation
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw new Error('Erro ao carregar pacientes');
  }
};
```

### Estrutura de Componente React 19
```typescript
import { FC } from 'react';

interface Props {
  userId: string;
}

export const PatientList: FC<Props> = ({ userId }) => {
  // Use React 19 features (actions, transitions, etc)
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

## 🧪 Testes

### Usar Firebase Emulators
```bash
npm run firebase:emulators
```

### Testar Cloud Functions localmente
```bash
cd functions
npm run serve
```

### Testar App Check em desenvolvimento
```typescript
// Em firebase.ts
if (import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
```

## 🚀 Deploy

### Antes do deploy SEMPRE:
1. ✅ Testar localmente (`npm run dev`)
2. ✅ Build sem erros (`npm run build`)
3. ✅ Verificar `.env.local` configurado
4. ✅ GEMINI_API_KEY no Secret Manager
5. ✅ Firestore Rules atualizadas
6. ✅ App Check configurado
7. ✅ Git commit com mensagem descritiva

### Deploy Completo
```bash
npm run firebase:deploy
```

### Deploy Seletivo
```bash
# Apenas Functions
firebase deploy --only functions

# Apenas Firestore rules
firebase deploy --only firestore:rules

# Apenas Hosting
firebase deploy --only hosting
```

## 🔧 Troubleshooting

### Erro: "permission-denied"
- Verificar Firestore Rules
- Confirmar autenticação do usuário
- Verificar se userId está correto

### Erro: "CORS"
- Adicionar domínio em Firebase Console
- Verificar headers em `firebase.json`

### Erro: "Cloud Function timeout"
- Aumentar timeout em `functions/src/index.ts`
- Otimizar código da função
- Verificar cold start

### Erro: "Rate limit exceeded"
- Normal se usuário fez muitas requests
- Aguardar 1 minuto
- Ajustar limites se necessário em `rateLimiter.ts`

### Erro: "App Check token invalid"
- Verificar reCAPTCHA configurado
- Verificar domínio autorizado
- Usar debug token em desenvolvimento

## 📚 Referências

- [Firebase Docs](https://firebase.google.com/docs?hl=pt-br)
- [Google Cloud Docs](https://cloud.google.com/docs?hl=pt-br)
- [Gemini AI Docs](https://ai.google.dev/docs)
- [React 19 Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Node.js 20 LTS Docs](https://nodejs.org/docs/latest-v20.x/api/)

## 🎯 Roadmap

### Fase 1: Fundação ✅
- [x] Firebase Authentication
- [x] Firestore Database
- [x] Cloud Storage
- [x] Cloud Functions
- [x] Gemini AI Integration

### Fase 2: Segurança e Monitoramento ✅
- [x] Firestore Rules
- [x] Storage Rules
- [x] API Key no Secret Manager
- [x] Firebase App Check
- [x] Rate Limiting
- [x] Firebase Analytics
- [x] Performance Monitoring
- [x] Cloud Logging estruturado

### Fase 3: Performance (EM PROGRESSO)
- [x] Firestore Composite Indexes
- [ ] Image Optimization (WebP)
- [ ] Code Splitting avançado
- [ ] Service Workers para PWA
- [ ] Cloud CDN

### Fase 4: Compliance (PRÓXIMO)
- [ ] LGPD Compliance completo
- [ ] HIPAA Compliance
- [ ] Auditoria de acesso
- [ ] Backup automático (Cloud Scheduler)
- [ ] Disaster Recovery Plan
- [ ] Data Retention Policies

### Fase 5: Escalabilidade
- [ ] Multi-region deployment
- [ ] Caching com Cloud Memorystore
- [ ] Load Balancing
- [ ] Auto-scaling configurado

## 💡 Quando pedir ajuda ao Copilot:

### Para criar novos componentes:
"Criar componente React 19 TypeScript para [feature] seguindo os padrões do EstomaCare"

### Para criar serviços Firebase:
"Criar serviço para [ação] no Firestore seguindo os padrões de firebaseService com error handling"

### Para Cloud Functions:
"Criar Cloud Function v2 para [ação] com autenticação, rate limiting e monitoring"

### Para testes:
"Criar testes unitários para [componente/serviço] usando Firebase Emulators"

### Para otimização:
"Otimizar [componente/função] para melhor performance seguindo React 19 best practices"

## ⚠️ Avisos Importantes

1. **NUNCA** commite `.env.local` ou arquivos com credenciais
2. **SEMPRE** use Cloud Functions para chamadas à Gemini API
3. **SEMPRE** valide inputs do usuário
4. **SEMPRE** trate erros com mensagens amigáveis em português
5. **SEMPRE** teste localmente antes do deploy
6. **SEMPRE** use React 19 e Node 20 LTS
7. **SEMPRE** log eventos importantes para Analytics

## 🌟 Convenções de Commit

Use Conventional Commits:

```
feat: adiciona novo componente X
fix: corrige bug em Y
docs: atualiza documentação
style: formata código
refactor: refatora serviço Z
perf: melhora performance de W
test: adiciona testes para V
chore: atualiza dependências
```

---

**Última atualização:** 2025-12-11
**Versão:** 2.1.0
**Mantido por:** [@mateuscarlos](https://github.com/mateuscarlos)
