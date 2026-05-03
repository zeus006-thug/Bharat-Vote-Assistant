import { describe, it, expect, vi } from 'vitest';
import app, { auth, db, initAnalytics } from './firebase';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  isSupported: vi.fn().mockResolvedValue(true),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}));

describe('Firebase Service', () => {
  it('initializes default app', () => {
    expect(app).toBeDefined();
    expect(app.name).toBe('[DEFAULT]');
  });

  it('exports auth and db instances', () => {
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
  });

  it('initializes analytics safely', async () => {
    const analytics = await initAnalytics();
    expect(analytics).toBeDefined();
  });
});
