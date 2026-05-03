import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SmartAssistant from './SmartAssistant';
import * as geminiService from '../services/gemini';

// Mock the gemini service to prevent actual API calls during tests
vi.mock('../services/gemini', () => ({
  getAssistantResponse: vi.fn().mockResolvedValue('Mocked response'),
}));

describe('SmartAssistant Component', () => {
  it('renders chat toggle button initially', () => {
    render(<SmartAssistant />);
    const toggleBtn = screen.getByRole('button', { name: /Open chat assistant/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('opens chat window when toggle button is clicked', () => {
    render(<SmartAssistant />);
    const toggleBtn = screen.getByRole('button', { name: /Open chat assistant/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Bharat Vote Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask about voting...')).toBeInTheDocument();
  });

  it('renders quick action buttons inside the chat', () => {
    render(<SmartAssistant />);
    fireEvent.click(screen.getByRole('button', { name: /Open chat assistant/i }));

    expect(screen.getByText('Form 6 Registration')).toBeInTheDocument();
    expect(screen.getByText('Find my BLO')).toBeInTheDocument();
  });
});
