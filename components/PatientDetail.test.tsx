import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import PatientDetail from './PatientDetail';
import { User, Lesion, Patient } from '../types';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as firestoreService from '../services/firestoreService';

// Mock Firebase
vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  functions: {},
  googleProvider: {},
  default: {
      name: '[DEFAULT]',
      options: {}
  }
}));

const mockPatient: Patient = {
  id: 'p1',
  userId: 'user1',
  name: 'Patient 1',
  age: 30,
  gender: 'M',
  comorbidities: [],
  photoUrl: '',
  weightKg: 70,
  address: 'Test Addr',
  nutritionalStatus: 'Bom',
  mobility: 'Boa',
  smoker: false,
  alcohol: false,
  medications: ''
};

const mockLesion1: Lesion = {
  id: 'l1',
  patientId: 'p1',
  type: 'Pressure Ulcer' as any,
  location: 'Heel',
  startDate: '2023-01-01',
  assessments: [],
};

const mockLesion2: Lesion = {
  id: 'l2',
  patientId: 'p1',
  type: 'Diabetic Foot' as any,
  location: 'Toe',
  startDate: '2023-01-02',
  assessments: [],
};

// Mock services with factory
vi.mock('../services/firestoreService', () => ({
  getPatient: vi.fn(),
  getPatientLesions: vi.fn(),
  getLesionAssessments: vi.fn(),
  createLesion: vi.fn(),
  updatePatient: vi.fn(),
  updateAssessment: vi.fn(),
  addAssessment: vi.fn(),
}));

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    logAISuggestionRequest: vi.fn(),
    logAISuggestionSuccess: vi.fn(),
    logAISuggestionError: vi.fn(),
    logImageAnalysis: vi.fn(),
    logImageAnalysisSuccess: vi.fn(),
    logImageAnalysisError: vi.fn(),
    logPatientUpdated: vi.fn()
  }
}));
vi.mock('../services/firebaseGeminiService');
vi.mock('../services/pdfService');

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div></div>,
  XAxis: () => <div></div>,
  YAxis: () => <div></div>,
  CartesianGrid: () => <div></div>,
  Tooltip: () => <div></div>,
}));

const mockUser: User = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  specialty: 'Doctor'
};

describe('PatientDetail Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(firestoreService.getPatient).mockResolvedValue(mockPatient);
    vi.mocked(firestoreService.getPatientLesions).mockResolvedValue([mockLesion1, mockLesion2]);
    vi.mocked(firestoreService.getLesionAssessments).mockResolvedValue([]);
  });

  it('avoids re-fetching assessments for previously loaded lesions', async () => {
    render(
      <MemoryRouter initialEntries={['/patients/p1']}>
        <Routes>
          <Route path="/patients/:id" element={<PatientDetail user={mockUser} />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify patient name appears (wait for loading to finish)
    await screen.findByText('Patient 1', {}, { timeout: 3000 });

    // Verify lesions appear (might take a moment after patient load)
    await waitFor(() => {
        const heels = screen.getAllByText('Heel');
        expect(heels.length).toBeGreaterThan(0);
        const toes = screen.getAllByText('Toe');
        expect(toes.length).toBeGreaterThan(0);
    });

    // Initial state: Lesion 1 is active (default)
    // getLesionAssessments should have been called for l1
    await waitFor(() => {
        expect(firestoreService.getLesionAssessments).toHaveBeenCalledWith('l1');
    });

    // Click Lesion 2 (Find the button in the sidebar)
    // Sidebar buttons have text 'Toe'
    const toes = screen.getAllByText('Toe');
    // Assuming the one in sidebar is clickable. Both might be visible.
    // The sidebar one is likely the first or second.
    // Let's click the first one.
    fireEvent.click(toes[0]);

    // Should fetch for l2
    await waitFor(() => {
        expect(firestoreService.getLesionAssessments).toHaveBeenCalledWith('l2');
    });

    // Reset mocks to verify no further calls
    vi.mocked(firestoreService.getLesionAssessments).mockClear();

    // Click Lesion 1 again
    const heels = screen.getAllByText('Heel');
    fireEvent.click(heels[0]);

    // Should NOT fetch for l1 again (optimized)
    await waitFor(() => {
        expect(firestoreService.getLesionAssessments).not.toHaveBeenCalled();
    });
  });
});
