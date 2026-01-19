
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

// Mock dependencies
vi.mock('../services/firebaseAuthService', () => ({
  authService: {
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
  }
}));

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    logLogin: vi.fn(),
    setUser: vi.fn(),
  }
}));

// Mock firebase to prevent init errors
vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  functions: {},
}));

describe('Login Component', () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login onLogin={mockOnLogin} />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Endereço de e-mail/i)).toBeInTheDocument();
    // Use selector option to ensure we get the input, not the button which also contains "senha" in aria-label
    expect(screen.getByLabelText('Senha', { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    render(
      <BrowserRouter>
        <Login onLogin={mockOnLogin} />
      </BrowserRouter>
    );

    // Specific selector for the password input
    const passwordInput = screen.getByLabelText('Senha', { selector: 'input' });
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByLabelText(/Mostrar senha/i);
    expect(toggleButton).toBeInTheDocument();

    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(toggleButton).toHaveAttribute('aria-label', 'Ocultar senha');

    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveAttribute('aria-label', 'Mostrar senha');
  });
});
