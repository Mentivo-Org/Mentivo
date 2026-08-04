import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DialogBox from '../../components/DialogBox';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { resetToScreen } from '../../services/navigation';
import { Routes } from '../../constants/routes';
import Ionicons from "@react-native-vector-icons/ionicons";
import api from '../../services/api';
import { CallEndpoints } from '../../constants/endpoint';

export default function RatingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { callId, mentorName, mentorPhoto } = route.params;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });

  const handleSubmit = async () => {
    if (rating === 0) {
      setAlertData({ title: 'Selection Required', message: 'Please select a star rating before submitting.' });
      setAlertVisible(true);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(CallEndpoints.rate(callId), {
        score: rating,
        comment: comment.trim()
      });

      if (response.status === 200) {
        // Go back to home
        resetToScreen(Routes.main, { screen: Routes.home });
      } else {
        setAlertData({ title: 'Error', message: 'Failed to submit rating. Please try again.' });
        setAlertVisible(true);
      }
    } catch (error) {
      console.error('Rating submission failed:', error);
      setAlertData({ title: 'Error', message: 'An unexpected error occurred.' });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const StarIcon = ({ index }: { index: number }) => {
    const isSelected = index <= rating;
    return (
      <TouchableOpacity onPress={() => setRating(index)} activeOpacity={0.7}>
        <Ionicons 
          name={isSelected ? "star" : "star-outline"} 
          size={40} 
          color={isSelected ? "#FFD700" : "#d1d5db"} 
          style={styles.star}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>How was your session?</Text>
        <Text style={styles.subtitle}>Your feedback helps us maintain the quality of mentorship.</Text>

        <View style={styles.mentorInfo}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={mentorPhoto ? { uri: mentorPhoto } : require('../../app-assets/profile-circle.svg')} 
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
          <Text style={styles.mentorName}>{mentorName}</Text>
        </View>

        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <StarIcon key={i} index={i} />
          ))}
        </View>

        <TextInput
          style={styles.commentInput}
          placeholder="Share your experience (optional)"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
        />

        <TouchableOpacity 
          style={[styles.submitButton, rating === 0 && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={loading || rating === 0}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitText}>Submit Review</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.compulsoryHint}>* Rating is compulsory to continue</Text>
      </View>
      <DialogBox
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  mentorInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    padding: 2,
    borderWidth: 2,
    borderColor: '#0077CB',
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  mentorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  star: {
    marginHorizontal: 4,
  },
  commentInput: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    textAlignVertical: 'top',
    height: 120,
    marginBottom: 32,
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#0077CB',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#0077CB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  compulsoryHint: {
    marginTop: 16,
    fontSize: 12,
    color: '#ef4444',
    fontStyle: 'italic',
  }
});
