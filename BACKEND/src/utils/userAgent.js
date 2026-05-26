import { UAParser } from "ua-parser-js";

export const parseUserAgent = (req) => {
  const uaString = req.headers["user-agent"] || "";
  if (!uaString) {
    return {
      user_agent: "",
      device_type: "",
      browser: "",
      os: "",
    };
  }

  const parser = new UAParser(uaString);
  const result = parser.getResult();

  return {
    user_agent: uaString,
    device_type: result.device?.type || "desktop",
    browser: result.browser?.name || "",
    os: result.os?.name || "",
  };
};
