
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import PatientDetail from './PatientDetail';
import * as firestoreService from '../services/firestoreService';

// Mock dependencies
vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  functions: {},
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'patient-1' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../services/firebaseGeminiService', () => ({
  getTreatmentSuggestion: vi.fn(),
  analyzeWoundImage: vi.fn(),
}));

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    logAISuggestionRequest: vi.fn(),
    logAISuggestionSuccess: vi.fn(),
    logAISuggestionError: vi.fn(),
    logImageAnalysis: vi.fn(),
    logImageAnalysisSuccess: vi.fn(),
    logImageAnalysisError: vi.fn(),
  }
}));

vi.mock('../services/pdfService', () => ({
  generateLesionPDF: vi.fn(),
}));

vi.mock('../services/storageService', () => ({
  uploadPatientImage: vi.fn(),
  uploadLesionImage: vi.fn(),
  deleteLesionImage: vi.fn(),
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: () => <div>LineChart</div>,
  Line: () => <div>Line</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  Tooltip: () => <div>Tooltip</div>,
}));

// Mock firestoreService
vi.mock('../services/firestoreService', () => ({
  getPatient: vi.fn(),
  updatePatient: vi.fn(),
  getPatientLesions: vi.fn(),
  createLesion: vi.fn(),
  updateLesion: vi.fn(),
  deleteLesion: vi.fn(),
  addAssessment: vi.fn(),
  updateAssessment: vi.fn(),
  getLesionAssessments: vi.fn(),
}));

// Mock console.error
vi.spyOn(console, 'error').mockImplementation(() => {});

const mockUser = {
  id: 'user-1',
  name: 'Dr. Bolt',
  email: 'bolt@example.com'
};

const mockPatient = {
  id: 'patient-1',
  userId: 'user-1',
  name: 'Test Patient',
  age: 50,
  gender: 'M',
  comorbidities: [],
  photoUrl: 'http://example.com/photo.jpg',
  createdAt: 0,
  updatedAt: 0,
};

const mockLesions = [
  {
    id: 'lesion-1',
    patientId: 'patient-1',
    type: 'Úlcera por Pressão',
    location: 'Heel',
    startDate: '2024-01-01',
    assessments: [], // Initial load usually has empty/partial assessments
    latestAssessment: null
  },
  {
    id: 'lesion-2',
    patientId: 'patient-1',
    type: 'Úlcera Venosa',
    location: 'Leg',
    startDate: '2024-01-02',
    assessments: [],
    latestAssessment: null
  }
];

const mockAssessments = [
  { id: 'assess-1', date: '2024-01-01T10:00:00Z', painLevel: 5, tissueTypes: {}, infectionSigns: [], woundEdges: [], periwoundSkin: [] }
];

describe('PatientDetail Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (firestoreService.getPatient as any).mockResolvedValue(mockPatient);
    (firestoreService.getPatientLesions as any).mockResolvedValue(mockLesions);
    (firestoreService.getLesionAssessments as any).mockResolvedValue(mockAssessments);
  });

  it('fetches assessments only once per lesion (cached)', async () => {
    render(<PatientDetail user={mockUser} />);

    // Wait for patient and lesions to load
    await screen.findByText('Test Patient');
    await screen.findByRole('button', { name: /Heel/i }); // Lesion 1
    await screen.findByRole('button', { name: /Leg/i }); // Lesion 2

    // Initially, Lesion 1 is selected automatically (first in list)
    // getLesionAssessments should be called for Lesion 1
    await waitFor(() => {
        expect(firestoreService.getLesionAssessments).toHaveBeenCalledWith('lesion-1');
    });

    // Click on Lesion 2
    const lesion2Button = screen.getByText('Leg');
    fireEvent.click(lesion2Button);

    // Should fetch for Lesion 2
    await waitFor(() => {
        expect(firestoreService.getLesionAssessments).toHaveBeenCalledWith('lesion-2');
    });

    // Click back on Lesion 1
    const lesion1Button = screen.getByText('Heel');
    fireEvent.click(lesion1Button);

    // Should NOT fetch for Lesion 1 again (cached)
    await waitFor(() => {
        // Total calls: Lesion 1 (init), Lesion 2. Lesion 1 again uses cache.
        expect(firestoreService.getLesionAssessments).toHaveBeenCalledTimes(2);
    });
  });
});
