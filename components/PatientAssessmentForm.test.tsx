import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Ensure this is imported for DOM matchers
import PatientAssessmentForm from './PatientAssessmentForm';
import { Assessment } from '../types';

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
vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    logImageAnalysis: vi.fn(),
    logImageAnalysisSuccess: vi.fn(),
    logImageAnalysisError: vi.fn()
  }
}));

vi.mock('../services/firebaseGeminiService', () => ({
  analyzeWoundImage: vi.fn(),
}));

describe('PatientAssessmentForm', () => {
  it('renders correctly and submits data', async () => {
    const mockOnSave = vi.fn().mockResolvedValue(undefined);
    const mockOnCancel = vi.fn();

    render(
      <PatientAssessmentForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Check if form elements are present
    expect(screen.getByText(/Nova Avaliação Clínica/i)).toBeInTheDocument();
    expect(screen.getByText(/Salvar Avaliação/i)).toBeInTheDocument();

    // Fill in some data
    const painInput = screen.getByLabelText(/Nível de Dor/i);
    fireEvent.change(painInput, { target: { value: '5' } });

    // Submit
    const saveButton = screen.getByText(/Salvar Avaliação/i);
    fireEvent.click(saveButton);

    // Check if onSave was called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });

    // Check the data passed to onSave
    const savedData = mockOnSave.mock.calls[0][0];
    expect(savedData.painLevel).toBe(5);
  });
});
