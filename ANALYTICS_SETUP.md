# 📊 Firebase Analytics - Configuração Completa

## ✅ Status da Integração

O Firebase Analytics foi **completamente integrado** na aplicação EstomaCare AI!

### Configuração Realizada

1. **Measurement ID**: `G-VL2WY1DQJ3`
2. **Property ID**: `516051095`
3. **Stream ID**: `1312072010`

## 📋 Eventos Rastreados

### Autenticação
- ✅ `login` - Login com email ou Google
- ✅ `sign_up` - Cadastro de novo usuário
- ✅ `setUser` - ID do usuário configurado

### Pacientes
- ✅ `patient_created` - Criação de novo paciente
- ✅ `patient_updated` - Atualização de dados do paciente
- ✅ `patient_deleted` - Exclusão de paciente

### Avaliações de Lesões
- ✅ `assessment_created` - Nova avaliação registrada

### Inteligência Artificial
- ✅ `ai_suggestion_requested` - Solicitação de sugestão de tratamento
- ✅ `ai_suggestion_success` - Sugestão gerada com sucesso
- ✅ `ai_suggestion_error` - Erro ao gerar sugestão
- ✅ `image_analyzed` - Análise de imagem iniciada
- ✅ `image_analysis_success` - Análise concluída com sucesso
- ✅ `image_analysis_error` - Erro na análise de imagem

### Outras Ações
- ✅ `pdf_exported` - Exportação de relatório em PDF
- ✅ `image_uploaded` - Upload de foto de ferida
- ✅ `search` - Busca por pacientes
- ✅ `page_view` - Visualização de páginas

## 📁 Arquivos Modificados

### Configuração Base
- [`firebase.ts`](firebase.ts) - Adicionado `measurementId` na config
- [`.env.example`](env.example) - Adicionada variável `VITE_FIREBASE_MEASUREMENT_ID`

### Serviços
- [`services/analyticsService.ts`](services/analyticsService.ts) - Serviço completo de analytics (já existia)

### Componentes Integrados
- [`components/Login.tsx`](components/Login.tsx) - Login tracking
- [`components/Register.tsx`](components/Register.tsx) - Signup tracking
- [`components/PatientFormModal.tsx`](components/PatientFormModal.tsx) - Patient CRUD tracking
- [`components/PatientDetail.tsx`](components/PatientDetail.tsx) - AI e análise de imagem tracking

## 🔧 Configuração Local

Para usar o Analytics localmente, adicione ao seu arquivo `.env.local`:

```env
VITE_FIREBASE_MEASUREMENT_ID=G-VL2WY1DQJ3
```

## 📊 Como Visualizar os Dados

### 1. Firebase Console
Acesse: [Firebase Analytics](https://console.firebase.google.com/project/estomacare-ai/analytics)

### 2. Google Analytics
Acesse: [Google Analytics Property](https://analytics.google.com/analytics/web/#/p516051095/)

### 3. Eventos em Tempo Real
- Firebase Console → Analytics → Events → Visualizar em tempo real
- Veja eventos sendo disparados conforme usuários interagem

### 4. Relatórios Customizados

#### Uso da IA
```
Evento: ai_suggestion_requested
Métrica: Contagem de eventos
Dimensão: lesion_type
```

#### Taxa de Sucesso da IA
```
Eventos: ai_suggestion_success vs ai_suggestion_error
Métrica: Taxa de conversão
```

#### Análise de Imagens
```
Evento: image_analysis_success
Métrica: Contagem + tempo médio
```

## 🎯 Próximos Passos

### Eventos Adicionais Sugeridos

```typescript
// Métricas de performance
analyticsService.logPerformance('page_load_time', 1500);

// Erros da aplicação
analyticsService.logError('firestore_timeout', 'Timeout ao buscar pacientes');

// Engajamento
analyticsService.logEngagement('session_duration', 300); // 5 minutos

// Conversão
analyticsService.logConversion('treatment_applied', lesionType);
```

### Dashboards Recomendados

1. **Dashboard de Uso da IA**
   - Total de requisições
   - Taxa de sucesso vs erro
   - Tipos de lesões mais analisadas
   - Tempo médio de resposta

2. **Dashboard de Pacientes**
   - Total de pacientes cadastrados
   - Média de avaliações por paciente
   - Frequência de uso por profissional

3. **Dashboard de Engajamento**
   - Usuários ativos diários/mensais
   - Páginas mais visitadas
   - Tempo médio de sessão
   - Taxa de retenção

## 🔐 Privacidade e LGPD

O Analytics está configurado para:
- ✅ Não coletar dados pessoais identificáveis (PII)
- ✅ IPs anonimizados automaticamente
- ✅ Apenas métricas de uso e eventos
- ✅ Conformidade com LGPD/GDPR

### Dados NÃO Rastreados
- ❌ Nomes de pacientes
- ❌ Dados de saúde específicos
- ❌ Endereços completos
- ❌ Fotos de feridas
- ❌ Informações médicas sensíveis

### Dados Rastreados
- ✅ Tipos de ações (login, criar paciente, etc)
- ✅ Contagem de eventos
- ✅ Tipos genéricos (tipo de lesão: "Pé Diabético")
- ✅ Timestamps
- ✅ IDs anônimos de usuários

## 🚀 Testando o Analytics

### Modo Debug (Chrome)
```bash
# Instale a extensão Google Analytics Debugger
# https://chrome.google.com/webstore/detail/google-analytics-debugger/

# Abra o Console do navegador
# Veja eventos sendo disparados em tempo real
```

### DebugView no Firebase
1. Acesse Firebase Console → Analytics → DebugView
2. Adicione `?debug_mode=true` na URL da aplicação
3. Veja eventos em tempo real enquanto testa

## 📈 Métricas de Sucesso

### KPIs Principais
- **Adoção da IA**: % de avaliações que usam sugestão da IA
- **Precisão da IA**: Relação success/error nas requisições
- **Engajamento**: Pacientes cadastrados por usuário
- **Retenção**: Usuários que retornam após 7 dias

### Alertas Configurados
- 🔴 Taxa de erro da IA > 10%
- 🟡 Tempo de resposta > 30s
- 🟢 Taxa de sucesso > 95%

## 📞 Suporte

Para dúvidas sobre Analytics:
- Documentação: https://firebase.google.com/docs/analytics
- Console: https://console.firebase.google.com/project/estomacare-ai/analytics

---

**Deploy realizado em**: 11/12/2025
**Status**: ✅ Ativo e rastreando eventos
