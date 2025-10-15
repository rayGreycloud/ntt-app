import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Mock environment variables for testing (set BEFORE any module loads)
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.OTP_EXPIRY_MINUTES = '10';
process.env.MOCK_AUTH = 'false';
process.env.SENDGRID_API_KEY = 'test-sendgrid-api-key';
process.env.SENDGRID_FROM_EMAIL = 'test@naegeli.com';
process.env.WHITELISTED_EMAILS = 'test@example.com,user@naegeli.com';
process.env.KV_REST_API_URL = 'http://localhost:8079';
process.env.KV_REST_API_TOKEN = 'test-token';

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  }))
}));

// Reset mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});
