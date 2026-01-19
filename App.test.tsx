
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';
import App from './App';
import * as firestoreService from './services/firestoreService';
import { authService } from './services/firebaseAuthService';

// Mock authService
vi.mock('./services/firebaseAuthService', () => {
  let authListener: (user: any) => void = () => {};
  return {
    authService: {
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      onAuthStateChanged: vi.fn((callback) => {
        authListener = callback;
        // Call immediately with null to simulate initial state
        callback(null);
        return () => {};
      }),
      triggerAuthStateChanged: (user: any) => {
        if (authListener) authListener(user);
      }
    }
  };
});

// Mock firestoreService
vi.mock('./services/firestoreService', () => ({
  getUserPatients: vi.fn(),
  createPatient: vi.fn(),
  updatePatient: vi.fn(),
  getPatient: vi.fn(),
  getPatientLesions: vi.fn(),
}));

// Mock analyticsService
vi.mock('./services/analyticsService', () => ({
  analyticsService: {
    logLogin: vi.fn(),
    setUser: vi.fn(),
    logPageView: vi.fn(),
  }
}));

// Mock firebase
vi.mock('./firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  functions: {},
}));

// Mock console.error to avoid noise
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('App Performance Reproduction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (console.error as any).mockClear();
  });

  it('fetches patients once on login', async () => {
    const user = {
      id: 'test-user-id',
      uid: 'test-user-id', // authService uses uid internally in some places
      name: 'Test User',
      email: 'test@example.com',
      specialty: 'Doctor'
    };

    // Setup mocks
    (authService.login as any).mockResolvedValue(user);
    (firestoreService.getUserPatients as any).mockResolvedValue([]);

    render(<App />);

    // Wait for login screen
    await waitFor(() => {
      expect(screen.getByText(/EstomaCare AI/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Endereço de e-mail/i)).toBeInTheDocument();
    });

    // Fill login form
    const emailInput = screen.getByLabelText(/Endereço de e-mail/i);
    const passwordInput = screen.getByLabelText(/Senha/i, { selector: 'input' });
    const loginButton = screen.getByRole('button', { name: /Entrar/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    // Trigger login
    await userEvent.click(loginButton);

    // After clicking login:
    // 1. authService.login is called.
    // 2. handleLogin is called (fetches patients).
    // 3. User is navigated to dashboard.
    // 4. Ideally, onAuthStateChanged also fires around this time.

    // Simulate auth state change
    (authService as any).triggerAuthStateChanged(user);

    // Wait for dashboard to appear
    await waitFor(() => {
      expect(screen.getByText('Visão Geral')).toBeInTheDocument();
    });

    // Wait a bit to ensure all effects have run
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify call count
    // With the fix, it should be 1.
    // Only from onAuthStateChanged.
    expect(firestoreService.getUserPatients).toHaveBeenCalledTimes(1);
  });
});
