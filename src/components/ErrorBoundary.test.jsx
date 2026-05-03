import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

const Bomb = () => {
  throw new Error('Test Error');
};

describe('ErrorBoundary Component', () => {
  it('renders children if no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Safe Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  it('catches errors and renders fallback UI', () => {
    // Suppress console.error for the intentional error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
