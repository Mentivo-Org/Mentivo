import { createNavigationContainerRef, CommonActions, StackActions } from '@react-navigation/native';
import { Routes } from '../constants/routes';

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

export function getCurrentRoute() {
  return navigationRef.isReady() ? navigationRef.getCurrentRoute() : undefined;
}

/**
 * Single entry point for notification-driven call navigation.
 *
 * Plain `navigate` is wrong for the call screens in two ways:
 *  - repeated notification presses re-deliver params to the focused screen,
 *    which re-runs param-keyed effects (ringtone restart, duplicate /ringing);
 *  - accepting from the notification tray pushes InCall *on top of* a live
 *    IncomingCall, so the ringing screen never unmounts and its ringtone and
 *    call_status_changed listener survive to race the real teardown.
 *
 * So: same screen + same call is a no-op, IncomingCall -> InCall replaces, and
 * everything else falls through to `navigate` (which reuses an existing route of
 * the same name rather than pushing a duplicate).
 */
export function navigateToCallScreen(name: string, params?: any) {
  if (!navigationRef.isReady()) {
    navigate(name, params);
    return;
  }

  const current = getCurrentRoute();
  if (current?.name === name) {
    const currentCallId = (current.params as any)?.callId;
    if (!params?.callId || currentCallId === params.callId) return;
  }

  if (current?.name === Routes.incomingCall && name === Routes.inCall) {
    navigationRef.dispatch(StackActions.replace(name, params));
    return;
  }

  navigate(name, params);
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

