const INSTRUMENT_SERIF_HREF =
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap';

/** Loads Instrument Serif for auth screens only (not needed on landing LCP path). */
export function loadInstrumentSerifFont() {
  if (typeof document === 'undefined') return;

  if (document.querySelector('link[data-font="instrument-serif"]')) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = INSTRUMENT_SERIF_HREF;
  link.dataset.font = 'instrument-serif';
  document.head.appendChild(link);
}
