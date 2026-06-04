import { Link2 } from 'lucide-react';
import { EmptyState } from '../UxEnhancements';

const LinksEmpty = ({ debouncedSearch }) => {
  const message = debouncedSearch
    ? `No links match "${debouncedSearch}".`
    : 'Shorten a link above to get started.';
  return (
    <EmptyState
      icon={
        <Link2
          className="size-12 text-primary"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      }
      title={debouncedSearch ? 'No results' : 'No links yet'}
      description={message}
      variant="illustrated"
    />
  );
};

export default LinksEmpty;
