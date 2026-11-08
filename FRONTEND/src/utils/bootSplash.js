const BOOT_SPLASH_ID = 'app-boot-splash';


export function dismissBootSplash() {
  const splash = document.getElementById(BOOT_SPLASH_ID);
  if (!splash || splash.dataset.dismissed === '1') return;

  splash.dataset.dismissed = '1';
  splash.classList.add('app-boot-splash--done');
  splash.setAttribute('aria-hidden', 'true');

  const remove = () => {
    splash.remove();
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    remove();
    return;
  }

  window.setTimeout(remove, 220);
}
