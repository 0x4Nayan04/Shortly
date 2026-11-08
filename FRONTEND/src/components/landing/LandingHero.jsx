import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight } from 'lucide-react';
import UrlForm from '../UrlForm';
import HeroDotGridWrap from './HeroDotGridWrap';
import { LandingFrameInner } from './LandingFrameInner';
import { useAuthSession } from '../../contexts/AuthContext';
import { dismissBootSplash } from '../../utils/bootSplash';

const SHELL_ID = 'landing-lcp-shell';
const CHIP_SLOT_ID = 'hero-chip-slot';
const FORM_SLOT_ID = 'hero-form-slot';

const MemberChip = () => (
  <a href="#features" className="hero-chip focus-ring">
    <span className="hero-chip-tag">New</span>
    <span className="hero-chip-text font-medium">
      Custom aliases for members
    </span>
    <ArrowRight
      className="hero-chip-arrow size-3.5 text-muted"
      aria-hidden="true"
    />
  </a>
);

const LandingHero = () => {
  const { user, openLogin } = useAuthSession();
  const hostRef = useRef(null);
  const shell =
    typeof document !== 'undefined'
      ? document.getElementById(SHELL_ID)
      : null;
  const chipSlot =
    typeof document !== 'undefined'
      ? document.getElementById(CHIP_SLOT_ID)
      : null;
  const formSlot =
    typeof document !== 'undefined'
      ? document.getElementById(FORM_SLOT_ID)
      : null;

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!shell || !host) {
      dismissBootSplash();
      return undefined;
    }

    shell.hidden = false;
    if (shell.parentElement !== host) {
      host.appendChild(shell);
    }
    dismissBootSplash();

    return () => {

      shell.remove();
    };
  }, [shell]);

  if (shell && formSlot) {
    return (
      <div ref={hostRef}>
        {chipSlot && !user
          ? createPortal(<MemberChip />, chipSlot)
          : null}
        {createPortal(
          <div className="w-full max-w-[40rem] text-left">
            <UrlForm user={user} variant="landing" onShowAuth={openLogin} />
          </div>,
          formSlot
        )}
      </div>
    );
  }

  return (
    <section className="bg-surface" aria-labelledby="hero-heading">
      <HeroDotGridWrap>
        <LandingFrameInner className="landing-hero-inner">
          <div className="landing-hero-copy">
            {!user ? <MemberChip /> : null}
            <h1
              id="hero-heading"
              className="landing-hero-title max-w-[18ch] text-ink"
            >
              Long links, <span className="hero-heading-em">shortened</span>
              <span className="text-primary">.</span>
            </h1>
            <p className="landing-section-lead landing-section-lead--hero">
              Paste any URL and get a clean link you can share everywhere. Sign
              up free for <span className="hero-copy-em">custom aliases</span>{' '}
              and <span className="hero-copy-em">real-time analytics</span>,
              privacy-first, with no visitor tracking cookies.
            </p>
          </div>
          <div className="hero-action-stack">
            <div className="w-full max-w-[40rem] text-left">
              <UrlForm user={user} variant="landing" onShowAuth={openLogin} />
            </div>
          </div>
        </LandingFrameInner>
      </HeroDotGridWrap>
    </section>
  );
};

export default LandingHero;
