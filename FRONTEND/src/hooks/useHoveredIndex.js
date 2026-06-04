import { useState } from 'react';

export const useHoveredIndex = () => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const hoverHandlers = (idx) => ({
    onMouseEnter: () => setHoveredIdx(idx),
    onMouseLeave: () => setHoveredIdx(null),
    onFocus: () => setHoveredIdx(idx),
    onBlur: () => setHoveredIdx(null),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') setHoveredIdx(idx);
    },
    tabIndex: 0
  });

  return { hoveredIdx, hoverHandlers };
};
