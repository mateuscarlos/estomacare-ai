import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import Dashboard from './Dashboard';
import { User } from '../types';
import { BrowserRouter } from 'react-router-dom';

// Mock Firebase module to prevent initialization errors
vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  functions: {},
  googleProvider: {},
  default: { // app
      name: '[DEFAULT]',
      options: {}
  }
}));

// Mock services
vi.mock('../services/firestoreService', () => ({
  getUserPatients: vi.fn().mockResolvedValue([
    { id: 'p1', userId: 'user1', name: 'Patient 1', age: 30, gender: 'M', comorbidities: [], photoUrl: '' }
  ]),
  createPatient: vi.fn(),
  getLesionsForPatients: vi.fn().mockResolvedValue([])
}));

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    logLogin: vi.fn(),
    setUser: vi.fn(),
    logPatientCreated: vi.fn(),
    logPatientUpdated: vi.fn(),
    logAISuggestionRequest: vi.fn(),
    logAISuggestionSuccess: vi.fn(),
    logAISuggestionError: vi.fn(),
    logImageAnalysis: vi.fn(),
    logImageAnalysisSuccess: vi.fn(),
    logImageAnalysisError: vi.fn()
  }
}));

const mockUser: User = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  specialty: 'Doctor'
};

describe('Dashboard', () => {
  it('renders stats and patient list', async () => {
    render(
      <BrowserRouter>
        <Dashboard user={mockUser} />
      </BrowserRouter>
    );

    // Wait for something inside StatCard to appear
    await screen.findByText(/Casos Críticos/i);

    // Check if stats are rendered (StatCard content)
    expect(screen.getByText(/Total de Pacientes/i)).toBeInTheDocument();
    expect(screen.getByText(/Lesões Ativas/i)).toBeInTheDocument();
    expect(screen.getByText(/Casos Críticos/i)).toBeInTheDocument();

    // Check if patient list is rendered
    expect(screen.getByText(/Patient 1/i)).toBeInTheDocument();
  });
});
