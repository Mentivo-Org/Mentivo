import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';

export default function BookYourSession({ navigation }) {
  const [selectedDuration, setSelectedDuration] = useState('30 min');
  const [selectedDate, setSelectedDate] = useState('9');
  const [selectedSlot, setSelectedSlot] = useState('11:00 AM');

  // Dummy calendar data
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const calendarGrid = [
    [ { date: '30', type: 'prev' }, { date: '1', type: 'curr' }, { date: '2', type: 'curr' }, { date: '3', type: 'curr' }, { date: '4', type: 'curr' }, { date: '5', type: 'prev' }, { date: '6', type: 'prev' } ],
    [ { date: '7', type: 'curr' }, { date: '8', type: 'curr' }, { date: '9', type: 'selected' }, { date: '10', type: 'curr' }, { date: '11', type: 'curr' }, { date: '12', type: 'prev' }, { date: '13', type: 'prev' } ],
    [ { date: '14', type: 'curr' }, { date: '15', type: 'curr' }, { date: '16', type: 'curr' }, { date: '17', type: 'curr' }, { date: '18', type: 'curr' }, { date: '19', type: 'prev' }, { date: '20', type: 'prev' } ],
  ];

  const slots = [
    { label: '09:00 AM', status: 'available' },
    { label: '10:30 AM', status: 'available' },
    { label: '11:00 AM', status: 'selected' },
    { label: '01:30 PM', status: 'available' },
    { label: '02:00 PM', status: 'available' },
    { label: '04:30 PM', status: 'available' },
    { label: '05:00 PM', status: 'disabled' },
    { label: '06:00 PM', status: 'available' },
  ];

  return (
    <View className="flex-1 bg-[#F8F9FF]">
      <ScrollView className="flex-1 px-4 pt-12 pb-32">
        
        {/* Header & Back Button */}
        <View className="mb-6">
           <View className="flex-row items-center gap-3 mb-6">
              <TouchableOpacity className="border border-slate-300 bg-white rounded-full p-2 h-10 w-10 items-center justify-center">
                 {/* Back Icon placeholder */}
                 <View className="w-4 h-4 bg-slate-800" />
              </TouchableOpacity>
              <View>
                 <Text className="text-gray-900 text-3xl font-semibold -ml-1">Book a Session</Text>
                 <Text className="text-slate-600 text-base mt-1">Secure your mentorship time with Dr. Arpit Sharma</Text>
              </View>
           </View>

           {/* Duration Toggle */}
           <View className="bg-blue-50 p-1 rounded-xl flex-row w-full">
              <TouchableOpacity 
                className={`flex-1 py-2 rounded-lg items-center ${selectedDuration === '30 min' ? 'bg-white shadow-sm' : ''}`}
                onPress={() => setSelectedDuration('30 min')}
              >
                  <Text className={`${selectedDuration === '30 min' ? 'text-blue-800 font-bold' : 'text-slate-600'} text-sm`}>30 min</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`flex-1 py-2 rounded-lg items-center ${selectedDuration === '60 min' ? 'bg-white shadow-sm' : ''}`}
                 onPress={() => setSelectedDuration('60 min')}
              >
                  <Text className={`${selectedDuration === '60 min' ? 'text-blue-800 font-bold' : 'text-slate-600'} text-sm`}>60 min</Text>
              </TouchableOpacity>
           </View>
        </View>

        {/* Selected Date */}
        <View className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
           <View className="flex-row justify-between items-center mb-6">
              <Text className="text-gray-900 text-2xl font-semibold">Select a{"\n"}Date</Text>
              <View className="flex-row items-center bg-blue-50 rounded-lg pr-4 pl-2 py-1">
                 <TouchableOpacity className="p-2">
                    {/* Left Icon */}
                     <View className="w-2 h-3 bg-blue-900" />
                 </TouchableOpacity>
                 <View className="px-2">
                     <Text className="text-gray-900 font-medium text-sm">October</Text>
                     <Text className="text-gray-900 font-medium text-sm">2024</Text>
                 </View>
                 <TouchableOpacity className="p-2">
                    {/* Right Icon */}
                    <View className="w-2 h-3 bg-blue-900" />
                 </TouchableOpacity>
              </View>
           </View>

           {/* Calendar Grid */}
           <View className="mb-2">
              <View className="flex-row justify-between mb-4 px-2">
                 {days.map(day => (
                    <Text key={day} className="text-slate-500 text-[10px] tracking-widest flex-1 text-center font-medium">{day}</Text>
                 ))}
              </View>
              {calendarGrid.map((row, i) => (
                 <View key={i} className="flex-row justify-between mb-2">
                    {row.map((day, j) => (
                       <TouchableOpacity 
                          key={j} 
                          className={`flex-1 aspect-square rounded-lg items-center justify-center mx-1
                             ${day.type === 'selected' ? 'bg-blue-800' : ''}`}
                       >
                          <Text 
                            className={`text-base font-medium
                               ${day.type === 'prev' ? 'text-slate-300' : ''}
                               ${day.type === 'curr' ? 'text-gray-900' : ''}
                               ${day.type === 'selected' ? 'text-white font-bold' : ''}`}
                            >
                               {day.date}
                            </Text>
                       </TouchableOpacity>
                    ))}
                 </View>
              ))}
           </View>
        </View>

        {/* Available Slots */}
        <View className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
           <Text className="text-gray-900 text-2xl font-semibold mb-6">Available Slots</Text>
           <View className="flex-row flex-wrap justify-between gap-y-3">
              {slots.map((slot, i) => (
                  <TouchableOpacity 
                    key={i} 
                    className={`w-[48%] py-3 rounded-lg border items-center justify-center
                       ${slot.status === 'available' ? 'bg-blue-50 border-slate-300' : ''}
                       ${slot.status === 'selected' ? 'bg-blue-200 border border-blue-600 border-2' : ''}
                       ${slot.status === 'disabled' ? 'bg-slate-50 border-slate-200 opacity-50' : ''}
                    `}
                    disabled={slot.status === 'disabled'}
                  >
                     <Text className={`text-base 
                        ${slot.status === 'selected' ? 'text-blue-800 font-bold' : 'text-gray-900'}
                        ${slot.status === 'disabled' ? 'line-through text-slate-500' : ''}
                     `}>{slot.label}</Text>
                  </TouchableOpacity>
              ))}
           </View>
        </View>

        {/* Booking Summary */}
        <View className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 overflow-hidden">
            <View className="bg-blue-800 px-6 py-4">
                <Text className="text-white text-2xl font-bold">Booking Summary</Text>
            </View>
            <View className="p-6">
                <View className="flex-row gap-4 mb-6 items-center">
                    <View className="w-16 h-16 rounded border border-slate-200 bg-slate-100 overflow-hidden" />
                    <View>
                        <Text className="text-gray-900 text-lg font-bold">Dr. Arpit Sharma</Text>
                        <Text className="text-slate-600 text-sm">AI & Machine Learning Mentor</Text>
                    </View>
                </View>
                <View className="h-px bg-slate-200 w-full mb-4" />
                
                <View className="gap-3 mb-6">
                   <View className="flex-row justify-between items-center">
                      <Text className="text-slate-600 text-base">Date</Text>
                      <Text className="text-gray-900 text-base font-medium">Oct 9, 2024</Text>
                   </View>
                   <View className="flex-row justify-between items-center">
                      <Text className="text-slate-600 text-base">Time</Text>
                      <Text className="text-gray-900 text-base font-medium">11:00 AM (IST)</Text>
                   </View>
                   <View className="flex-row justify-between items-center">
                      <Text className="text-slate-600 text-base">Duration</Text>
                      <Text className="text-gray-900 text-base font-medium">30 Minutes</Text>
                   </View>
                </View>

                <View className="bg-blue-50 border border-blue-100 flex-row justify-between items-center p-4 rounded-xl mb-6">
                     <Text className="text-blue-800 text-base">Total Price</Text>
                     <Text className="text-blue-800 text-3xl font-bold tracking-tight">₹500</Text>
                </View>

                <TouchableOpacity className="bg-blue-800 rounded-xl py-4 w-full mb-4">
                    <Text className="text-white text-center text-lg font-bold">Confirm Booking</Text>
                </TouchableOpacity>

                <Text className="text-slate-500 text-xs italic text-center px-4 leading-relaxed">
                   By confirming, you agree to our booking policy. You can reschedule up to 24 hours before the session.
                </Text>
            </View>
        </View>

      </ScrollView>

    </View>
  );
}
