import { useState, useRef } from 'react';
import haptics from './haptics';

export const usePullToRefresh = (onRefresh) => {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const pullThreshold = 100;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (window.scrollY === 0 && touchStartY.current > 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY.current;
      
      if (diff > 0) {
        setPullY(Math.min(diff, pullThreshold));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullY >= pullThreshold) {
      setIsRefreshing(true);
      haptics.light();
      
      try {
        await onRefresh();
        haptics.success();
      } catch (error) {
        haptics.error();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullY(0);
    touchStartY.current = 0;
  };

  return {
    pullY,
    isRefreshing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }
  };
};

export default usePullToRefresh;