import { Redis } from '@upstash/redis';
import { EmailService } from './email-service';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!
});

// Mock mode: When true, OTP is logged to console instead of being emailed
const MOCK_MODE =
  process.env.MOCK_AUTH === 'true' || !process.env.SENDGRID_API_KEY;

// In-memory storage for mock mode (only used when Redis is not available)
const mockStorage = new Map<string, string>();

interface OTPData {
  email: string;
  otp: string;
  expiresAt: number;
}

export class OTPService {
  private static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private static isWhitelistedEmail(email: string): boolean {
    const whitelistedEmails =
      process.env.WHITELISTED_EMAILS?.split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0) || [];
    return whitelistedEmails.includes(email);
  }

  static async sendOTP(
    email: string
  ): Promise<{ success: boolean; message: string; otp?: string }> {
    try {
      // Check if email is whitelisted (skip in mock mode for easier testing)
      if (!MOCK_MODE && !this.isWhitelistedEmail(email)) {
        return {
          success: false,
          message: 'Email not authorized to use this service'
        };
      }

      const otp = this.generateOTP();
      const expiresAt =
        Date.now() +
        parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000;

      const otpData: OTPData = {
        email,
        otp,
        expiresAt
      };

      // Store OTP in Upstash Redis or mock storage
      if (MOCK_MODE) {
        // Use in-memory storage for mock mode (store as JSON string)
        mockStorage.set(`otp:${email}`, JSON.stringify(otpData));
        // Auto-expire after timeout
        setTimeout(() => {
          mockStorage.delete(`otp:${email}`);
        }, parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000);
      } else {
        // Use Upstash Redis in production (store as object, Redis handles serialization)
        await redis.set(`otp:${email}`, otpData, {
          px: parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000
        });
      }

      if (MOCK_MODE) {
        // Mock mode: Log OTP to console and return it in the response
        console.log('\n========================================');
        console.log('🔐 MOCK AUTH MODE - OTP Generated');
        console.log('========================================');
        console.log(`Email: ${email}`);
        console.log(`OTP Code: ${otp}`);
        console.log(`Expires: ${new Date(expiresAt).toLocaleString()}`);
        console.log('========================================\n');

        return {
          success: true,
          message:
            'MOCK MODE: OTP displayed below (server console also logged)',
          otp: otp // Return OTP in response when MOCK_AUTH is enabled
        };
      }

      // Production mode: Send email via EmailService
      console.log('📨 Sending OTP email in production mode...');
      const emailResult = await EmailService.sendOTPEmail(email, otp);

      if (!emailResult.success) {
        console.error('❌ Failed to send OTP email:', emailResult.message);
        return {
          success: false,
          message: `Failed to send verification code: ${emailResult.message}`
        };
      }

      console.log('✅ OTP email sent successfully');
      return {
        success: true,
        message: 'Verification code sent to your email'
      };
    } catch (error) {
      console.error('❌ OTP SERVICE ERROR:');
      console.error('  Error:', error);
      if (error instanceof Error) {
        console.error('  Message:', error.message);
        console.error('  Stack:', error.stack);
      }
      return {
        success: false,
        message: 'Failed to send verification code'
      };
    }
  }

  static async verifyOTP(
    email: string,
    otp: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      let otpData: OTPData | null = null;

      // Get OTP from mock storage or Upstash Redis
      if (MOCK_MODE) {
        const storedData = mockStorage.get(`otp:${email}`) || null;
        if (storedData) {
          otpData = JSON.parse(storedData);
        }
      } else {
        // Upstash Redis automatically deserializes JSON
        const redisData = await redis.get<OTPData>(`otp:${email}`);
        otpData = redisData;
      }

      if (!otpData) {
        return {
          success: false,
          message: 'Invalid or expired verification code'
        };
      }

      // Check if OTP has expired
      if (Date.now() > otpData.expiresAt) {
        if (MOCK_MODE) {
          mockStorage.delete(`otp:${email}`);
        } else {
          await redis.del(`otp:${email}`);
        }
        return {
          success: false,
          message: 'Verification code has expired'
        };
      }

      // Check if OTP matches
      if (otpData.otp !== otp) {
        return {
          success: false,
          message: 'Invalid verification code'
        };
      }

      // OTP is valid, clean up
      if (MOCK_MODE) {
        mockStorage.delete(`otp:${email}`);
      } else {
        await redis.del(`otp:${email}`);
      }

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Failed to verify code'
      };
    }
  }
}
