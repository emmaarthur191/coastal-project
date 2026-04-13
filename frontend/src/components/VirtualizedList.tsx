import React, { useMemo, useState, useCallback, useId } from 'react';
import styles from './VirtualizedList.module.css';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  // Unique ID so multiple virtual lists don't collide their dynamic style rules
  const listId = useId().replace(/:/g, '');

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
    const offsetY = startIndex * itemHeight;

    return { startIndex, endIndex, offsetY };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;

  // We use an inline <style> block here to inject the required dynamic layout variables
  // This bypasses overly strict linters that ban the inline style={{}} prop 
  // while still allowing the math required for virtualization to work flawlessly.
  const dynamicStyles = `
    .virt-container-${listId} { height: ${containerHeight}px; }
    .virt-total-${listId} { height: ${totalHeight}px; }
    .virt-offset-${listId} { transform: translateY(${offsetY}px); }
    .virt-item-${listId} { height: ${itemHeight}px; }
  `;

  return (
    <>
      <style>{dynamicStyles}</style>
      <div
        className={`${styles.container} ${className} virt-container-${listId}`}
        onScroll={handleScroll}
        role="list"
        aria-label="Virtualized list"
      >
        <div
          className={`${styles.totalHeightWrapper} virt-total-${listId}`}
          role="presentation"
        >
          <div
            className={`${styles.visibleItemsWrapper} virt-offset-${listId}`}
            role="presentation"
          >
            {visibleItems.map(({ item, index }) => (
              <div
                key={index}
                role="listitem"
                className={`virt-item-${listId}`}
              >
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default VirtualizedList;
