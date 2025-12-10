
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Lesion, Assessment, TreatmentSuggestion, TissuePercentage } from "../types";

const apiKey = process.env.API_KEY;

// Define the schema for the AI response (Treatment Suggestion)
const treatmentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    cleaning: {
      type: Type.STRING,
      description: "Recommended cleaning method and solution (e.g., Saline, PHMB).",
    },
    primaryDressing: {
      type: Type.STRING,
      description: "The main dressing to be applied in contact with the wound bed.",
    },
    secondaryDressing: {
      type: Type.STRING,
      description: "The secondary dressing to secure the primary or manage exudate.",
    },
    frequency: {
      type: Type.STRING,
      description: "How often the dressing should be changed.",
    },
    rationale: {
      type: Type.STRING,
      description: "Brief medical explanation for this choice based on tissue type, exudate and visual analysis.",
    },
  },
  required: ["cleaning", "primaryDressing", "secondaryDressing", "frequency", "rationale"],
};

// Define the schema for Image Analysis (Auto-fill form)
const imageAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tissueTypes: {
      type: Type.OBJECT,
      properties: {
        necrotic: { type: Type.NUMBER, description: "Percentage of necrotic tissue (black/brown)." },
        slough: { type: Type.NUMBER, description: "Percentage of slough (yellow/fibrous)." },
        granulation: { type: Type.NUMBER, description: "Percentage of granulation (red/pink)." },
        epithelialization: { type: Type.NUMBER, description: "Percentage of epithelial tissue (pink edges)." }
      },
      required: ["necrotic", "slough", "granulation", "epithelialization"]
    },
    exudate: {
      type: Type.STRING,
      description: "Level of exudate: 'Ausente/Seco', 'Baixo', 'Médio', or 'Alto'.",
      enum: ['Ausente/Seco', 'Baixo', 'Médio', 'Alto']
    },
    infectionSigns: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Visual signs of infection e.g., 'Eritema', 'Edema', 'Pus/Abscesso'.",
    },
    woundEdges: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Characteristics of edges e.g., 'Maceração', 'Epíbole (Enrolada)', 'Deslocamento'.",
    },
    periwoundSkin: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Characteristics of periwound skin e.g., 'Maceração', 'Escoriação', 'Xerose (Seca)', 'Hiperqueratose'.",
    },
    notes: {
      type: Type.STRING,
      description: "Short clinical observation summary based on the image.",
    }
  },
  required: ["tissueTypes", "exudate", "infectionSigns", "woundEdges", "periwoundSkin", "notes"]
};

export const getTreatmentSuggestion = async (
  lesion: Lesion,
  currentAssessment: Assessment,
  patientInfo?: string // Optional extra context about patient
): Promise<TreatmentSuggestion> => {
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construct the prompt with all detailed form data
  const promptText = `
    Atue como um Estomaterapeuta Especialista Sênior.
    Analise a IMAGEM (se fornecida) e os DADOS CLÍNICOS abaixo para sugerir o melhor tratamento (coberturas).

    === DADOS DO PACIENTE E CONTEXTO ===
    ${patientInfo || 'Não informado'}

    === DADOS DA LESÃO ATUAL ===
    - Tipo: ${lesion.type}
    - Localização: ${lesion.location}
    - Dimensões: ${currentAssessment.widthMm}mm x ${currentAssessment.heightMm}mm x ${currentAssessment.depthMm}mm
    - Túneis/Descolamento: ${currentAssessment.tunnelingMm || 0}mm

    === AVALIAÇÃO DO LEITO (TIME) ===
    - Tecido: Necrose ${currentAssessment.tissueTypes.necrotic}%, Esfacelo ${currentAssessment.tissueTypes.slough}%, Granulação ${currentAssessment.tissueTypes.granulation}%, Epitelização ${currentAssessment.tissueTypes.epithelialization}%
    - Infecção/Inflamação: ${currentAssessment.infectionSigns.join(', ') || 'Nenhum sinal evidente'}
    - Umidade (Exsudato): Nível ${currentAssessment.exudate}, Tipo ${currentAssessment.exudateType || 'Não especificado'}
    - Bordas (E): ${currentAssessment.woundEdges.join(', ') || 'Íntegras'}

    === PELE PERILESÃO ===
    - Características: ${currentAssessment.periwoundSkin.join(', ') || 'Íntegra'}

    DOR (0-10): ${currentAssessment.painLevel}
    OBSERVAÇÕES DA ENFERMAGEM: ${currentAssessment.notes}

    === INSTRUÇÕES PARA A IA ===
    1. ALERGIAS: Verifique rigorosamente a seção "Dados do Paciente". Se houver alergias listadas (ex: Prata, Iodo, Látex, Sulfa), NÃO sugira produtos que contenham esses componentes.
    2. HISTÓRICO: Considere os "Tratamentos Anteriores" listados no contexto. Se um tratamento anterior falhou, sugira uma alternativa ou justifique a manutenção com mudanças na frequência/aplicação.
    3. ANÁLISE VISUAL: Se houver imagem, utilize-a para confirmar a presença de biofilme, maceração ou necrose não relatada nos dados numéricos.
    4. PROTOCOLO: Forneça a sugestão de limpeza, cobertura primária, secundária e frequência.

    Responda estritamente no formato JSON solicitado.
  `;

  const parts: any[] = [{ text: promptText }];

  // If there is an image, add it to the payload
  if (currentAssessment.imageUrl) {
    // Extract base64 data from Data URL (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
    const base64Data = currentAssessment.imageUrl.split(',')[1];
    const mimeType = currentAssessment.imageUrl.split(';')[0].split(':')[1];

    if (base64Data && mimeType) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Good for multimodal inputs and logic
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: treatmentSchema,
        temperature: 0.3, 
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as TreatmentSuggestion;
  } catch (error) {
    console.error("Error fetching AI suggestion:", error);
    throw error;
  }
};

export const analyzeWoundImage = async (base64ImageUrl: string): Promise<Partial<Assessment>> => {
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  const base64Data = base64ImageUrl.split(',')[1];
  const mimeType = base64ImageUrl.split(';')[0].split(':')[1];

  if (!base64Data || !mimeType) {
    throw new Error("Invalid image format");
  }

  const promptText = `
    Analise esta imagem clínica de ferida.
    Identifique as características visualmente observáveis para preencher um formulário de avaliação.
    
    Estime as porcentagens de tipo de tecido (TIME - Tissue) que devem somar 100%.
    Estime o nível de exsudato (Umidade).
    Identifique sinais visuais de infecção (Vermelhidão/Eritema, Edema, etc).
    Identifique características das bordas e pele perilesão (Maceração, Hiperqueratose, etc).
    
    Responda APENAS com o JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // High reasoning model for image understanding
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          { text: promptText }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: imageAnalysisSchema,
        temperature: 0.1, // Low temp for precision
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI analysis");

    return JSON.parse(text) as Partial<Assessment>;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};
