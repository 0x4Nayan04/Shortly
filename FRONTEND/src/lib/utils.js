/** Minimal className merge — shadcn-compatible */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
