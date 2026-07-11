import { UAParser } from 'ua-parser-js';

export const parseUserAgent = (req) => {
  const uaString = String(req.headers['user-agent'] || '').slice(0, 512);
  if (!uaString) {
    return {
      user_agent: '',
      device_type: '',
      browser: '',
      os: ''
    };
  }

  const parser = new UAParser(uaString);
  const result = parser.getResult();

  return {
    user_agent: uaString,
    device_type: (result.device?.type || 'Desktop').slice(0, 64),
    browser: (result.browser?.name || '').slice(0, 128),
    os: (result.os?.name || '').slice(0, 128)
  };
};
