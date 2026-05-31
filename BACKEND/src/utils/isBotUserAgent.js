const BOT_UA =
  /bot|crawler|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|preview|headless|curl|wget|python-requests|axios|java\/|libwww|perl|ruby|go-http|okhttp|postman|insomnia|googlebot|bingbot|yandex|baidu|duckduckbot|twitterbot|linkedinbot|slackbot|embedly|quora link preview|vkshare|facebot|ia_archiver|mediapartners/i;

export function isBotUserAgent(userAgent) {
  if (typeof userAgent !== 'string' || !userAgent.trim()) {
    return false;
  }
  return BOT_UA.test(userAgent);
}
