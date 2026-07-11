import { logger } from '../utils/logger.js';

const ALERT_TIMEOUT_MS = 3000;

function getAlertWebhookUrl() {
  const value = process.env.OPERATIONS_ALERT_WEBHOOK_URL?.trim();
  return value || null;
}

function safeErrorMessage(error) {
  return error?.message || String(error || 'Unknown error');
}

async function postAlertWebhook(payload) {
  const webhookUrl = getAlertWebhookUrl();
  if (!webhookUrl || typeof fetch !== 'function') return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ALERT_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      logger.warn('Operations alert webhook returned non-2xx', {
        alertType: payload.alertType,
        status: response.status
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.warn('Operations alert webhook failed', {
      alertType: payload.alertType,
      error: safeErrorMessage(error)
    });
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function alertEmailDeliveryFailure({
  emailType,
  recipient,
  error
}) {
  const payload = {
    alertType: 'email_delivery_failure',
    emailType,
    recipient,
    error: safeErrorMessage(error),
    timestamp: new Date().toISOString()
  };

  logger.error('Operator alert: email delivery failed', payload);
  await postAlertWebhook(payload);
}
