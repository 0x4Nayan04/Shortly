/** Shared landing nav / footer links (homepage sections + privacy). */
export const LANDING_SECTION_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' }
];

export const LANDING_NAV_LINKS = [
  ...LANDING_SECTION_LINKS,
  { label: 'Privacy', to: '/privacy' }
];
