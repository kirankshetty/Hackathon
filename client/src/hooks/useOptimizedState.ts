import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Custom hook for optimized form state management
export function useOptimizedFormState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const queryClient = useQueryClient();

  const updateState = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setState(prev => {
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  // Memoize the state object to prevent unnecessary re-renders
  const memoizedState = useMemo(() => state, [state]);

  // Optimistic updates for better UX
  const optimisticUpdate = useCallback((
    queryKey: string[],
    optimisticData: any,
    rollbackData?: any
  ) => {
    queryClient.setQueryData(queryKey, optimisticData);
    
    return {
      rollback: () => {
        if (rollbackData) {
          queryClient.setQueryData(queryKey, rollbackData);
        } else {
          queryClient.invalidateQueries({ queryKey });
        }
      }
    };
  }, [queryClient]);

  return {
    state: memoizedState,
    updateState,
    resetState,
    optimisticUpdate
  };
}

// Hook for debounced state updates (useful for search inputs)
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void, T] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  const updateValue = useCallback((newValue: T) => {
    setValue(newValue);
    
    const timeoutId = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [delay]);

  return [value, updateValue, debouncedValue];
}

// Hook for managing array state with optimizations
export function useOptimizedArrayState<T extends { id: string }>(initialArray: T[] = []) {
  const [items, setItems] = useState<T[]>(initialArray);

  const addItem = useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const reorderItems = useCallback((fromIndex: number, toIndex: number) => {
    setItems(prev => {
      const newItems = [...prev];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      return newItems;
    });
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  // Memoized derived state
  const itemCount = useMemo(() => items.length, [items.length]);
  const itemIds = useMemo(() => items.map(item => item.id), [items]);

  return {
    items,
    addItem,
    updateItem,
    removeItem,
    reorderItems,
    clearItems,
    itemCount,
    itemIds,
    setItems
  };
}