/** Public operator contact addresses (override per deployment via Vite env). */

export const OPERATOR_NAME =
  import.meta.env.VITE_OPERATOR_NAME?.trim() || 'Shortly';

export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL?.trim() ||
  'support@shortly.nayanswarnkar.com';

export const ABUSE_EMAIL =
  import.meta.env.VITE_ABUSE_EMAIL?.trim() ||
  'abuse@shortly.nayanswarnkar.com';

export const SECURITY_EMAIL =
  import.meta.env.VITE_SECURITY_EMAIL?.trim() ||
  'security@shortly.nayanswarnkar.com';

export const CONTACT_CHANNELS = [
  {
    id: 'support',
    label: 'General support',
    email: SUPPORT_EMAIL,
    description: 'Account help, bugs, and product questions.'
  },
  {
    id: 'abuse',
    label: 'Abuse reports',
    email: ABUSE_EMAIL,
    description: 'Phishing, malware, spam, or policy violations on short links.'
  },
  {
    id: 'security',
    label: 'Security disclosures',
    email: SECURITY_EMAIL,
    description: 'Vulnerability reports and coordinated disclosure.'
  }
];
