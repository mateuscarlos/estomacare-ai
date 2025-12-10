// Firebase Cloud Functions wrapper for Gemini API
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { Lesion, Assessment, TreatmentSuggestion } from '../types';

// Cloud Functions callable references
const getTreatmentSuggestionCallable = httpsCallable(functions, 'getTreatmentSuggestion');
const analyzeWoundImageCallable = httpsCallable(functions, 'analyzeWoundImage');

/**
 * Get treatment suggestion using Cloud Function (secure - API key hidden)
 */
export const getTreatmentSuggestion = async (
  lesion: Lesion,
  currentAssessment: Assessment,
  patientInfo?: string
): Promise<TreatmentSuggestion> => {
  try {
    const result = await getTreatmentSuggestionCallable({
      lesion,
      currentAssessment,
      patientInfo
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
    }
    
    throw new Error(error.message || 'Erro ao obter sugestão de tratamento.');
  }
};

/**
 * Analyze wound image using Cloud Function (secure - API key hidden)
 */
export const analyzeWoundImage = async (base64ImageUrl: string): Promise<Partial<Assessment>> => {
  try {
    const result = await analyzeWoundImageCallable({
      base64ImageUrl
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
    }
    
    throw new Error(error.message || 'Erro ao analisar imagem.');
  }
};
