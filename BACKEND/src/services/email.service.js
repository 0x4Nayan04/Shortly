import { Resend } from 'resend';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import {
  buildFrontEndUrl,
  buildTransactionalEmailHtml,
  buildTransactionalEmailText
} from '../templates/transactionalEmail.js';

let resendClient = null;

export const isEmailServiceConfigured = () =>
  Boolean(process.env.RESEND_API_KEY?.trim());

const getResendClient = () => {
  if (!isEmailServiceConfigured()) return null;
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

async function sendTemplateEmail({
  email,
  subject,
  ctaUrl,
  errorLabel,
  templateInput
}) {
  const resend = getResendClient();

  if (!resend) {
    logger.warn(`${errorLabel} skipped: RESEND_API_KEY not configured`, {
      email,
      ...(process.env.NODE_ENV !== 'production' && { ctaUrl })
    });
    throw new AppError(
      `${errorLabel} is unavailable: email service not configured.`,
      503
    );
  }

  try {
    await sendTransactionalEmail({
      to: email,
      subject,
      html: buildTransactionalEmailHtml(templateInput),
      text: buildTransactionalEmailText(templateInput)
    });
  } catch (err) {
    logger.error(`Failed to send ${errorLabel.toLowerCase()}`, {
      error: err.message,
      email
    });
    throw new AppError(
      `Failed to send ${errorLabel.toLowerCase()}. Try again later.`,
      500
    );
  }
}

const sendVerificationEmail = async (email, verificationToken) => {
  const ctaUrl = buildFrontEndUrl(
    frontEndBase(),
    `/verify-email/${verificationToken}`
  );
  await sendTemplateEmail({
    email,
    subject: 'Verify your Shortly account',
    errorLabel: 'Verification email',
    ctaUrl,
    templateInput: {
      preheader: 'Confirm your email to start using Shortly.',
      headline: 'Verify your email',
      intro:
        'Thanks for signing up for Shortly. Confirm your email address to activate your account and start shortening links.',
      ctaLabel: 'Verify email',
      ctaUrl,
      safetyNote:
        "If you didn't create a Shortly account, you can safely ignore this email.",
      expiryNote: 'This verification link expires in 24 hours.',
      frontEndUrl: frontEndBase()
    }
  });
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const ctaUrl = buildFrontEndUrl(
    frontEndBase(),
    `/reset-password/${resetToken}`
  );
  await sendTemplateEmail({
    email,
    subject: 'Reset your Shortly password',
    errorLabel: 'Password reset email',
    ctaUrl,
    templateInput: {
      preheader: 'Reset your Shortly password securely.',
      headline: 'Reset your password',
      intro:
        'We received a request to reset the password for your Shortly account. Use the button below to choose a new password.',
      ctaLabel: 'Reset password',
      ctaUrl,
      safetyNote:
        "If you didn't request a password reset, you can safely ignore this email. Your password will stay the same.",
      expiryNote: 'This reset link expires in 1 hour.',
      frontEndUrl: frontEndBase()
    }
  });
};

export const sendAnonymousLinkRecoveryEmail = async (
  email,
  recoveryToken,
  shortUrl
) => {
  const ctaUrl = buildFrontEndUrl(
    frontEndBase(),
    `/claim-link/${recoveryToken}`
  );
  await sendTemplateEmail({
    email,
    subject: 'Recover your Shortly link',
    errorLabel: 'Link recovery email',
    ctaUrl,
    templateInput: {
      preheader: 'Save your anonymous Shortly link to an account.',
      headline: 'Recover your short link',
      intro: `Sign in or create an account to claim ${shortUrl} and manage it from any device.`,
      ctaLabel: 'Claim this link',
      ctaUrl,
      safetyNote:
        "If you didn't request this email, you can safely ignore it. The short link will continue to work.",
      expiryNote: 'This one-time recovery link expires in 24 hours.',
      frontEndUrl: frontEndBase()
    }
  });
};

export async function dispatchVerificationForUser(user) {
  if (!isEmailServiceConfigured()) {
    return { sent: false, reason: 'email_not_configured' };
  }

  const token = user.generateEmailVerificationToken();
  await user.save();

  try {
    await sendVerificationEmail(user.email, token);
    return { sent: true };
  } catch (error) {
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    throw error;
  }
}

export async function dispatchPasswordResetForUser(user) {
  if (!isEmailServiceConfigured()) {
    return { sent: false, reason: 'email_not_configured' };
  }

  const token = user.generateResetToken();
  await user.save();

  try {
    await sendPasswordResetEmail(user.email, token);
    return { sent: true };
  } catch (error) {
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    throw error;
  }
}

