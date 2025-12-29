// Firebase Cloud Functions wrapper for Gemini API
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { Lesion, Assessment, TreatmentSuggestion } from '../types';

// Cloud Functions callable references
const getTreatmentSuggestionCallable = httpsCallable(functions, 'getTreatmentSuggestion', {
  timeout: 120000 // 120 seconds
});
const analyzeWoundImageCallable = httpsCallable(functions, 'analyzeWoundImage', {
  timeout: 120000 // 120 seconds
});

/**
 * Utility function for retry with exponential backoff
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on authentication or permission errors
      if (
        error.code === 'unauthenticated' ||
        error.code === 'permission-denied' ||
        error.code === 'invalid-argument' ||
        error.code === 'failed-precondition'
      ) {
        throw error;
      }
      
      // Only retry on specific retryable errors
      const isRetryable = 
        error.code === 'unavailable' ||
        error.code === 'deadline-exceeded' ||
        error.code === 'resource-exhausted' ||
        error.code === 'internal' ||
        error.message?.includes('overloaded') ||
        error.message?.includes('503') ||
        error.message?.includes('500');
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
      const delay = exponentialDelay + jitter;
      
      console.log(`Tentativa ${attempt + 1}/${maxRetries} falhou. Tentando novamente em ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Get treatment suggestion using Cloud Function (secure - API key hidden)
 */
export const getTreatmentSuggestion = async (
  lesion: Lesion,
  currentAssessment: Assessment,
  patientInfo?: string
): Promise<TreatmentSuggestion> => {
  try {
    const result = await retryWithBackoff(async () => {
      return await getTreatmentSuggestionCallable({
        lesion,
        currentAssessment,
        patientInfo
      });
    });
    
    return result.data as TreatmentSuggestion;
  } catch (error: any) {
    console.error('Error calling getTreatmentSuggestion:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'unauthenticated') {
      throw new Error('Você precisa estar autenticado para obter sugestões de tratamento.');
    } else if (error.code === 'permission-denied') {
      throw new Error('Você não tem permissão para acessar este recurso.');
    } else if (error.code === 'failed-precondition') {
      throw new Error('Serviço de IA não configurado. Contate o administrador.');
    } else if (error.code === 'unavailable' || error.message?.includes('overloaded')) {
      throw new Error('O serviço de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.');
    } else if (error.code === 'deadline-exceeded') {
      throw new Error('Tempo limite excedido ao processar sua solicitação. Por favor, tente novamente.');
    } else if (error.code === 'resource-exhausted') {
      throw new Error('Limite de requisições atingido. Por favor, aguarde alguns instantes antes de tentar novamente.');
    }
    
    throw new Error(error.message || 'Erro ao obter sugestão de tratamento. Por favor, tente novamente.');
  }
};

/**
 * Analyze wound image using Cloud Function (secure - API key hidden)
 */
export const analyzeWoundImage = async (base64ImageUrl: string): Promise<Partial<Assessment>> => {
  try {
    const result = await retryWithBackoff(async () => {
      return await analyzeWoundImageCallable({
        base64ImageUrl
      });
    });
    
    return result.data as Partial<Assessment>;
  } catch (error: any) {
    console.error('Error calling analyzeWoundImage:', error);
    
    if (error.code === 'unauthenticated') {
      throw new Error('Você precisa estar autenticado para analisar imagens.');
    } else if (error.code === 'permission-denied') {
      throw new Error('Você não tem permissão para acessar este recurso.');
    } else if (error.code === 'invalid-argument') {
      throw new Error('Formato de imagem inválido.');
    } else if (error.code === 'failed-precondition') {
      throw new Error('Serviço de IA não configurado. Contate o administrador.');
    } else if (error.code === 'unavailable' || error.message?.includes('overloaded')) {
      throw new Error('O serviço de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.');
    } else if (error.code === 'deadline-exceeded') {
      throw new Error('Tempo limite excedido ao processar a imagem. Por favor, tente novamente.');
    } else if (error.code === 'resource-exhausted') {
      throw new Error('Limite de requisições atingido. Por favor, aguarde alguns instantes antes de tentar novamente.');
    }
    
    throw new Error(error.message || 'Erro ao analisar imagem. Por favor, tente novamente.');
  }
};
