import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    (navigationRef as any).navigate(name, params);
  } else {
    const checkReady = setInterval(() => {
      if (navigationRef.isReady()) {
        clearInterval(checkReady);
        (navigationRef as any).navigate(name, params);
      }
    }, 100);
    // Timeout after 5 seconds to avoid memory leaks
    setTimeout(() => clearInterval(checkReady), 5000);
  }
}
