import { kv } from '@vercel/kv';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

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
      process.env.WHITELISTED_EMAILS?.split(',').map((e) => e.trim()) || [];
    return whitelistedEmails.includes(email);
  }

  static async sendOTP(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if email is whitelisted
      if (!this.isWhitelistedEmail(email)) {
        return {
          success: false,
          message: 'Email not authorized to use this service'
        };
      }

      const otp = this.generateOTP();
      const expiresAt =
        Date.now() +
        parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000;

      // Store OTP in Vercel KV
      await kv.set(
        `otp:${email}`,
        JSON.stringify({
          email,
          otp,
          expiresAt
        } as OTPData),
        {
          px: parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000 // Auto-expire
        }
      );

      // Send email via SendGrid
      const msg = {
        to: email,
        from: 'noreply@naegeli.com', // Update with your verified sender
        subject: 'Transcript Tool - Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Transcript Tool Access</h2>
            <p>Your verification code is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #333; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>This code will expire in ${
              process.env.OTP_EXPIRY_MINUTES || '10'
            } minutes.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you didn't request this code, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} ${
          process.env.NEXT_PUBLIC_COMPANY_NAME || 'Naegeli Deposition & Trial'
        }
            </p>
          </div>
        `
      };

      await sgMail.send(msg);

      return {
        success: true,
        message: 'Verification code sent to your email'
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
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
      const storedData = await kv.get(`otp:${email}`);

      if (!storedData) {
        return {
          success: false,
          message: 'Invalid or expired verification code'
        };
      }

      const otpData: OTPData = JSON.parse(storedData as string);

      // Check if OTP has expired
      if (Date.now() > otpData.expiresAt) {
        await kv.del(`otp:${email}`);
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
      await kv.del(`otp:${email}`);

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
