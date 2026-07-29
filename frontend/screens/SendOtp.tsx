import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  AppState,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Image } from "expo-image";
import api from "../services/api";
import { ForgotPassEndpoints, LoginEndpoints } from "../constants/endpoint";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../services/retrieveKeys";
import DialogBox from "../components/DialogBox";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SendOtpScreen = () => {
  const { showLoading, hideLoading } = useLoading();
  const { setIsSignedIn, setRole, requestNotificationPermissions, setUser } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { email, name, role, phone, forgotPass, serverTime } = route.params;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<any>([]);
  
  // Timer State
  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  
  // Calculate initial offset if serverTime is provided, otherwise default to 0
  const initialOffset = serverTime ? serverTime - Date.now() : 0;
  const offsetRef = useRef<number>(initialOffset);
  const endTimeRef = useRef<number | null>(Date.now() + offsetRef.current + 60000);
  
  const [resend, setResend] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [alertData, setAlertData] = useState({ title: "", message: "" });
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const maskEmail = (email: string) => {
    if (!email || !email.includes("@")) return email;

    const [localPart, domain] = email.split("@");

    let maskedLocal;

    if (localPart.length <= 2) {
      // For short names like "ab@domain.com" -> "a*@domain.com"
      maskedLocal = localPart[0] + "*";
    } else if (localPart.length <= 4) {
      // For short names like "abc@domain.com" -> "ab*@domain.com"
      maskedLocal = localPart.slice(0, localPart.length - 1) + "*";
    } else {
      // Keeps the first and last two characters, masks everything in between
      const firstChars = localPart[0] + localPart[1];
      const lastChars =
        localPart[localPart.length - 2] + localPart[localPart.length - 1];
      const maskLength = localPart.length - 4;

      maskedLocal = firstChars + "*".repeat(maskLength) + lastChars;
    }

    return `${maskedLocal}@${domain}`;
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setAlertData({ title: "OTP Error", message: "Fill all the fields" });
      setAlertVisible(true);
      return;
    }
    showLoading("Verifying OTP...");
    try {
      if (forgotPass === true) {
        const response = await api.post(ForgotPassEndpoints.verifyOtp, {email, token: otpString});
        if(response.status===200) {
          navigation.replace("ResetPassword", {accessToken: response.data?.accessToken, role});
        }
        else {

        }
      } else {
        const response = await api.post(LoginEndpoints.verifyOtp, {
          email,
          token: otpString,
          name,
          phone,
          role,
        });
        if (response.status === 200) {
          const { accessToken, refreshToken, user } = response.data;
          await AsyncStorage.setItem("accessToken", accessToken);
          await AsyncStorage.setItem("refreshToken", refreshToken);
          await AsyncStorage.setItem("verifiedEmail", "true");

          // If profile is already completed, log them in directly
          if (user?.profile_completed === true) {
            await setUser(user);
            await AsyncStorage.setItem("role", user.role);
            setRole(user.role);
            requestNotificationPermissions();
            setIsSignedIn(true);
          } else {
            // New user — proceed to CompleteProfile
            if (role === "mentor") {
              const iit = await api.post(LoginEndpoints.getIIT, { email });
              if (iit.status === 200) {
                navigation.navigate("CompleteProfile", {
                  full_name: name,
                  role,
                  email,
                  phone,
                  iit: iit.data?.name_of_iit,
                });
              } else {
                setAlertData({
                  title: "Could not fetch IIT name",
                  message: iit.data?.error,
                });
                setAlertVisible(true);
              }
            } else {
              navigation.navigate("CompleteProfile", {
                full_name: name,
                role,
                email,
                phone,
              });
            }
          }
        }
        else {
          setAlertData({title: "Invalid OTP", message: "Please try again"});
          setAlertVisible(true);
          setOtp(["", "", "", "", "", ""]);
          inputs.current[0].focus();
        }
      }
    } catch (error) {
      setAlertData({
        title: "Verification Failed",
        message: "Please check your OTP and try again.",
      });
      setAlertVisible(true);
    } finally {
      hideLoading();
    }
  };

  const handleResend = async () => {
    if (secondsLeft === 0) {
      await resendOtp();
    }
  };

  const resendOtp = async () => {
    showLoading("Resending OTP...");
    try {
      const response = await api.post(LoginEndpoints.resendOtp, { email });
      if (response.status === 201 || response.status === 200) {
        offsetRef.current = response.data.serverTime ? response.data.serverTime - Date.now() : 0;
        endTimeRef.current = Date.now() + offsetRef.current + 60000;
        setSecondsLeft(60);
        setResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputs.current[0].focus();
        startTimer();
      } else {
        setAlertData({
          title: "Resend OTP Failed",
          message: response.data?.error,
        });
        setAlertVisible(true);
      }
    } catch (error) {
      setAlertData({
        title: "Resend Failed",
        message: "Could not resend OTP. Please try again.",
      });
      setAlertVisible(true);
    } finally {
      hideLoading();
    }
  };

  const calculateTimeLeft = useCallback(() => {
    if (!endTimeRef.current) return 0;
    const currentAdjustedTime = Date.now() + offsetRef.current;
    const diff = Math.floor((endTimeRef.current - currentAdjustedTime) / 1000);
    return Math.max(0, diff);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSecondsLeft(calculateTimeLeft());
    
    timerRef.current = setInterval(() => {
      const remaining = calculateTimeLeft();
      setSecondsLeft(remaining);
      
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setResend(false);
      }
    }, 1000);
  }, [calculateTimeLeft]);

  // Initial timer start
  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  // Handle AppState changes (background to foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        const remaining = calculateTimeLeft();
        setSecondsLeft(remaining);
        if (remaining > 0) {
          startTimer();
        } else {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [calculateTimeLeft, startTimer]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : (isKeyboardVisible ? "height" : undefined)}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>OTP Verification</Text>
        </View>

        <View style={styles.container}>
          <View style={styles.illustrationContainer}>
            <View style={styles.iconCircle}>
              <Image
                source={require("../app-assets/shield-icon.svg")}
                style={styles.shieldIcon}
              />
            </View>
          </View>

          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to {maskEmail(email)}
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputs.current[index] = ref; }}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={() => handleResend()}>
              <Text
                style={[
                  styles.resendAction,
                  secondsLeft === 0 ? { color: "blue" } : {},
                ]}
              >
                Resend {secondsLeft !== 0 ? `in ${secondsLeft}s` : "code"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.brandContainer}>
            <Text style={styles.brandText}>NETWORK SECURE LOGIN</Text>
          </View>

          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => handleSubmit()}
          >
            <Text style={styles.verifyText}>Verify & Continue</Text>
            <Image
              source={require("../app-assets/arrow-right-white.svg")}
              style={styles.arrowIcon}
              tintColor="white"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <DialogBox
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertVisible(false)}
        visible={alertVisible}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 50,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: "#0077CB",
    fontSize: 16,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  illustrationContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e5eeff",
    justifyContent: "center",
    alignItems: "center",
  },
  shieldIcon: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0b1c30",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#444653",
    textAlign: "center",
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#c4c5d5",
    borderRadius: 8,
    fontSize: 24,
    fontWeight: "bold",
    color: "#0b1c30",
  },
  resendContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: "#444653",
  },
  resendAction: {
    fontSize: 14,
    color: "#0077CB",
    fontWeight: "600",
  },
  brandContainer: {
    opacity: 0.5,
    marginBottom: 40,
  },
  brandText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#757684",
    letterSpacing: 1,
  },
  verifyButton: {
    backgroundColor: "#0077CB",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 1.75,
  },
  verifyText: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
    marginRight: 10,
  },
  arrowIcon: {
    width: 12,
    height: 12,
  },
});

export default SendOtpScreen;
