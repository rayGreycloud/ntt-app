import sgMail from '@sendgrid/mail';

// Initialize SendGrid only if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  /**
   * Send an email using SendGrid
   */
  static async sendEmail(
    options: SendEmailOptions
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if SendGrid API key is configured
      if (!process.env.SENDGRID_API_KEY) {
        console.error('❌ EMAIL SEND FAILED: SENDGRID_API_KEY not configured');
        return {
          success: false,
          message: 'Email service not configured (missing API key)'
        };
      }

      // Check if from email is configured
      const fromEmail =
        options.from ||
        process.env.SENDGRID_FROM_EMAIL ||
        'noreply@naegeli.com';

      if (!process.env.SENDGRID_FROM_EMAIL) {
        console.warn(
          '⚠️  SENDGRID_FROM_EMAIL not set, using default:',
          fromEmail
        );
      }

      const msg = {
        to: options.to,
        from: fromEmail,
        subject: options.subject,
        html: options.html
      };

      console.log('📧 Attempting to send email:');
      console.log('  To:', msg.to);
      console.log('  From:', msg.from);
      console.log('  Subject:', msg.subject);

      const response = await sgMail.send(msg);

      console.log('✅ Email sent successfully');
      console.log('  Status:', response[0]?.statusCode);
      if (response[0]?.headers) {
        console.log('  Message ID:', response[0].headers['x-message-id']);
      }

      return {
        success: true,
        message: 'Email sent successfully'
      };
    } catch (error: unknown) {
      console.error('❌ EMAIL SEND FAILED:');
      console.error('  Error:', error);

      // Log detailed error information
      if (error && typeof error === 'object' && 'response' in error) {
        const sgError = error as {
          response: { statusCode: number; body: unknown };
        };
        console.error('  Status Code:', sgError.response.statusCode);
        console.error(
          '  Body:',
          JSON.stringify(sgError.response.body, null, 2)
        );

        // Provide specific error messages based on SendGrid error codes
        const statusCode = sgError.response.statusCode;
        if (statusCode === 401) {
          return {
            success: false,
            message: 'Email authentication failed (invalid API key)'
          };
        } else if (statusCode === 403) {
          return {
            success: false,
            message: 'Email sending forbidden (check sender verification)'
          };
        } else if (statusCode === 413) {
          return {
            success: false,
            message: 'Email too large'
          };
        } else if (statusCode === 429) {
          return {
            success: false,
            message: 'Email rate limit exceeded'
          };
        } else if (statusCode >= 500) {
          return {
            success: false,
            message: 'Email service temporarily unavailable'
          };
        }
      }

      // Return consistent error message for tests
      return {
        success: false,
        message: 'Failed to send email'
      };
    }
  }

  /**
   * Send OTP verification email
   */
  static async sendOTPEmail(
    email: string,
    otp: string
  ): Promise<{ success: boolean; message: string }> {
    const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || '10';
    const companyName =
      process.env.NEXT_PUBLIC_COMPANY_NAME || 'Naegeli Deposition & Trial';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Transcript Tool Access</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="color: #333; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p>This code will expire in ${expiryMinutes} minutes.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If you didn't request this code, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} ${companyName}
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Transcript Tool - Verification Code',
      html
    });
  }
}
