import { Resend } from 'resend';
import { AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';

let resendClient = null;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new AppError('Email service is not configured.', 500);
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
};

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'Shortly <onboarding@resend.dev>';

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONT_END_URL}/reset-password/${resetToken}`;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your Shortly password',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #4f46e5; font-size: 24px; margin-bottom: 16px;">Shortly</h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            We received a request to reset your password. Click the button below to set a new one.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 500; margin-bottom: 24px;">
            Reset Password
          </a>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 8px;">
            If you didn't request this, you can safely ignore this email. The link expires in 1 hour.
          </p>
          <p style="color: #9ca3af; font-size: 12px;">
            If the button doesn't work, copy and paste this URL into your browser:<br/>
            <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
          </p>
        </div>
      `
    });
  } catch (err) {
    logger.error('Failed to send password reset email', { error: err.message, email });
    throw new AppError('Failed to send reset email. Please try again.', 500);
  }
};
