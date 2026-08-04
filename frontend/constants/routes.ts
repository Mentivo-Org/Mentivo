// Screen names used by services/navigation.ts's `navigate`/`resetToScreen` helpers
// (i.e. navigation triggered from outside a screen's own `navigation` prop — call
// context, notification routing, floating call banner). These must match the
// `name` props registered in screens/RootNavigator.tsx.
export const Routes = {
  incomingCall: 'IncomingCall',
  inCall: 'InCall',
  chatPage: 'ChatPage',
  questionDetail: 'QuestionDetail',
  ratingScreen: 'RatingScreen',
  main: 'Main',
  home: 'Home',
} as const;
