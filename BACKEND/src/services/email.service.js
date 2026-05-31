import { Resend } from 'resend';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import {
  buildFrontEndUrl,
  buildTransactionalEmailHtml,
  buildTransactionalEmailText
} from '../templates/transactionalEmail.js';

let resendClient = null;

export const isPasswordResetEmailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY?.trim());

const getResendClient = () => {
  if (!isPasswordResetEmailConfigured()) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
};

const frontEndBase = () => process.env.FRONT_END_URL || '';

function getFromEmail() {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!from) {
    throw new AppError(
      'Email service misconfigured: RESEND_FROM_EMAIL is not set.',
      503
    );
  }
  return from;
}

async function sendTransactionalEmail({ to, subject, html, text }) {
  const resend = getResendClient();
  if (!resend) {
    throw new AppError(
      'Email service is unavailable: email provider not configured.',
      503
    );
  }

  await resend.emails.send({
    from: getFromEmail(),
    to,
    subject,
    html,
    text
  });
}

export const sendVerificationEmail = async (email, verificationToken) => {
  const verifyUrl = buildFrontEndUrl(
    frontEndBase(),
    `/verify-email/${verificationToken}`
  );
  const resend = getResendClient();

  if (!resend) {
    logger.warn('Verification email skipped: RESEND_API_KEY not configured', {
      email,
      ...(process.env.NODE_ENV !== 'production' && { verifyUrl })
    });
    throw new AppError(
      'Email verification is unavailable: email service not configured.',
      503
    );
  }

  const templateInput = {
    preheader: 'Confirm your email to start using Shortly.',
    headline: 'Verify your email',
    intro:
      'Thanks for signing up for Shortly. Confirm your email address to activate your account and start shortening links.',
    ctaLabel: 'Verify email',
    ctaUrl: verifyUrl,
    safetyNote:
      "If you didn't create a Shortly account, you can safely ignore this email.",
    expiryNote: 'This verification link expires in 24 hours.',
    frontEndUrl: frontEndBase()
  };

  try {
    await sendTransactionalEmail({
      to: email,
      subject: 'Verify your Shortly account',
      html: buildTransactionalEmailHtml(templateInput),
      text: buildTransactionalEmailText(templateInput)
    });
  } catch (err) {
    logger.error('Failed to send verification email', {
      error: err.message,
      email
    });
    throw new AppError(
      'Failed to send verification email. Try again later.',
      500
    );
  }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = buildFrontEndUrl(
    frontEndBase(),
    `/reset-password/${resetToken}`
  );
  const resend = getResendClient();

  if (!resend) {
    logger.warn('Password reset email skipped: RESEND_API_KEY not configured', {
      email,
      ...(process.env.NODE_ENV !== 'production' && { resetUrl })
    });
    throw new AppError(
      'Password reset is unavailable: email service not configured.',
      503
    );
  }

  const templateInput = {
    preheader: 'Reset your Shortly password securely.',
    headline: 'Reset your password',
    intro:
      'We received a request to reset the password for your Shortly account. Use the button below to choose a new password.',
    ctaLabel: 'Reset password',
    ctaUrl: resetUrl,
    safetyNote:
      "If you didn't request a password reset, you can safely ignore this email. Your password will stay the same.",
    expiryNote: 'This reset link expires in 1 hour.',
    frontEndUrl: frontEndBase()
  };

  try {
    await sendTransactionalEmail({
      to: email,
      subject: 'Reset your Shortly password',
      html: buildTransactionalEmailHtml(templateInput),
      text: buildTransactionalEmailText(templateInput)
    });
  } catch (err) {
    logger.error('Failed to send password reset email', {
      error: err.message,
      email
    });
    throw new AppError(
      'Failed to send password reset email. Try again later.',
      500
    );
  }
};
