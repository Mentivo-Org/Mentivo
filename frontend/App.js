import React from 'react';
import { StyleSheet} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './services/retrieveKeys';
import RootNavigator from './screens/RootNavigator';


export default function App() {

  return (
    <SafeAreaProvider>
    <AuthProvider>
      <RootNavigator/>
    </AuthProvider>
    </SafeAreaProvider>
  );
}
