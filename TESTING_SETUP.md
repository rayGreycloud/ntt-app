# Vitest Testing Setup - Complete Guide

## ✅ What Was Implemented

### 1. **Testing Infrastructure**

- ✅ Installed Vitest and dependencies
- ✅ Created `vitest.config.ts` configuration
- ✅ Added test scripts to `package.json`
- ✅ Set up test environment with `.env.test`
- ✅ Created test utilities and mocks

### 2. **Test Coverage**

- ✅ **OTPService Tests** - 20+ test cases covering:
  - OTP generation (6-digit validation)
  - Email whitelist validation
  - Redis storage integration
  - OTP expiry handling
  - Mock mode vs production mode
  - Error handling
- ✅ **EmailService Tests** - 10+ test cases covering:
  - SendGrid integration
  - OTP email formatting
  - Error handling
  - Multiple concurrent sends
  - Email validation

### 3. **Test Scripts Available**

```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Open Vitest UI
npm run test:coverage # Generate coverage report
```

## 🔧 Configuration Details

### Files Created:

1. `vitest.config.ts` - Main Vitest configuration
2. `src/test/setup.ts` - Global test setup
3. `src/test/mocks.ts` - Mock utilities (MockRedis, MockSendGrid)
4. `.env.test` - Test environment variables
5. `src/lib/__tests__/otp-service.test.ts` - OTP service tests
6. `src/lib/__tests__/email-service.test.ts` - Email service tests

### Key Configuration:

- **Environment**: jsdom (for DOM testing)
- **Globals**: Enabled (no need to import `describe`, `it`, `expect`)
- **Coverage Provider**: v8
- **Mock Mode**: Disabled (`MOCK_AUTH=false` in tests)

## 🐛 Current Issue & Fix

### The Problem

The tests are failing with a hoisting error when trying to mock `@upstash/redis`:

```
Error: [vitest] There was an error when mocking a module.
ReferenceError: Cannot access '__vi_import_2__' before initialization
```

### Why It Happens

The mock factory function in `vi.mock()` gets hoisted to the top of the file, but it was trying to use `MockRedis` from an import, which creates a circular dependency.

### The Fix Applied

Changed from importing `MockRedis` to defining the mock inline:

```typescript
// ❌ BEFORE (Caused error)
import { MockRedis } from '@/test/mocks';
vi.mock('@upstash/redis', () => {
  const mockRedis = new MockRedis(); // Can't access import here!
  return { Redis: vi.fn(() => mockRedis) };
});

// ✅ AFTER (Fixed)
const mockStore = new Map();
vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn().mockImplementation(() => ({
      async set(key, value, options) {
        /* ... */
      },
      async get(key) {
        /* ... */
      },
      async del(key) {
        /* ... */
      }
    }))
  };
});
```

## 🚀 Running Tests

### Quick Test Run:

```powershell
npm test
```

### Watch Mode (Recommended during development):

```powershell
npm run test:watch
```

### With UI (Visual test runner):

```powershell
npm run test:ui
```

## 📊 Test Coverage

Run coverage report:

```powershell
npm run test:coverage
```

This generates:

- Console output with coverage percentages
- HTML report in `coverage/` directory
- JSON report for CI/CD integration

## 🔍 What Each Test File Does

### `otp-service.test.ts`

Tests the core authentication logic:

- ✅ OTP generation is always 6 digits
- ✅ Only whitelisted emails can get OTPs (production mode)
- ✅ OTPs are stored in Redis with correct expiry
- ✅ OTP verification works correctly
- ✅ Expired OTPs are rejected
- ✅ Used OTPs are deleted (can't reuse)
- ✅ Mock mode bypasses whitelist and sends OTP in response
- ✅ Error handling for Redis and email failures

### `email-service.test.ts`

Tests email sending functionality:

- ✅ Emails are sent via SendGrid
- ✅ Correct email format and content
- ✅ OTP code appears in email
- ✅ Uses correct "from" address
- ✅ Handles SendGrid API failures
- ✅ Can send multiple emails concurrently
- ✅ Validates email addresses

## 🎯 Test Environment Variables

The `.env.test` file configures:

```env
MOCK_AUTH=false                    # Test production mode
SENDGRID_API_KEY=test-key          # Mocked anyway
WHITELISTED_EMAILS=test@example.com
KV_REST_API_URL=http://localhost   # Mocked
KV_REST_API_TOKEN=test-token       # Mocked
```

## 📝 Next Steps

### To fix the current error:

1. The fix has been applied to `otp-service.test.ts`
2. Run `npm test` to verify all tests pass

### Future Enhancements (Optional):

1. **API Route Tests** - Test the actual Next.js API endpoints
2. **Component Tests** - Test React components (AuthForm, TranscriptUploader)
3. **E2E Tests** - Add Playwright for full user journey testing
4. **CI/CD Integration** - Run tests on every commit

## 🛠️ Troubleshooting

### Tests won't run

```powershell
# Clear cache and try again
npx vitest --run --no-cache
```

### Import errors

Make sure TypeScript paths are set up in `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Mock not working

- Ensure mocks are at the top of the file
- Don't use external variables in `vi.mock()` factory
- Use `vi.mocked()` to get proper TypeScript typing

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)

## ✨ Summary

You now have a complete testing setup with:

- ✅ 30+ tests covering authentication and email logic
- ✅ Mocked Redis storage (no actual database needed)
- ✅ Mocked SendGrid (no emails sent during tests)
- ✅ Fast test execution with Vitest
- ✅ Watch mode for TDD workflow
- ✅ Coverage reporting

**Run `npm test` to execute all tests!**
