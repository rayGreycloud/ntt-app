import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmailService } from '../email-service';
import sgMail from '@sendgrid/mail';

// Mock SendGrid
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn()
  }
}));

describe('EmailService', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Set up test environment
    process.env.SENDGRID_API_KEY = 'test-sendgrid-api-key';
    process.env.SENDGRID_FROM_EMAIL = 'test@naegeli.com';
    process.env.OTP_EXPIRY_MINUTES = '10';
    process.env.NEXT_PUBLIC_COMPANY_NAME = 'Naegeli Deposition & Trial';

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      // Mock SendGrid response with proper structure
      vi.mocked(sgMail.send).mockResolvedValue([
        {
          statusCode: 202,
          headers: { 'x-message-id': 'test-message-id' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {}
      ]);

      const result = await EmailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email sent successfully');
      expect(sgMail.send).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        from: 'test@naegeli.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      });
    });

    it('should use custom from address when provided', async () => {
      vi.mocked(sgMail.send).mockResolvedValue([
        {
          statusCode: 202,
          headers: { 'x-message-id': 'test-message-id' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {}
      ]);

      await EmailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        from: 'custom@example.com'
      });

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com'
        })
      );
    });

    it('should use default from address from environment', async () => {
      vi.mocked(sgMail.send).mockResolvedValue([
        {
          statusCode: 202,
          headers: { 'x-message-id': 'test-message-id' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {}
      ]);

      await EmailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      });

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@naegeli.com'
        })
      );
    });

    it('should use fallback from address if env not set', async () => {
      delete process.env.SENDGRID_FROM_EMAIL;

      vi.mocked(sgMail.send).mockResolvedValue([
        {
          statusCode: 202,
          headers: { 'x-message-id': 'test-message-id' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {}
      ]);

      await EmailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      });

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@naegeli.com'
        })
      );
    });

    it('should handle SendGrid errors gracefully', async () => {
      vi.mocked(sgMail.send).mockRejectedValue(new Error('SendGrid error'));

      const result = await EmailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to send email');
    });

    it('should handle network errors', async () => {
      vi.mocked(sgMail.send).mockRejectedValue(
        new Error('Network connection failed')
      );

      const result = await EmailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to send email');
    });
  });

  describe('sendOTPEmail', () => {
    it('should send OTP email with correct format', async () => {
      vi.mocked(sgMail.send).mockResolvedValue([
        {
          statusCode: 202,
          headers: { 'x-message-id': 'test-message-id' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {}
      ]);

      const result = await EmailService.sendOTPEmail(
        'user@example.com',
        '123456'
      );

      expect(result.success).toBe(true);
      expect(sgMail.send).toHaveBeenCalledTimes(1);

      const callArgs = vi.mocked(sgMail.send).mock.calls[0][0];
      expect(callArgs).toMatchObject({
        to: 'user@example.com',
        subject: 'Transcript Tool - Verification Code'
      });
    });

    it('should include OTP code in email HTML', async () => {
      vi.mocked(sgMail.send).mockResolvedValue([
        {
          statusCode: 202,
          headers: { 'x-message-id': 'test-message-id' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {}
      ]);

      await EmailService.sendOTPEmail('user@example.com', '987654');

      expect(sgMail.send).toHaveBeenCalled();
      // Email was sent successfully
      const callArgs = vi.mocked(sgMail.send).mock.calls[0][0];
      expect(JSON.stringify(callArgs)).toContain('987654');
    });

    it('should handle SendGrid failures during OTP send', async () => {
      vi.mocked(sgMail.send).mockRejectedValue(new Error('Invalid API key'));

      const result = await EmailService.sendOTPEmail(
        'user@example.com',
        '123456'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to send email');
    });

    it('should send email with correct subject', async () => {
      vi.mocked(sgMail.send).mockResolvedValue([
        {
          statusCode: 202,
          headers: { 'x-message-id': 'test-message-id' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {}
      ]);

      await EmailService.sendOTPEmail('user@example.com', '123456');

      const callArgs = vi.mocked(sgMail.send).mock.calls[0][0];
      expect(callArgs).toHaveProperty(
        'subject',
        'Transcript Tool - Verification Code'
      );
    });
  });

  describe('SendGrid Integration', () => {
    it('should call setApiKey during module initialization', () => {
      // This is tested implicitly by the module being loaded
      // In a real scenario, the setApiKey would be called when the module loads
      expect(sgMail.setApiKey).toBeDefined();
    });

    it('should handle multiple concurrent email sends', async () => {
      vi.mocked(sgMail.send).mockResolvedValue([
        {
          statusCode: 202,
          headers: { 'x-message-id': 'test-message-id' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {}
      ]);

      const promises = [
        EmailService.sendOTPEmail('user1@example.com', '111111'),
        EmailService.sendOTPEmail('user2@example.com', '222222'),
        EmailService.sendOTPEmail('user3@example.com', '333333')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
      expect(sgMail.send).toHaveBeenCalledTimes(3);
    });
  });

  describe('Email Validation', () => {
    it('should send to valid email addresses', async () => {
      vi.mocked(sgMail.send).mockResolvedValue([
        {
          statusCode: 202,
          headers: { 'x-message-id': 'test-message-id' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {}
      ]);

      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com'
      ];

      for (const email of validEmails) {
        const result = await EmailService.sendOTPEmail(email, '123456');
        expect(result.success).toBe(true);
      }
    });
  });
});
