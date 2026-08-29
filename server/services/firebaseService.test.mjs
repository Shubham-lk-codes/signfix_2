import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);

describe('firebaseService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    for (const id of Object.keys(require.cache)) {
      if (id.endsWith('firebaseService.js')) delete require.cache[id];
    }
    vi.restoreAllMocks();
  });

  it('reports invalid optional credentials as unconfigured instead of throwing', () => {
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'firebase@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'not-a-private-key';
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const firebase = require('./firebaseService.js');

    expect(firebase.isConfigured()).toBe(false);
    expect(console.error).toHaveBeenCalledOnce();
  });

  it('reports missing credentials as unconfigured', () => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;

    const firebase = require('./firebaseService.js');

    expect(firebase.isConfigured()).toBe(false);
  });
});
