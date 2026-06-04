import { mergeApiEnvelope } from './apiEnvelope';

function isHtmlResponse(error) {
  const contentType = error?.response?.headers?.['content-type'];
  return (
    typeof contentType === 'string' &&
    contentType.toLowerCase().includes('text/html')
  );
}

function messageFromEnvelope(data) {
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object' && data.message) return data.message;
  return null;
}

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (isHtmlResponse(error)) return fallback;

  const raw = error?.response?.data;
  const data = raw && typeof raw === 'object' ? mergeApiEnvelope(raw) : raw;
  const fromEnvelope = messageFromEnvelope(data);
  if (fromEnvelope) return fromEnvelope;

  if (error?.message && !error.message.startsWith('Request failed')) {
    return error.message;
  }
  return fallback;
}
