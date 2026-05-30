import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

export default function PaymentPage() {
  const navigation = useNavigation<any>();
  const [paymentAmount, setPaymentAmount] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require("../../app-assets/arrow-back-up.svg")} style={styles.icon24} tintColor="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.amountLabel}>Add Money to Wallet</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              autoFocus={true}
            />
          </View>

          <View style={styles.quickAmountRow}>
            {["100", "200", "500", "1000"].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.quickAmountChip}
                onPress={() => setPaymentAmount(amount)}
              >
                <Text style={styles.quickAmountText}>+₹{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.addWalletButton}>
            <Text style={styles.addWalletButtonText}>Add to wallet</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Payment Methods</Text>
          <Text style={styles.infoSubtitle}>Secure and encrypted transactions via Razorpay</Text>
          
          <View style={styles.securityBadge}>
            <Image source={require("../../app-assets/shield-icon.svg")} style={styles.shieldIcon} tintColor="#10b981" />
            <Text style={styles.securityText}>100% Safe & Secure Payments</Text>
          </View>
        </View>
      </ScrollView>
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
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: "#444653",
    marginBottom: 20,
    fontWeight: "600",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 10,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: "bold",
    color: "black",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: "bold",
    color: "black",
  },
  quickAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  quickAmountChip: {
    backgroundColor: "#f0f4ff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  quickAmountText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "bold",
  },
  addWalletButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  addWalletButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoSection: {
    marginTop: 30,
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 12,
    color: "#444653",
    textAlign: "center",
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
