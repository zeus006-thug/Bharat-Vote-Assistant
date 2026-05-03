import { describe, it, expect, vi } from 'vitest';

// First, mock the dependency completely
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      constructor() {
        this.models = {
          generateContent: vi.fn().mockResolvedValue({
            text: 'Mock Gemini AI response'
          })
        };
      }
    }
  };
});

import { getAssistantResponse } from './gemini';

describe('Gemini Service', () => {
  it('returns a valid response from the API', async () => {
    // Need to set the env var for the test
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test_key');
    const response = await getAssistantResponse([{ role: 'user', content: 'Hello' }]);
    expect(response).toBe('Mock Gemini AI response');
  });
});
