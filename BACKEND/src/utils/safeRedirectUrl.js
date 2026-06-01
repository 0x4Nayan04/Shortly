import net from 'node:net';

const SAFE_HTTP_URL = /^https?:\/\//i;

const blockedAddresses = new net.BlockList();
blockedAddresses.addSubnet('127.0.0.0', 8, 'ipv4');
blockedAddresses.addSubnet('10.0.0.0', 8, 'ipv4');
blockedAddresses.addSubnet('172.16.0.0', 12, 'ipv4');
blockedAddresses.addSubnet('192.168.0.0', 16, 'ipv4');
blockedAddresses.addSubnet('169.254.0.0', 16, 'ipv4');
blockedAddresses.addSubnet('0.0.0.0', 8, 'ipv4');
blockedAddresses.addSubnet('::1', 128, 'ipv6');
blockedAddresses.addSubnet('fc00::', 7, 'ipv6');
blockedAddresses.addSubnet('fe80::', 10, 'ipv6');

function normalizeHostname(hostname) {
  return hostname.toLowerCase().replace(/^\[|\]$/g, '');
}

function isBlockedIp(hostname) {
  const host = normalizeHostname(hostname);
  const version = net.isIP(host);

  if (version === 4) {
    return blockedAddresses.check(host, 'ipv4');
  }

  if (version === 6) {
    if (blockedAddresses.check(host, 'ipv6')) {
      return true;
    }

    const mapped = host.match(/^::ffff:([\da-f.:]+)$/i);
    if (mapped && net.isIP(mapped[1]) === 4) {
      return blockedAddresses.check(mapped[1], 'ipv4');
    }
  }

  return false;
}

function isPrivateOrLocalHost(hostname) {
  const host = normalizeHostname(hostname);
  if (host === 'localhost' || host.endsWith('.localhost')) {
    return true;
  }
  return isBlockedIp(host);
}

/** Only allow http(s) destinations for public redirects (blocks javascript:, etc.). */
export function isSafeRedirectUrl(url) {
  if (typeof url !== 'string') return false;
  const normalized = url.trim();
  if (!normalized) return false;
  if (!SAFE_HTTP_URL.test(normalized)) return false;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    return !isPrivateOrLocalHost(parsed.hostname);
  } catch {
    return false;
  }
}
