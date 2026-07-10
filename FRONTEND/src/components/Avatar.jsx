import { memo, useCallback, useState } from 'react';

const Avatar = memo(
  ({
    src,
    label,
    className,
    imgClassName,
    fallbackClassName,
    fallbackTextClassName,
    wrapperClassName,
    width,
    height
  }) => {
    const [failedSrc, setFailedSrc] = useState(null);
    const showFallback = !src || failedSrc === src;
    const initial = (label || 'U').charAt(0).toUpperCase();

    const handleError = useCallback(() => {
      setFailedSrc(src);
    }, [src]);

    const inner = (
      <>
        {src && !showFallback ? (
          <img
            src={src}
            alt=""
            width={width}
            height={height}
            className={imgClassName}
            onError={handleError}
          />
        ) : null}
        {showFallback ? (
          <span className={fallbackClassName} aria-hidden="true">
            {fallbackTextClassName ? (
              <span className={fallbackTextClassName}>{initial}</span>
            ) : (
              initial
            )}
          </span>
        ) : null}
      </>
    );

    if (wrapperClassName) {
      return <div className={wrapperClassName}>{inner}</div>;
    }

    return <span className={className}>{inner}</span>;
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
