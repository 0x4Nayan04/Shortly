import geoip from 'geoip-lite';

const getIpFromRequest = (req) => {
  return req.ip || '';
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
