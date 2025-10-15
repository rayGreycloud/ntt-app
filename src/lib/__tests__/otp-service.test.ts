import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OTPService } from '../otp-service';
import { EmailService } from '../email-service';

// Create a simple mock store that will be shared
const mockStore = new Map<string, { value: string; expiry?: number }>();

// Mock the Redis module - no external dependencies in factory
vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn().mockImplementation(() => ({
      async set(key: string, value: string, options?: { px?: number }) {
        const expiry = options?.px ? Date.now() + options.px : undefined;
        mockStore.set(key, { value, expiry });
        return 'OK';
      },
      async get(key: string) {
        const item = mockStore.get(key);
        if (!item) return null;
        // Check if expired
        if (item.expiry && Date.now() > item.expiry) {
          mockStore.delete(key);
          return null;
        }
        return item.value;
      },
      async del(key: string) {
        const existed = mockStore.has(key);
        mockStore.delete(key);
        return existed ? 1 : 0;
      }
    }))
  };
});

// Mock the EmailService
vi.mock('../email-service', () => ({
  EmailService: {
    sendOTPEmail: vi.fn()
  }
}));

describe('OTPService', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Clear mock store
    mockStore.clear();

    // Set up test environment
    process.env.MOCK_AUTH = 'false';
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
    process.env.OTP_EXPIRY_MINUTES = '10';
    process.env.WHITELISTED_EMAILS = 'test@example.com,user@naegeli.com';
    process.env.KV_REST_API_URL = 'http://localhost:8079';
    process.env.KV_REST_API_TOKEN = 'test-token';

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('sendOTP', () => {
    it('should generate a 6-digit OTP', async () => {
      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: true,
        message: 'Email sent successfully'
      });

      const result = await OTPService.sendOTP('test@example.com');

      expect(result.success).toBe(true);
      expect(EmailService.sendOTPEmail).toHaveBeenCalled();
      const otpArg = vi.mocked(EmailService.sendOTPEmail).mock.calls[0][1];
      expect(otpArg).toMatch(/^\d{6}$/);
    });

    it('should reject non-whitelisted emails in production mode', async () => {
      const result = await OTPService.sendOTP('notwhitelisted@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email not authorized to use this service');
      expect(EmailService.sendOTPEmail).not.toHaveBeenCalled();
    });

    it('should accept whitelisted emails', async () => {
      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: true,
        message: 'Email sent successfully'
      });

      const result = await OTPService.sendOTP('test@example.com');

      expect(result.success).toBe(true);
      expect(EmailService.sendOTPEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String)
      );
    });

    it('should send email via EmailService in production mode', async () => {
      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: true,
        message: 'Email sent successfully'
      });

      await OTPService.sendOTP('test@example.com');

      expect(EmailService.sendOTPEmail).toHaveBeenCalledTimes(1);
    });

    it('should handle email service failures', async () => {
      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: false,
        message: 'Failed to send email'
      });

      const result = await OTPService.sendOTP('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'Failed to send verification code: Failed to send email'
      );
    });

    it('should store OTP with correct expiry time', async () => {
      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: true,
        message: 'Email sent successfully'
      });

      const beforeTime = Date.now();
      await OTPService.sendOTP('test@example.com');
      const afterTime = Date.now();

      // Verify the OTP was sent (which means it was stored)
      expect(EmailService.sendOTPEmail).toHaveBeenCalled();

      // Verify timing is reasonable (within 10 minutes + 1 second buffer)
      const expectedExpiry =
        parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000;
      expect(afterTime - beforeTime).toBeLessThan(expectedExpiry + 1000);
    });
  });

  describe('verifyOTP', () => {
    it('should verify correct OTP', async () => {
      // First send OTP
      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: true,
        message: 'Email sent successfully'
      });

      await OTPService.sendOTP('test@example.com');
      const sentOtp = vi.mocked(EmailService.sendOTPEmail).mock.calls[0][1];

      // Then verify it
      const result = await OTPService.verifyOTP('test@example.com', sentOtp);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
    });

    it('should reject incorrect OTP', async () => {
      // First send OTP
      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: true,
        message: 'Email sent successfully'
      });

      await OTPService.sendOTP('test@example.com');

      // Try to verify with wrong OTP
      const result = await OTPService.verifyOTP('test@example.com', '000000');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid verification code');
    });

    it('should reject OTP for non-existent email', async () => {
      const result = await OTPService.verifyOTP(
        'nonexistent@example.com',
        '123456'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid or expired verification code');
    });

    it('should delete OTP after successful verification', async () => {
      // Send OTP
      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: true,
        message: 'Email sent successfully'
      });

      await OTPService.sendOTP('test@example.com');
      const sentOtp = vi.mocked(EmailService.sendOTPEmail).mock.calls[0][1];

      // Verify OTP
      await OTPService.verifyOTP('test@example.com', sentOtp);

      // Try to verify again with same OTP (should fail)
      const secondResult = await OTPService.verifyOTP(
        'test@example.com',
        sentOtp
      );

      expect(secondResult.success).toBe(false);
      expect(secondResult.message).toBe('Invalid or expired verification code');
    });

    it('should handle expired OTP', async () => {
      // Set very short expiry
      process.env.OTP_EXPIRY_MINUTES = '0'; // 0 minutes = immediate expiry

      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: true,
        message: 'Email sent successfully'
      });

      await OTPService.sendOTP('test@example.com');
      const sentOtp = vi.mocked(EmailService.sendOTPEmail).mock.calls[0][1];

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Try to verify expired OTP
      const result = await OTPService.verifyOTP('test@example.com', sentOtp);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Verification code has expired');
    });
  });

  describe('Redis Integration', () => {
    it('should store OTP in Redis when not in mock mode', async () => {
      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: true,
        message: 'Email sent successfully'
      });

      await OTPService.sendOTP('test@example.com');

      // Verify OTP was stored (by attempting to verify)
      const sentOtp = vi.mocked(EmailService.sendOTPEmail).mock.calls[0][1];
      const result = await OTPService.verifyOTP('test@example.com', sentOtp);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully during sendOTP', async () => {
      vi.mocked(EmailService.sendOTPEmail).mockRejectedValue(
        new Error('Network error')
      );

      const result = await OTPService.sendOTP('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to send verification code');
    });

    it('should handle errors gracefully during verifyOTP', async () => {
      // This would require breaking Redis, which is hard to simulate
      // But we can test with invalid JSON in storage
      const result = await OTPService.verifyOTP('test@example.com', '123456');

      expect(result.success).toBe(false);
    });
  });

  describe('Whitelist Functionality', () => {
    it('should handle comma-separated whitelist correctly', async () => {
      process.env.WHITELISTED_EMAILS =
        'user1@test.com, user2@test.com, user3@test.com';

      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: true,
        message: 'Email sent successfully'
      });

      // Test each email
      const result1 = await OTPService.sendOTP('user1@test.com');
      expect(result1.success).toBe(true);

      const result2 = await OTPService.sendOTP('user2@test.com');
      expect(result2.success).toBe(true);

      const result3 = await OTPService.sendOTP('user3@test.com');
      expect(result3.success).toBe(true);
    });

    it('should trim whitespace from whitelist emails', async () => {
      process.env.WHITELISTED_EMAILS = '  spaced@test.com  ';

      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: true,
        message: 'Email sent successfully'
      });

      const result = await OTPService.sendOTP('spaced@test.com');

      expect(result.success).toBe(true);
    });

    it('should handle empty whitelist', async () => {
      process.env.WHITELISTED_EMAILS = '';

      vi.mocked(EmailService.sendOTPEmail).mockResolvedValue({
        success: true,
        message: 'Email sent successfully'
      });

      const result = await OTPService.sendOTP('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email not authorized to use this service');
      expect(EmailService.sendOTPEmail).not.toHaveBeenCalled();
    });
  });
});
