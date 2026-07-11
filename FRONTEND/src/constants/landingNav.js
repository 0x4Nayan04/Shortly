/** Shared landing nav / footer links (homepage sections + legal/trust). */
import { ROUTES } from './routes';

export const LANDING_SECTION_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' }
];

export const LANDING_LEGAL_LINKS = [
  { label: 'Terms', to: ROUTES.TERMS },
  { label: 'Privacy', to: ROUTES.PRIVACY },
  { label: 'Contact', to: ROUTES.CONTACT },
  { label: 'Report abuse', to: ROUTES.REPORT }
];

const LANDING_NAV_LINKS = [
  ...LANDING_SECTION_LINKS,
  ...LANDING_LEGAL_LINKS
];
