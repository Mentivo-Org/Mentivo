import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../services/retrieveKeys';
import api from '../../services/api';
import { MentorEndpoints, websiteUrl } from '../../constants/endpoint';
import DialogBox from '../../components/DialogBox';

const MentorVerificationPendingPage = () => {
  const { user, verificationStatus, handleLogout, checkLoginStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });
  const [alertVisible, setAlertVisible] = useState(false);

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      await checkLoginStatus(true);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReapply = async () => {
    setLoading(true);
    try {
      const response = await api.post(MentorEndpoints.reapply);
      if (response.status === 200) {
        // Success: Log the user out so that upon next login, they are routed to CompleteProfile
        await handleLogout();
      } else {
        setAlertData({
          title: 'Error',
          message: response.data?.error || 'Failed to request re-application.',
        });
        setAlertVisible(true);
      }
    } catch (err: any) {
      setAlertData({
        title: 'Error',
        message: err.message || 'Network error occurred.',
      });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    const supportUrl = `${websiteUrl}/support`;
    WebBrowser.openBrowserAsync(supportUrl).catch((err) => {
      console.error('Failed to open link:', err);
      setAlertData({
        title: 'Error',
        message: 'Could not open support page link.',
      });
      setAlertVisible(true);
    });
  };

  const isRejected = verificationStatus === 'REJECTED';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.header}>
            {isRejected ? 'Verification Rejected ❌' : 'Verification Pending ⌛'}
          </Text>

          <Text style={styles.description}>
            {isRejected
              ? 'Your profile verification was rejected by the platform administrators. You can choose to re-enter your details to apply again, or request account deletion.'
              : 'Please wait before your account is verified. This is usually resolved within 1 day. You will receive access once approved.'}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#0077CB" style={styles.loader} />
          ) : (
            <View style={styles.buttonContainer}>
              {!isRejected && (
                <TouchableOpacity style={styles.primaryButton} onPress={handleCheckStatus}>
                  <Text style={styles.primaryButtonText}>Check Status</Text>
                </TouchableOpacity>
              )}

              {isRejected && (
                <>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleReapply}>
                    <Text style={styles.primaryButtonText}>Re-enter Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryButton} onPress={handleDeleteAccount}>
                    <Text style={styles.secondaryButtonText}>Delete Account</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <DialogBox
        title={alertData.title}
        message={alertData.message}
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0b1c30',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#444653',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  loader: {
    marginVertical: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#0077CB',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderWidth: 1.5,
    borderColor: '#c4c5d5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  logoutButtonText: {
    color: '#444653',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MentorVerificationPendingPage;
