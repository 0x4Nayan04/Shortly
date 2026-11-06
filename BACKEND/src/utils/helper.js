import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';

/** Alphanumeric only — avoids leading `-`/`_` in random short paths. */
const SHORT_URL_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const generateNanoId = (length = 7) => {
  return customAlphabet(SHORT_URL_ALPHABET, length)();
};

export const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
