import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the main header correctly', () => {
    render(<App />);
    const heading = screen.getByText(/Bharat Vote Assistant/i);
    expect(heading).toBeInTheDocument();
  });

  it('renders the Timeline component', () => {
    render(<App />);
    const timelineSection = screen.getByText(/Election Timeline/i);
    expect(timelineSection).toBeInTheDocument();
  });
});
