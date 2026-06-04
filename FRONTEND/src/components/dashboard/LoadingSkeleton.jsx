import { UrlTableSkeletonRow } from '../LoadingSpinner';
import { formCompoundClass } from '../../utils/designFormClasses';

const LoadingSkeleton = () => (
  <div
    className={`${formCompoundClass()} dashboard-links-list`}
    aria-busy="true"
    aria-label="Loading links"
  >
    <ul className="dashboard-links-list__items">
      {[1, 2, 3, 4].map((i) => (
        <UrlTableSkeletonRow key={i} />
      ))}
    </ul>
  </div>
);

export default LoadingSkeleton;
