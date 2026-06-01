import {
  SHORTLY_LOGO_HOVER_SRC,
  SHORTLY_LOGO_MARK_SRC,
  SHORTLY_LOGO_SRC
} from '../constants/brand';

/**
 * @param {{ variant?: 'full' | 'mark', className?: string }} props
 */
const ShortlyLogo = ({ variant = 'full', className = '' }) => {
  const isMark = variant === 'mark';
  const src = isMark ? SHORTLY_LOGO_MARK_SRC : SHORTLY_LOGO_SRC;
  const hoverSrc = isMark ? SHORTLY_LOGO_MARK_SRC : SHORTLY_LOGO_HOVER_SRC;
  const width = isMark ? 28 : 124;

  return (
    <span
      className={`shortly-logo ${isMark ? 'shortly-logo--mark' : 'shortly-logo--full'} ${className}`.trim()}
      aria-hidden='true'>
      <img
        src={src}
        alt=''
        className='shortly-logo-img shortly-logo-img--default'
        width={width}
        height={28}
        sizes={isMark ? '28px' : '124px'}
        decoding='async'
      />
      <img
        src={hoverSrc}
        alt=''
        className='shortly-logo-img shortly-logo-img--hover'
        width={width}
        height={28}
        sizes={isMark ? '28px' : '124px'}
        decoding='async'
      />
    </span>
  );
};

export default ShortlyLogo;
