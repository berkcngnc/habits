import { BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

/**
 * Registers a hardware back press handler scoped to the focused screen.
 * `handler` should return true to consume the event, false to let it propagate.
 * `deps` must list every value captured inside `handler`.
 */
export function useBackHandler(
  handler: () => boolean,
  deps: React.DependencyList,
): void {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', handler);
      return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps),
  );
}
