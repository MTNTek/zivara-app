import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  frontendUrl: string;
  skipEmailVerification: boolean;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private readonly config: EmailConfig = {
    host: process.env['SMTP_HOST'] ?? 'localhost',
    port: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
    user: process.env['SMTP_USER'] ?? '',
    pass: process.env['SMTP_PASS'] ?? '',
    from: process.env['SMTP_FROM'] ?? 'noreply@zivara.com',
    frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
    skipEmailVerification: process.env['SKIP_EMAIL_VERIFICATION'] === 'true',
  };

  private createTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.port === 465,
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
    });
  }

  async sendVerificationEmail(
    to: string,
    rawToken: string,
    locale: 'en' | 'ar' = 'en',
  ): Promise<void> {
    const verifyUrl = `${this.config.frontendUrl}/verify-email?token=${rawToken}`;

    const subject = locale === 'ar' ? 'تأكيد بريدك الإلكتروني — زيفارا' : 'Verify your email — Zivara';

    const html =
      locale === 'ar'
        ? `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>مرحباً بك في زيفارا</h2>
        <p>يرجى تأكيد بريدك الإلكتروني بالنقر على الرابط أدناه. الرابط صالح لمدة 24 ساعة.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:6px;">تأكيد البريد الإلكتروني</a>
        <p style="color:#71717a;font-size:12px;margin-top:24px;">إذا لم تطلب هذا، يمكنك تجاهل هذه الرسالة.</p>
      </div>`
        : `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to Zivara</h2>
        <p>Please verify your email address by clicking the button below. This link expires in 24 hours.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:6px;">Verify Email Address</a>
        <p style="color:#71717a;font-size:12px;margin-top:24px;">If you didn't create an account, you can safely ignore this email.</p>
      </div>`;

    if (this.config.skipEmailVerification) {
      this.logger.log(`[DEV] Verification email for ${to}: ${verifyUrl}`);
      return;
    }

    try {
      const transporter = this.createTransporter();
      await transporter.sendMail({ from: this.config.from, to, subject, html });
      this.logger.log(`Verification email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${to}`, err);
      throw new Error('Failed to send verification email. Please try again.');
    }
  }

  async sendPasswordResetEmail(
    to: string,
    rawToken: string,
    locale: 'en' | 'ar' = 'en',
  ): Promise<void> {
    const resetUrl = `${this.config.frontendUrl}/reset-password?token=${rawToken}`;

    const subject = locale === 'ar' ? 'إعادة تعيين كلمة المرور — زيفارا' : 'Reset your password — Zivara';

    const html =
      locale === 'ar'
        ? `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>إعادة تعيين كلمة المرور</h2>
        <p>لقد طلبت إعادة تعيين كلمة مرورك. انقر على الرابط أدناه. الرابط صالح لمدة ساعة واحدة.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:6px;">إعادة تعيين كلمة المرور</a>
        <p style="color:#71717a;font-size:12px;margin-top:24px;">إذا لم تطلب هذا، يمكنك تجاهل هذه الرسالة — كلمة مرورك لم تتغير.</p>
      </div>`
        : `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
        <p style="color:#71717a;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email — your password has not changed.</p>
      </div>`;

    if (this.config.skipEmailVerification) {
      this.logger.log(`[DEV] Password reset email for ${to}: ${resetUrl}`);
      return;
    }

    try {
      const transporter = this.createTransporter();
      await transporter.sendMail({ from: this.config.from, to, subject, html });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${to}`, err);
      throw new Error('Failed to send password reset email. Please try again.');
    }
  }
}
