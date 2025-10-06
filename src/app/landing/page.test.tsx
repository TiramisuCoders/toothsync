jest.mock('next/navigation');
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from './page';

describe('LandingPage', () => {
  it('renders welcome message and instructions', () => {
    render(<LandingPage />);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Please select your role to continue')).toBeInTheDocument();
  });

  it('opens help modal when Help button clicked', () => {
    render(<LandingPage />);
    const helpButton = screen.getByRole('button', { name: /help/i });
    fireEvent.click(helpButton);
    expect(screen.getByText('What would you like to do?')).toBeInTheDocument();
  });

  it('closes help modal when Close button clicked', () => {
    render(<LandingPage />);
    fireEvent.click(screen.getByRole('button', { name: /help/i }));
    const closeButton = screen.getByRole('button', { name: /close help modal/i });
    fireEvent.click(closeButton);
    expect(screen.queryByText('What would you like to do?')).toBeNull();
  });
});
