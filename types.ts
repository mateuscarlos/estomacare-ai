
export enum LesionType {
  PRESSURE_ULCER = 'Úlcera por Pressão',
  VENOUS_ULCER = 'Úlcera Venosa',
  ARTERIAL_ULCER = 'Úlcera Arterial',
  DIABETIC_FOOT = 'Pé Diabético',
  SURGICAL_WOUND = 'Ferida Cirúrgica',
  STOMA = 'Estomia',
  TRAUMATIC = 'Traumática',
  OTHER = 'Outro'
}

export enum ExudateLevel {
  NONE = 'Ausente/Seco',
  LOW = 'Baixo',
  MODERATE = 'Médio',
  HIGH = 'Alto'
}

export enum ExudateType {
  SEROUS = 'Seroso (Fino/Aquoso)',
  TURBID = 'Turvo',
  PURULENT = 'Purulento (Espesso)',
  BLOODY = 'Sanguinolento',
  SEROSANGUINEOUS = 'Serossanguinolento (Rosa/Claro)'
}

export interface TissuePercentage {
  necrotic: number; // % Necrose
  slough: number;   // % Esfacelo
  granulation: number; // % Granulação
  epithelialization: number; // % Epitelização
}

export interface TreatmentSuggestion {
  cleaning: string;
  primaryDressing: string;
  secondaryDressing: string;
  frequency: string;
  rationale: string;
}

export interface Assessment {
  id: string;
  date: string;
  // Medidas
  widthMm: number;
  heightMm: number;
  depthMm: number;
  tunnelingMm?: number; // Descolamento/Túnel
  
  // Leito da Ferida
  exudate: ExudateLevel;
  exudateType?: ExudateType;
  tissueTypes: TissuePercentage;
  
  // Características Clínicas (Checkboxes do formulário)
  infectionSigns: string[]; // Calor, Odor, Edema, etc.
  woundEdges: string[]; // Maceração, Epíbole, Descolamento...
  periwoundSkin: string[]; // Maceração, Escoriação, Xerose...
  
  painLevel: number; // 0-10
  notes: string;
  imageUrl?: string;
  aiSuggestion?: TreatmentSuggestion;
}

export interface Lesion {
  id: string;
  patientId: string; // Foreign Key to Patient
  type: LesionType;
  location: string;
  startDate: string;
  previousTreatments?: string[]; // Histórico de tratamentos anteriores nesta lesão
  assessments: Assessment[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  specialty?: string;
}

export interface Patient {
  id: string;
  userId: string; // Foreign Key to User
  name: string;
  age: number;
  weightKg?: number;
  gender: 'M' | 'F' | 'Outro';
  address?: string; 
  
  // Dados Clínicos Gerais
  nutritionalStatus?: 'Bom' | 'Ruim';
  mobility?: 'Boa' | 'Baixa';
  
  // Hábitos
  smoker?: boolean;
  smokerAmount?: string; 
  alcohol?: boolean;
  alcoholAmount?: string; 
  
  allergies?: string[]; 
  comorbidities: string[];
  medications?: string;
  
  photoUrl: string;
}

// Mock Data Generators
// Now accepts a userId to link mock patients to the logged-in user
export const generateMockPatients = (userId: string = 'user1'): Patient[] => [
  {
    id: '1',
    userId: userId,
    name: 'Maria Silva',
    age: 68,
    weightKg: 72,
    gender: 'F',
    address: 'Rua das Flores, 123 - Centro',
    nutritionalStatus: 'Bom',
    mobility: 'Boa',
    smoker: false,
    alcohol: false,
    allergies: ['Látex', 'Sulfa'],
    comorbidities: ['Diabetes Tipo 2', 'Hipertensão'],
    photoUrl: 'https://picsum.photos/id/64/200/200'
  },
  {
    id: '2',
    userId: userId,
    name: 'João Santos',
    age: 75,
    gender: 'M',
    address: 'Av. Paulista, 1000 - Apt 42',
    weightKg: 85,
    nutritionalStatus: 'Ruim',
    mobility: 'Baixa',
    smoker: true,
    smokerAmount: '20 cigarros/dia',
    alcohol: true,
    alcoholAmount: '5 latas/semana',
    allergies: [],
    comorbidities: ['Insuficiência Venosa'],
    photoUrl: 'https://picsum.photos/id/91/200/200'
  }
];
