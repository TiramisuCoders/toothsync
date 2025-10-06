jest.mock('../../../app/login/actions', () => ({
  loginAction: jest.fn(async (email, password) => ({ error: null })),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChiefOfClinicianLoginPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/app/login/actions', () => ({
  loginAction: jest.fn(async (email, password) => ({ error: null })),
}));

describe('ChiefOfClinicianLoginPage', () => {
  it('renders login form and elements', () => {
    render(<ChiefOfClinicianLoginPage />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error if email not registered', async () => {
    const { loginAction } = require('@/app/login/actions');
    loginAction.mockImplementationOnce(async () => ({ error: { message: 'Email not registered' } }));

    render(<ChiefOfClinicianLoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Email not registered')).toBeInTheDocument();
    });
  });

  it('calls router push on successful login', async () => {
    const { loginAction } = require('@/app/login/actions');
    const mockPush = jest.fn();
    jest.mock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
      }),
    }));

    loginAction.mockImplementationOnce(async () => ({ error: null }));

    render(<ChiefOfClinicianLoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'good@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/chief-of-clinicians');
    });
  });
});
