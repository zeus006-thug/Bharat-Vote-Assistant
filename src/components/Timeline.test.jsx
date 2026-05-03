import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Timeline from './Timeline';

describe('Timeline Component', () => {
  it('renders all 5 election phases', () => {
    render(<Timeline />);
    expect(screen.getByText(/Voter Registration \(Form 6\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Candidate KYC/i)).toBeInTheDocument();
    expect(screen.getByText(/Find Polling Booth & BLO/i)).toBeInTheDocument();
    expect(screen.getByText(/Election Day \(EVM & VVPAT\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Counting & Results/i)).toBeInTheDocument();
  });

  it('renders the EVM Visual for the Election Day step', () => {
    render(<Timeline />);
    const readyScreen = screen.getByText('Ready');
    expect(readyScreen).toBeInTheDocument();
    
    // Check if candidates buttons are rendered
    expect(screen.getByText('Cand 1')).toBeInTheDocument();
    expect(screen.getByText('NOTA')).toBeInTheDocument();
  });
});
