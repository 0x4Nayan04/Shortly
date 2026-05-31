import {
  getLandingCatalogShortHost,
  getPublicShortBaseUrl
} from '../../utils/publicShortUrl';

const SiteFooterBar = () => {
  const year = new Date().getFullYear();
  const host = getLandingCatalogShortHost();
  const base = getPublicShortBaseUrl();
  const href = base ? base : `https://${host}`;

  return (
    <footer className='bg-surface'>
      <div className='landing-footer-bar landing-frame-px'>
        <span className='landing-footer-bar__copy text-ink/80'>
          © {year} Shortly
        </span>
        <a
          href={href}
          className='landing-footer-bar__domain tabular-nums text-muted outline-none hover:text-primary'
          target='_blank'
          rel='noopener noreferrer'>
          {host}
        </a>
      </div>
    </footer>
  );
};

export default SiteFooterBar;
