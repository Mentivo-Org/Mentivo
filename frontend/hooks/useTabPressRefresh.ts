import { useEffect } from 'react';

export function useTabPressRefresh(navigation: any, handleRefresh: () => void) {
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e: any) => {
      if (navigation.isFocused()) {
        handleRefresh();
      }
    });
    return unsubscribe;
  }, [navigation, handleRefresh]);
}
