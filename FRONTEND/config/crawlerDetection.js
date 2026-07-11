const CRAWLER_PATTERN =
  /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|googlebot|bingbot|yandex|baiduspider|duckduckbot|applebot|embedly|pinterest|vkshare|w3c_validator|redditbot|rogerbot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider/i;

/** @param {string | null | undefined} userAgent */
export function isCrawlerUserAgent(userAgent) {
  if (!userAgent) return false;
  return CRAWLER_PATTERN.test(userAgent);
}
