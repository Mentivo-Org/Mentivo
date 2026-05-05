import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import api from "../services/api";
import { LoginEndpoints } from "../constants/endpoint";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../services/retrieveKeys";

const imgCollaboration = "https://www.figma.com/api/mcp/asset/bef2805f-ad2c-4599-bec1-124f6f5af5de";
const imgContainer = "https://www.figma.com/api/mcp/asset/a7ed0853-06d5-48df-b102-0ed710e9f8f9"; // flag
const imgBack = "https://www.figma.com/api/mcp/asset/fa1718d1-671f-43a6-87ba-44b502b4814b"; // back arrow
const imgHome = "https://www.figma.com/api/mcp/asset/2109a1b7-ad92-4106-a223-13f25e8e2635";
const imgSessions = "https://www.figma.com/api/mcp/asset/b3ed79bc-1a8b-4a33-a1f6-3428ddc49608";
const imgMentors = "https://www.figma.com/api/mcp/asset/90cd303a-8c8e-49eb-af9b-05e5006a7c52";
const imgProfile = "https://www.figma.com/api/mcp/asset/c15cf6b2-3ecb-479f-ba35-39d0a991c121";
const imgArrow = "https://www.figma.com/api/mcp/asset/23b1798a-08bd-4364-9635-c03a005d60f7";

interface CompleteProfileProps {
  navigation?: any;
}

const CompleteProfile: React.FC<CompleteProfileProps> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("+91");
    const { setIsSignedIn } = useAuth();
    const route = useRoute<any>();
    const {full_name, email, idToken, role} = route.params;
  const handleSignUp = async () => {
    console.log("Completing profile with Google");
    try {
      // Call Node.js API
      const response = await api.post(LoginEndpoints.googleLogin, {
        idToken,
        mode: "sign-up",
        phone: phoneNumber,
        role
      });
      
      if (response.status === 200) {
        const { accessToken, refreshToken, user } = response.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        // After completing profile, we could go to Home or OTP
        // Assuming OTP for now as per original code
        navigation.navigate("SendOtp", {
          phone: phoneNumber
        });
      }
    } catch (error) {
      console.log("Complete Profile Failed", error);
      const errorMsg = error.response?.data?.error || "Profile completion failed";
      Alert.alert("Error", errorMsg);
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Image source={{ uri: imgBack }} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>IITian Mentor</Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.mainContent} contentContainerStyle={styles.mainContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.heading}>One last step</Text>
          <Text style={styles.subheading}>
            Finish setting up your account to start{"\n"}connecting with mentors.
          </Text>
        </View>

        <View style={styles.formSection}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.disabledInput}>
              <Text style={styles.disabledText}>{full_name}</Text>
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.disabledInput}>
              <Text style={styles.disabledText}>{email}</Text>
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.required}>* Required</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+91 00000 00000"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Visual Anchor */}
        <View style={styles.visualAnchor}>
          <ImageBackground source={{ uri: imgCollaboration }} style={styles.collaborationImage} resizeMode="cover">
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>
                Join over 10,000+ students already{"\n"}mentored by top IITians.
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.ctaButton} onPress={()=>handleSignUp()}>
          <Text style={styles.ctaText}>Complete User Profile</Text>
          <Image source={{ uri: imgArrow }} style={styles.arrowIcon} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  header: {
    height: 64,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 9999,
  },
  backIcon: {
    width: 16,
    height: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
    marginLeft: 12,
    letterSpacing: -0.45,
  },
  mainContent: {
    flex: 1,
    marginBottom: 80,
  },
  mainContainer: {
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 78.64,
    gap: 39,
  },
  headerSection: {
    gap: 4,
  },
  heading: {
    fontSize: 32,
    fontWeight: "600",
    color: "#0b1c30",
    letterSpacing: -0.32,
    lineHeight: 41.6,
  },
  subheading: {
    fontSize: 16,
    color: "#444653",
    lineHeight: 24,
  },
  formSection: {
    gap: 23,
    paddingBottom: 25,
  },
  inputGroup: {
    gap: 4.8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444653",
    height: 17,
    lineHeight: 16.8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  required: {
    fontSize: 12,
    fontWeight: "500",
    color: "#00288e",
  },
  disabledInput: {
    height: 48,
    backgroundColor: "#eff4ff",
    borderWidth: 1,
    borderColor: "#c4c5d5",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 17,
  },
  disabledText: {
    fontSize: 16,
    color: "#0b1c30",
  },
  inputContainer: {
    height: 48,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#757684",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 17,
  },
  flagIcon: {
    width: 15,
    height: 15,
    position: "absolute",
    left: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#6b7280",
  },
  visualAnchor: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
    height: 181.38,
  },
  collaborationImage: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 16,
  },
  overlayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "white",
    lineHeight: 20,
  },
  ctaButton: {
    height: 57,
    backgroundColor: "#00288e",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  ctaText: {
    fontSize: 18,
    color: "white",
  },
  arrowIcon: {
    width: 7.4,
    height: 12,
  },
});

export default CompleteProfile;