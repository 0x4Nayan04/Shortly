import geoip from 'geoip-lite';

const getIpFromRequest = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0].trim();
    if (first) {
      return first;
    }
  }

  return req.ip || req.connection?.remoteAddress || '';
};

const normalizeIp = (ip) => {
  if (!ip) {
    return '';
  }

  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }

  return ip;
};

export const getCountryFromRequest = (req) => {
  const ip = normalizeIp(getIpFromRequest(req));
  if (!ip) {
    return '';
  }

  const lookup = geoip.lookup(ip);
  return lookup?.country || '';
};
