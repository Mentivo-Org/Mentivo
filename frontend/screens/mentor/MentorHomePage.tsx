import React from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../services/retrieveKeys";

export default  function MentorHomePage() {
    const { handleLogout } = useAuth();
    return (
        <View style={styles.container}>
            <Text>
                Hi, I am a Mentor
            </Text>
            <TouchableOpacity style={{backgroundColor: 'lightgrey', paddingHorizontal: 10, borderRadius: 10, marginTop: 10, paddingVertical: 5}} onPress={()=>handleLogout()}>
                <Text style={{fontSize: 30}}>
                    Log out
                </Text>
            </TouchableOpacity>
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
