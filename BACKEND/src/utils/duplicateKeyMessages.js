const DUPLICATE_KEY_FIELD_MESSAGES = {
  short_url: 'This short URL is already taken. Please choose a different one.'
};

export const duplicateKeyMessageForField = (field) =>
  DUPLICATE_KEY_FIELD_MESSAGES[field] ||
  'A record with this value already exists.';
