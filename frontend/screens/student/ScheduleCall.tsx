import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../services/api';
import { CallEndpoints } from '../../constants/endpoint';
import DialogBox from '../../components/DialogBox';

const { width } = Dimensions.get('window');

const timeSlots = [
  { time: '10:00 AM' },
  { time: '11:00 AM' },
  { time: '05:00 PM' },
  { time: '07:00 PM' },
  { time: '08:00 PM' },
];

const lengths = [
  { length: '15 min' },
  { length: '20 min' },
  { length: '25 min' },
  { length: '30 min' },
];

export default function ScheduleCall() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mentorName, mentorId } = route.params || { mentorName: 'Suraj', mentorId: '' };

  const [alertData, setAlertData] = useState({title: "", message: ""});
  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const [existingSchedules, setExistingSchedules] = useState<any[]>([]);

  // Generate the next 14 days starting from today
  const dynamicDays = useMemo(() => {
    const daysArr = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      daysArr.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate().toString(),
        fullDate: date.toISOString().split('T')[0]
      });
    }
    return daysArr;
  }, []);

  const [selectedDay, setSelectedDay] = useState(dynamicDays[0].fullDate);
  const [selectedTime, setSelectedTime] = useState('11:00 AM');
  const [selectedLength, setSelectedLength] = useState('15 min');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchSchedules = async () => {
      if (!mentorId) return;
      try {
        const [mentorRes, studentRes] = await Promise.all([
          api.get(CallEndpoints.getMentorSchedule(mentorId)),
          api.get(CallEndpoints.getStudentSchedule)
        ]);
        
        const combined = [
          ...(mentorRes.status === 200 ? mentorRes.data.scheduledCalls : []),
          ...(studentRes.status === 200 ? studentRes.data.scheduledCalls : [])
        ];
        
        setExistingSchedules(combined);
      } catch (error) {
        console.error('Failed to fetch schedules:', error);
      }
    };
    fetchSchedules();
  }, [mentorId]);

  const isTimePast = (timeStr: string) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // 1. Check if the slot is in the past (if today)
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const slotTime = new Date(selectedDay);
    slotTime.setHours(hours, minutes, 0, 0);

    if (selectedDay === todayStr) {
      // Disable if the slot is within the next 1 hour
      const bufferTime = new Date(now.getTime() + 60 * 60 * 1000);
      if (slotTime < bufferTime) return true;
    }

    // 2. Check for conflicts with existing schedules (30 mins buffer)
    const durationMins = parseInt(selectedLength.split(' ')[0]);
    const slotStartTime = slotTime.getTime();
    const slotEndTime = slotStartTime + (durationMins * 60 * 1000);
    const slotBufferEnd = slotEndTime + (30 * 60 * 1000);

    for (const schedule of existingSchedules) {
      const existStart = new Date(schedule.scheduledAt).getTime();
      const existEnd = existStart + (schedule.scheduledDuration * 60 * 1000);
      const existBufferEnd = existEnd + (30 * 60 * 1000);

      // Overlap logic: StartA < EndB && EndA > StartB
      // Using buffer on both to ensure 30 min gap either way
      if (slotStartTime < existBufferEnd && slotBufferEnd > existStart) {
        return true;
      }
    }

    return false;
  };

  const handleConfirm = async () => {
    if (!mentorId) {
      setAlertData({title: 'Error', message: 'Mentor information is missing.'});
      setAlertVisible(true);
      return;
    }

    try {
      setLoading(true);
      
      // Construct scheduled date
      const [time, modifier] = selectedTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const scheduledDate = new Date(selectedDay);
      scheduledDate.setHours(hours, minutes, 0, 0);

      const durationMins = parseInt(selectedLength.split(' ')[0]);

      const response = await api.post(CallEndpoints.schedule, {
        mentorId,
        scheduledAt: scheduledDate.toISOString(),
        durationMins
      });

      if (response.status === 200) {
        setAlertData({title: 'Success', message:'Call scheduled successfully!'});
        setAlertVisible(true);
        navigation.navigate("Main", {screen: 'Home'})
      }
    } catch (error: any) {
      console.error('Failed to schedule call:', error);
      setAlertData({title: 'Error', message: error.response?.data?.error || 'Failed to schedule call. Please check your balance.'});
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../../app-assets/arrow-back-up.svg')} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Image source={require('../../app-assets/x-icon.svg')} style={styles.closeIcon} />
          </TouchableOpacity>

          <Text style={styles.title}>Schedule a call</Text>
          <Text style={styles.subtitle}>with {mentorName}</Text>

          <Text style={styles.sectionLabel}>DAY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSection}>
            {dynamicDays.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCard,
                  selectedDay === item.fullDate && styles.selectedCard
                ]}
                onPress={() => setSelectedDay(item.fullDate)}
              >
                <Text style={[styles.dayText, selectedDay === item.fullDate && styles.selectedText]}>{item.day}</Text>
                <Text style={[styles.dateText, selectedDay === item.fullDate && styles.selectedText]}>{item.date}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>TIME</Text>
          <View style={styles.gridSection}>
            {timeSlots.map((item, index) => {
              const disabled = isTimePast(item.time);
              return (
                <TouchableOpacity
                  key={index}
                  disabled={disabled}
                  style={[
                    styles.timeCard,
                    selectedTime === item.time && styles.selectedCard,
                    disabled && styles.disabledCard
                  ]}
                  onPress={() => setSelectedTime(item.time)}
                >
                  <Text style={[
                    styles.gridText, 
                    selectedTime === item.time && styles.selectedText,
                    disabled && styles.disabledText
                  ]}>
                    {item.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>LENGTH</Text>
          <View style={styles.gridSection}>
            {lengths.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.lengthCard,
                  selectedLength === item.length && styles.selectedCard
                ]}
                onPress={() => setSelectedLength(item.length)}
              >
                <Text style={[styles.gridText, selectedLength === item.length && styles.selectedText]}>{item.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity 
            style={[styles.confirmButton, loading && { opacity: 0.7 }]} 
            onPress={handleConfirm}
            disabled={loading}
          >
             <Text style={styles.confirmButtonText}>
               {loading ? 'Scheduling...' : 'Confirm Schedule'}
             </Text>
          </TouchableOpacity>
        </View>
      </View>
      <DialogBox visible={alertVisible} title={alertData.title} message={alertData.message}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  closeIcon: {
    width: 16,
    height: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  subtitle: {
    fontSize: 16,
    color: '#444653',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#444653',
    marginBottom: 8,
    marginTop: 12,
  },
  scrollSection: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayCard: {
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: '#757684',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 56,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444653',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
  },
  gridSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  timeCard: {
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: '#757684',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 85,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledCard: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  disabledText: {
    color: '#9ca3af',
  },
  lengthCard: {
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: '#757684',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 70,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridText: {
    fontSize: 14,
    color: 'black',
  },
  selectedCard: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  selectedText: {
    color: 'white',
  },
  confirmButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
