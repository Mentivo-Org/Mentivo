import React from "react";
import { Text, View, StyleSheet } from "react-native";

export default  function StudentHomePage() {
    return (
        <View style={styles.container}>
            <Text>
                Hi, I am Ayan Bain
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
