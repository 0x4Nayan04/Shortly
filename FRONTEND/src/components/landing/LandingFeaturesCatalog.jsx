import { useEffect, useRef, useState } from 'react';
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
    title: 'Traffic analytics',
    slug: 'traffic',
    eyebrow: 'Dashboard · 7-day breakdown',
    stat: 'Clicks, countries & referrers',
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
    slug: 'saved',
    eyebrow: 'Dashboard · manage URLs',
    detail: 'Copy, delete, or bulk remove',
    visual: 'manage'
  }
];

const LandingFeaturesCatalog = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef([]);
  const active = CATALOG_ITEMS[activeIndex] ?? CATALOG_ITEMS[0];

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;
    const observers = [];

    stepRefs.current.forEach((step, index) => {
      if (!step) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIndex(index);
        },
        {
          threshold: 0.55,
          rootMargin: '-10% 0px -20% 0px'
        }
      );
      observer.observe(step);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

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

      <div className='catalog-scrolly md:hidden'>
        <div className='catalog-scrolly-scroll'>
          {CATALOG_ITEMS.map((item, index) => {
            const isActive = index === activeIndex;
            const detail = item.detail ?? item.stat;
            return (
              <article
                key={item.num}
                ref={(element) => {
                  stepRefs.current[index] = element;
                }}
                className={`catalog-scrolly-step${isActive ? ' catalog-scrolly-step--active' : ''}`}>
                <div className='catalog-scrolly-step-inner'>
                  <span className='catalog-scrolly-step-num'>{item.num}</span>
                  <div className='catalog-scrolly-step-copy'>
                    <div className='catalog-scrolly-step-head'>
                      <h3 className='catalog-scrolly-step-title'>{item.title}</h3>
                    </div>
                    {detail ? <p className='catalog-scrolly-step-desc'>{detail}</p> : null}
                  </div>
                  <span
                    className='catalog-scrolly-step-marker'
                    aria-hidden='true'
                  />
                </div>
                <div className='catalog-scrolly-step-mobile-visual'>
                  <div className='catalog-visual catalog-visual--scrolly'>
                    <CatalogVisualPanel
                      item={item}
                      playKey={item.num}
                      compact={true}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className='landing-catalog-split hidden md:grid'>
        <ol
          className='catalog-list list-none m-0 p-0'
          aria-label='Product features'>
          {CATALOG_ITEMS.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <li
                key={item.num}
                className='catalog-list-item'>
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
