const SiteFooterBar = () => {
  const year = new Date().getFullYear();

  return (
    <footer className='bg-surface'>
      <div className='landing-footer-bar landing-frame-px'>
        <span className='landing-footer-bar__copy text-ink/80'>
          © {year} Shortly
        </span>
        <a
          href='https://shortly.nayan04.me'
          className='landing-footer-bar__domain tabular-nums text-muted outline-none hover:text-primary'
          target='_blank'
          rel='noopener noreferrer'>
          shortly.nayan04.me
        </a>
      </div>
    </footer>
  );
};

export default SiteFooterBar;
