import { memo } from 'react';
import { Link2 } from 'lucide-react';
import {
  buildPublicShortUrl,
  getShortLinkDisplayParts
} from '../../utils/publicShortUrl';

const TopUrls = memo(({ urls }) => {
  if (!urls?.length) {
    return (
      <div className='top-urls-empty'>
        <Link2
          className='top-urls-empty__icon'
          strokeWidth={1.5}
          aria-hidden='true'
        />
        <p className='top-urls-empty__text'>No links yet</p>
        <p className='top-urls-empty__hint'>
          Create links to see top performers
        </p>
      </div>
    );
  }

  return (
    <ul className='top-urls-list'>
      {urls.map((url, index) => {
        const shortUrlFull = buildPublicShortUrl(url.short_url);
        const { hostLead, hostTrail, slug } = getShortLinkDisplayParts(
          url.short_url
        );

        return (
          <li
            key={url._id}
            className='top-url-item'>
            <span className='top-url-item__rank'>{index + 1}</span>
            <div className='top-url-item__body'>
              <div
                className='top-url-item__short'
                title={shortUrlFull}>
                {hostLead ? (
                  <span className='top-url-item__short-inner'>
                    <span className='top-url-item__host top-url-item__host--truncate'>
                      {hostLead}
                    </span>
                    {hostTrail ? (
                      <span className='top-url-item__host'>{hostTrail}</span>
                    ) : null}
                    <span className='top-url-item__slug'>/</span>
                    <span className='top-url-item__slug'>{slug}</span>
                  </span>
                ) : (
                  <span className='top-url-item__short-fallback'>/{slug}</span>
                )}
              </div>
              <p
                className='top-url-item__dest'
                title={url.full_url}>
                {url.full_url}
              </p>
            </div>
            <p className='top-url-item__clicks'>
              <span className='top-url-item__clicks-value'>{url.click}</span>
              <span className='top-url-item__clicks-label'>
                {url.click === 1 ? 'click' : 'clicks'}
              </span>
            </p>
          </li>
        );
      })}
    </ul>
  );
});

TopUrls.displayName = 'TopUrls';

export default TopUrls;
