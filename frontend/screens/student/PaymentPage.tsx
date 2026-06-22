import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Linking,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { WalletEndpoints, websiteUrl } from "../../constants/endpoint";
import DialogBox from "../../components/DialogBox";

const { width } = Dimensions.get("window");

export default function PaymentPage() {
  const navigation = useNavigation<any>();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [alertData, setAlertData] = useState({ title: "", message: "" });
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const fetchBalance = async () => {
    try {
      const response = await api.get(WalletEndpoints.getBalance);
      if (response.status === 200) {
        setBalance(response.data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch session credits balance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    loadUser();
    fetchBalance();
  }, []);

  const handleAddCredits = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (!accessToken) {
        setAlertData({ title: "Error", message: "Failed to authenticate session. Please log in again." });
        setAlertVisible(true);
        return;
      }

      // Construct redirection URL to Next.js website
      const redirectUrl = `${websiteUrl}/add-credits?token=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken || "")}`;
      
      console.log("Redirecting user to buy credits:", redirectUrl);
      
      try {
        await WebBrowser.openBrowserAsync(redirectUrl);
      } catch (browserErr) {
        console.warn("expo-web-browser failed, falling back to Linking.openURL:", browserErr);
        await Linking.openURL(redirectUrl);
      }
    } catch (err) {
      console.error("Redirection error:", err);
      setAlertData({ title: "Error", message: "An unexpected error occurred." });
      setAlertVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require("../../app-assets/arrow-back-up.svg")} style={styles.icon24} tintColor="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Credits</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.amountLabel}>Current Credits</Text>
          <View style={styles.balanceContainer}>
            <Image source={require("../../app-assets/wallet-fill.svg")} style={styles.creditIcon} tintColor="#0077CB" />
            <Text style={styles.balanceText}>
              {loading ? (
                <ActivityIndicator size="small" color="#0077CB" />
              ) : (
                `${balance !== null ? balance : 0} Credits`
              )}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.explanationSection}>
            <Text style={styles.infoTitle}>How it works</Text>
            <View style={styles.infoRow}>
              <View style={styles.bullet} />
              <Text style={styles.infoText}>1 Credit = ₹1.00 session value</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.bullet} />
              <Text style={styles.infoText}>Credits are used to book and call IITian mentors</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.addCreditsButton} 
            onPress={handleAddCredits}
          >
            <Text style={styles.addCreditsButtonText}>Add Credits</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.noteTitle}>Important Notice</Text>
          <Text style={styles.noteText}>
            All billing transactions are handled externally. 
            Tapping "Add Credits" will securely redirect you to our website to complete payment.
          </Text>
          
          <View style={styles.securityBadge}>
            <Image source={require("../../app-assets/shield-icon.svg")} style={styles.shieldIcon} tintColor="#10b981" />
            <Text style={styles.securityText}>100% Secure Web Checkout</Text>
          </View>
        </View>
      </ScrollView>

      <DialogBox
        title={alertData.title}
        message={alertData.message}
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        primaryButtonText="OK"
        onPrimaryPress={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  icon24: {
    width: 24,
    height: 24,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  amountLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  creditIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  balanceText: {
    fontSize: 28,
    fontWeight: "900",
    color: "black",
  },
  separator: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 16,
  },
  explanationSection: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingLeft: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0077CB",
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "500",
  },
  addCreditsButton: {
    backgroundColor: "#0077CB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#0077CB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addCreditsButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoSection: {
    marginTop: 24,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shieldIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  securityText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "600",
  },
});
