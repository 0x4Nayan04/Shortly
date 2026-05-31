import { useState } from 'react';
import CatalogVisualPanel from './CatalogVisualPanel';
import { LandingFrameInner } from './LandingFrame';

const CATALOG_ITEMS = [
  {
    num: '01',
    title: 'Instant shortening',
    slug: 'k9Xm2p',
    eyebrow: 'Paste a long URL',
    detail: 'Ready to copy & share',
    visual: 'shorten'
  },
  {
    num: '02',
    title: 'Custom aliases',
    slug: 'launch',
    eyebrow: 'Members · custom path',
    detail: 'Pick a path that fits your brand',
    visual: 'alias'
  },
  {
    num: '03',
    title: 'Click analytics',
    slug: 'k9Xm2p',
    eyebrow: 'Clicks over time · Last 7 days',
    stat: 'Total clicks · Countries · Referrers',
    visual: 'analytics'
  },
  {
    num: '04',
    title: 'QR export',
    slug: 'share',
    eyebrow: 'PNG · share',
    detail: 'Download a scannable short link',
    visual: 'qr'
  },
  {
    num: '05',
    title: 'Saved links',
    slug: 'k9Xm2p',
    eyebrow: 'Your links · All links',
    detail: 'Copy · Share · Delete selected',
    visual: 'manage'
  }
];

const LandingFeaturesCatalog = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = CATALOG_ITEMS[activeIndex] ?? CATALOG_ITEMS[0];

  return (
    <section
      id='features'
      className='scroll-mt-[calc(var(--nav-height)+var(--section-bar-height))]'
      aria-labelledby='features-heading'>
      <LandingFrameInner className='landing-section-intro catalog-intro'>
        <h2
          id='features-heading'
          className='landing-section-title text-ink'>
          All the pieces to share links smarter
        </h2>
        <p className='landing-section-lead max-w-xl'>
          Focused tools for shortening, customizing, tracking, and sharing —
          without the clutter of a full marketing suite.
        </p>
      </LandingFrameInner>

      <div className='landing-catalog-split'>
        <ol
          className='catalog-list m-0 list-none p-0'
          aria-label='Product features'>
          {CATALOG_ITEMS.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <li
                key={item.num}
                className='catalog-list-item'
                onMouseEnter={() => setActiveIndex(index)}>
                <button
                  type='button'
                  aria-pressed={isActive}
                  className={`catalog-row catalog-list-row outline-none${isActive ? ' catalog-row--active' : ''}`}
                  onClick={() => setActiveIndex(index)}>
                  <span className='catalog-row-num'>{item.num}</span>
                  <span className='catalog-row-label'>{item.title}</span>
                  <span
                    className='catalog-row-marker'
                    aria-hidden='true'
                  />
                </button>
              </li>
            );
          })}
        </ol>

        <div
          className='catalog-visual'
          aria-live='polite'
          aria-atomic='true'>
          <CatalogVisualPanel
            item={active}
            playKey={active.num}
          />
        </div>
      </div>
    </section>
  );
};

export default LandingFeaturesCatalog;
