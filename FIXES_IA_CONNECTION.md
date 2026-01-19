# Correções de Erros de Conexão com IA

## Problema Identificado
A aplicação estava apresentando erros 500 e 503 ao tentar conectar com o serviço de IA (Gemini), com mensagens de erro:
- "Erro ao conectar com a IA. Verifique sua chave API."
- "The model is overloaded. Please try again later."
- "FirebaseError: Failed to get treatment suggestion"

## Soluções Implementadas

### 1. **Retry Logic com Exponential Backoff**

#### No Cliente (`services/firebaseGeminiService.ts`)
- ✅ Implementada função `retryWithBackoff` que tenta até 3 vezes antes de falhar
- ✅ Delay exponencial: 1s → 2s → 4s (com jitter de 30%)
- ✅ Timeout aumentado para 120 segundos nas chamadas callable
- ✅ Só tenta novamente em erros recuperáveis (503, 500, overloaded)
- ✅ Erros de autenticação/permissão falham imediatamente (sem retry)

#### No Servidor (`functions/src/index.ts`)
- ✅ Retry logic nas duas Cloud Functions: `getTreatmentSuggestion` e `analyzeWoundImage`
- ✅ Até 3 tentativas com delays de 2s → 4s → 8s
- ✅ Logging detalhado de cada tentativa para monitoramento

### 2. **Mensagens de Erro Melhoradas**

Erros agora são mais específicos e em português:

| Erro Anterior | Erro Novo |
|--------------|-----------|
| "Erro ao conectar com a IA" | "O serviço de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes." |
| Generic error | "Tempo limite excedido ao processar sua solicitação. Por favor, tente novamente." |
| Generic error | "Limite de requisições atingido. Por favor, aguarde alguns instantes antes de tentar novamente." |

### 3. **Tratamento de Erros Específicos**

Agora tratamos os seguintes códigos de erro HTTP específicos:
- **503 (UNAVAILABLE)**: Serviço sobrecarregado - mensagem amigável ao usuário
- **429 (RESOURCE_EXHAUSTED)**: Rate limit atingido - solicita aguardar
- **504 (DEADLINE_EXCEEDED)**: Timeout - sugere tentar novamente
- **401 (UNAUTHENTICATED)**: Problema de autenticação - falha imediatamente
- **403 (PERMISSION_DENIED)**: Sem permissão - falha imediatamente

### 4. **Configurações de Timeout**

- Client-side callable: 120 segundos
- Server-side Cloud Function: 60 segundos
- Memória: 512MiB para tratamento, 1GiB para análise de imagem

## Fluxo de Retry

```
Tentativa 1 → Falha (503)
  ↓ aguarda ~2s
Tentativa 2 → Falha (503)
  ↓ aguarda ~4s
Tentativa 3 → Falha (503)
  ↓ aguarda ~8s
Tentativa 4 (última) → Retorna erro amigável ao usuário
```

## Benefícios

1. **Resiliência**: Sistema agora tolera falhas temporárias da API
2. **Experiência do Usuário**: Mensagens claras e em português
3. **Monitoramento**: Logs detalhados para debug
4. **Performance**: Exponential backoff evita sobrecarregar ainda mais o serviço
5. **Custo**: Evita cobranças desnecessárias falhando rápido em erros não recuperáveis

## Como Testar

1. Deploy já foi realizado com sucesso
2. Acesse a aplicação e tente obter sugestão de tratamento
3. Se o erro 503 ocorrer, o sistema tentará automaticamente 3 vezes
4. Você verá mensagens no console do tipo: "Tentativa 1/3 falhou. Tentando novamente em 2000ms..."

## Próximos Passos (Opcional)

- [ ] Adicionar fallback cache para sugestões anteriores
- [ ] Implementar queue system para processar requisições em segundo plano
- [ ] Adicionar circuit breaker para evitar cascata de falhas
- [ ] Considerar modelo local como fallback

## Arquivos Modificados

1. [`services/firebaseGeminiService.ts`](services/firebaseGeminiService.ts) - Cliente
2. [`functions/src/index.ts`](functions/src/index.ts) - Servidor
