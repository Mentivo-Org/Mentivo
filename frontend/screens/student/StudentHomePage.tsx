import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Text, View, StyleSheet } from "react-native";

export default  function StudentHomePage() {
    const user = AsyncStorage.getItem('user');
    return (
        <View style={styles.container}>
            <Text>
                Hi, I am Ayan Bain
            </Text>
            <Text>
                {user}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
