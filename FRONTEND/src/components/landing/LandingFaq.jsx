import { useId, useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { LandingFrameInner } from './LandingFrame';

const FAQ_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'links', label: 'Links' },
  { id: 'pricing', label: 'Pricing' }
];

const FAQ_ITEMS = [
  {
    q: 'Do I need an account to shorten a URL?',
    a: 'No. Paste a link on the homepage and shorten it instantly. Sign in when you want saved links, custom aliases, and click analytics.',
    category: 'accounts'
  },
  {
    q: 'Can I use my own short path?',
    a: 'Yes — after you sign in, turn on custom alias and choose a slug between 3 and 20 characters (letters, numbers, hyphens, underscores).',
    category: 'links'
  },
  {
    q: 'Is Shortly free?',
    a: 'Core shortening is free for everyone. Accounts add management, analytics, and QR downloads at no extra complexity.',
    category: 'pricing'
  },
  {
    q: 'Where do my links live?',
    a: 'Anonymous links work immediately. Signed-in links appear in your dashboard so you can copy, share, or delete them anytime.',
    category: 'links'
  }
];

const FaqItem = ({
  item,
  displayIndex,
  isOpen,
  onToggle,
  panelId,
  buttonId
}) => (
  <button
    type="button"
    id={buttonId}
    className={`faq-item focus-visible:shadow-[var(--shadow-focus)] outline-none ${isOpen ? 'faq-item-open' : ''}`}
    onClick={onToggle}
    aria-expanded={isOpen}
    aria-controls={panelId}>
    <div
      className={`faq-item-trigger ${isOpen ? 'faq-item-trigger-open' : ''}`}
      aria-hidden='true'>
      <span
        className={`faq-item-num ${isOpen ? 'faq-item-num-open' : ''}`}
        aria-hidden='true'>
        {String(displayIndex + 1).padStart(2, '0')}
      </span>
      <span className='faq-item-question'>{item.q}</span>
      {isOpen ? (
        <Minus
          className='faq-item-icon faq-item-icon-open'
          aria-hidden='true'
        />
      ) : (
        <Plus
          className='faq-item-icon'
          aria-hidden='true'
        />
      )}
    </div>
    {isOpen && (
      <div
        id={panelId}
        role='region'
        aria-labelledby={buttonId}
        className='faq-item-panel'>
        <p className='faq-item-answer'>{item.a}</p>
      </div>
    )}
  </button>
);

const LandingFaq = () => {
  const baseId = useId();
  const [activeCategory, setActiveCategory] = useState('all');
  const [openKey, setOpenKey] = useState(FAQ_ITEMS[0].q);

  const visibleItems = useMemo(
    () =>
      activeCategory === 'all'
        ? FAQ_ITEMS
        : FAQ_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    const nextItems =
      categoryId === 'all'
        ? FAQ_ITEMS
        : FAQ_ITEMS.filter((item) => item.category === categoryId);
    if (nextItems.length > 0 && !nextItems.some((item) => item.q === openKey)) {
      setOpenKey(nextItems[0].q);
    }
  };

  return (
    <section
      id='faq'
      className='scroll-mt-[calc(var(--nav-height)+var(--section-bar-height))]'
      aria-labelledby='faq-heading'>
      <LandingFrameInner className='landing-section-intro'>
        <div className='faq-intro-row'>
          <div className='faq-intro-heading'>
            <p className='faq-eyebrow'>Frequently asked questions</p>
            <h2
              id='faq-heading'
              className='faq-title'>
              The fine print,{' '}
              <span className='text-primary'>in plain English.</span>
            </h2>
          </div>
        </div>
      </LandingFrameInner>

      <LandingFrameInner>
        <div
          className='faq-filters'
          role='tablist'
          aria-label='Filter questions by topic'
          style={{ justifyContent: 'flex-start', marginTop: '0', marginBottom: '0.75rem' }}>
        {FAQ_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type='button'
            role='tab'
            aria-selected={activeCategory === cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`faq-filter focus-visible:shadow-[var(--shadow-focus)] outline-none ${
              activeCategory === cat.id ? 'faq-filter-active' : ''
            }`}>
            {cat.label}
          </button>
        ))}
      </div>
      </LandingFrameInner>

      <div className='faq-list'>
        {visibleItems.map((item, index) => (
          <FaqItem
            key={item.q}
            item={item}
            displayIndex={index}
            isOpen={openKey === item.q}
            onToggle={() =>
              setOpenKey((prev) => (prev === item.q ? '' : item.q))
            }
            buttonId={`${baseId}-btn-${item.q}`}
            panelId={`${baseId}-panel-${item.q}`}
          />
        ))}
      </div>
    </section>
  );
};

export default LandingFaq;
