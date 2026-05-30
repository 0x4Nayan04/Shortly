import {
  getLandingCatalogShortHost,
  splitShortHostForDisplay
} from '../../utils/publicShortUrl';
import CatalogLinkVisual from './CatalogLinkVisual';

const CatalogVisualPanel = ({ item, playKey, compact = false }) => {
  const host = getLandingCatalogShortHost();
  const { lead, trail } = splitShortHostForDisplay(host);

  return (
    <>
      <div className='catalog-visual-grid' />
      <CatalogLinkVisual
        variant={item.visual}
        playKey={playKey}
        staticMode={true}
      />
      <div className='catalog-visual-corners'>
        <span className='catalog-visual-corner' />
        <span className='catalog-visual-corner' />
      </div>
      <div
        className='catalog-visual-body'
        key={item.num}>
        {!compact ? <p className='catalog-visual-eyebrow'>{item.eyebrow}</p> : null}
        <p className='catalog-visual-link'>
          <span className='catalog-visual-link-host'>
            {lead}
            {trail ? <span>{trail}</span> : null}
            <span className='catalog-visual-link-slash'>/</span>
          </span>
          <span className='catalog-visual-link-slug'>{item.slug}</span>
        </p>
        {!compact && item.stat ? <p className='catalog-visual-stat'>{item.stat}</p> : null}
        {!compact && item.detail ? (
          <p className='catalog-visual-detail'>{item.detail}</p>
        ) : null}
      </div>
      <div className='catalog-visual-footer'>
        <span className='catalog-visual-corner' />
        <p className='catalog-visual-progress'>
          {item.num}
          <span className='catalog-visual-progress-sep'>/</span>
          <span className='catalog-visual-progress-total'>05</span>
        </p>
      </div>
    </>
  );
};

export default CatalogVisualPanel;
