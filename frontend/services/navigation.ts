import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

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

export function resetToScreen(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name, params }],
      })
    );
  }
}

// Tracks the chat session the user is currently viewing.
// Set by ChatPage on mount; cleared on unmount.
// Used to suppress push notifications for the open session.
let _activeChatSessionId: string | null = null;

export function setActiveChatSession(sessionId: string | null) {
  _activeChatSessionId = sessionId;
}

export function getActiveChatSessionId(): string | null {
  return _activeChatSessionId;
}

