import DashboardLinkRow from '../DashboardLinkRow';
import { formCompoundClass } from '../../utils/designFormClasses';
import { buildPublicShortUrl } from '../../utils/publicShortUrl';

const LinksList = ({
  myUrls,
  copiedCheck,
  deletingUrl,
  updatingUrl,
  selectedIds,
  handlers
}) => (
  <div className={`${formCompoundClass()} dashboard-links-list`}>
    <ul
      className="dashboard-links-list__items"
      aria-label="Your shortened links"
    >
      {myUrls.map((url) => (
        <DashboardLinkRow
          key={url._id}
          url={url}
          status={{
            copied: copiedCheck(buildPublicShortUrl(url.short_url)),
            deleting: deletingUrl === url._id,
            updating: updatingUrl === url._id,
            selected: selectedIds.has(url._id)
          }}
          onCopy={handlers.onCopy}
          onDelete={handlers.onDelete}
          onSelect={handlers.onSelect}
          onShare={handlers.onShare}
          onEdit={handlers.onEdit}
          onToggleDisabled={handlers.onToggleDisabled}
        />
      ))}
    </ul>
  </div>
);

export default LinksList;
