import { useMemo, useState } from 'react';
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
    id: 'account-required',
    q: 'Do I need an account to shorten a URL?',
    a: 'No. Paste a link on the homepage and shorten it instantly. Sign in when you want saved links, custom aliases, and click analytics.',
    category: 'accounts'
  },
  {
    id: 'custom-alias',
    q: 'Can I use my own short path?',
    a: 'Yes — after you sign in, turn on custom alias and choose a slug between 3 and 20 characters (letters, numbers, hyphens, underscores).',
    category: 'links'
  },
  {
    id: 'pricing',
    q: 'Is Shortly free?',
    a: 'Core shortening is free for everyone. Accounts add management, analytics, and QR downloads at no extra complexity.',
    category: 'pricing'
  },
  {
    id: 'link-storage',
    q: 'Where do my links live?',
    a: 'Anonymous links work immediately and are saved on this device. Sign in to move them to your dashboard where you can copy, share, or delete them anytime.',
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
  <div className={`faq-item ${isOpen ? 'faq-item-open' : ''}`}>
    <button
      type='button'
      id={buttonId}
      aria-expanded={isOpen}
      aria-controls={panelId}
      onClick={onToggle}
      className={`faq-item-trigger focus-ring ${
        isOpen ? 'faq-item-trigger-open' : ''
      }`}>
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
    </button>
    {isOpen && (
      <div
        id={panelId}
        role='region'
        aria-labelledby={buttonId}
        className='faq-item-panel'>
        <p className='faq-item-answer'>{item.a}</p>
      </div>
    )}
  </div>
);

const LandingFaq = () => {
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
              The fine print, in plain English.
            </h2>
          </div>

          <div
            className='faq-filters shrink-0'
            role='tablist'
            aria-label='Filter questions by topic'>
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type='button'
                role='tab'
                aria-selected={activeCategory === cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`faq-filter focus-ring ${
                  activeCategory === cat.id ? 'faq-filter-active' : ''
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </LandingFrameInner>

      <div className='faq-list'>
        {visibleItems.map((item, index) => (
          <FaqItem
            key={item.id}
            item={item}
            displayIndex={index}
            isOpen={openKey === item.q}
            onToggle={() =>
              setOpenKey((prev) => (prev === item.q ? '' : item.q))
            }
            buttonId={`faq-btn-${item.id}`}
            panelId={`faq-panel-${item.id}`}
          />
        ))}
      </div>
    </section>
  );
};

export default LandingFaq;
