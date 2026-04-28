import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LandingPage({ navigation }) {
  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-24 pb-36">
        
        {/* Main Hero Section */}
        <View className="bg-blue-50 rounded-xl overflow-hidden min-h-[500px] mb-16 relative">
             <View className="p-10 flex-col gap-2 items-start justify-center h-full">
                <View className="bg-blue-400 rounded-full px-3 py-1 mb-2">
                    <Text className="text-blue-900 text-sm font-medium">Academic Excellence Awaits</Text>
                </View>
                <Text className="text-gray-900 text-4xl font-bold tracking-tight mb-4">Learn from{"\n"}IITians</Text>
                <Text className="text-slate-600 text-lg mb-8 max-w-sm">
                    Unlock your potential with personalized mentorship from the prestigious IIT community. Bridge the gap between ambition and achievement with expert guidance.
                </Text>

                <View className="flex-col gap-4 w-full">
                   <TouchableOpacity 
                     className="bg-blue-800 rounded-lg py-4 px-8 flex-row items-center justify-center gap-2"
                     onPress={() => navigation.navigate('FindAMentor')}
                   >
                       <Text className="text-white text-center text-lg font-medium">I am a Student</Text>
                       {/* Arrow Icon Placeholder */}
                       <View className="w-4 h-4 bg-white/20 rounded-full" />
                   </TouchableOpacity>
                   <TouchableOpacity className="border-2 border-blue-800 rounded-lg py-4 px-8">
                       <Text className="text-blue-800 text-center text-lg font-medium">I am a Mentor</Text>
                   </TouchableOpacity>
                </View>
             </View>
        </View>

        {/* Features Grid */}
        <View className="flex-col gap-6 mb-16">
            {/* Feature 1 */}
           <View className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <View className="flex-row justify-between mb-4">
                 <View>
                     <Text className="text-blue-800 text-2xl font-semibold mb-2">Direct Access</Text>
                     <Text className="text-slate-600 text-base">
                         Connect directly with students and alumni from India's top engineering institutes.
                     </Text>
                 </View>
                 {/* Icon Placeholder */}
                 <View className="w-9 h-9 bg-slate-200 rounded-full" />
              </View>
              <View className="flex-row gap-2 mt-2">
                  <View className="bg-blue-100 rounded-full px-3 py-1">
                      <Text className="text-blue-800 text-xs font-bold">JEE Prep</Text>
                  </View>
                  <View className="bg-blue-100 rounded-full px-3 py-1">
                      <Text className="text-blue-800 text-xs font-bold">Career Growth</Text>
                  </View>
                  <View className="bg-blue-100 rounded-full px-3 py-1">
                      <Text className="text-blue-800 text-xs font-bold">Research</Text>
                  </View>
              </View>
           </View>

           {/* Feature 2  (Smart Scheduling) */}
           <View className="bg-blue-800 rounded-xl p-6 shadow-sm min-h-[165px] justify-between">
               <View className="w-8 h-8 bg-blue-700 rounded-lg mb-4" /> {/* Icon placeholder */}
               <View>
                   <Text className="text-blue-200 text-2xl font-semibold mb-2">Smart Scheduling</Text>
                   <Text className="text-white opacity-90 text-sm">
                       Seamlessly book sessions that fit both your schedules perfectly.
                   </Text>
               </View>
           </View>
            
           {/* Feature 3 (Personalized) */}
           <View className="bg-blue-100 border border-slate-300 rounded-xl p-6 shadow-sm min-h-[211px] items-center text-center">
              <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-inner mb-4">
                  <View className="w-6 h-6 bg-slate-200 rounded-full" /> {/* Icon Placeholder */}
              </View>
              <Text className="text-gray-900 text-2xl font-semibold mb-2 text-center">Personalized</Text>
              <Text className="text-slate-600 text-base text-center">
                  Curated mentorship plans tailored to your specific academic goals.
              </Text>
           </View>

            {/* Feature 4 (Trust & Prestige) - placeholder for image background */}
           <View className="bg-slate-800 rounded-xl overflow-hidden min-h-[155px] justify-end p-6 border border-slate-700">
               <Text className="text-white text-2xl font-semibold mb-2">Trust & Prestige</Text>
               <Text className="text-white opacity-90 text-base">
                   Experience the academic rigor and professional standards of the IIT community.
               </Text>
           </View>
        </View>

        {/* Stats Section */}
        <View className="bg-white border border-slate-200 rounded-xl p-10 shadow-sm mb-16">
            <View className="items-center mb-10">
                <Text className="text-gray-900 text-3xl font-semibold text-center mb-2">Mentorship Progress</Text>
                <Text className="text-slate-600 text-base text-center">
                   Helping thousands of students reach their dream campus.
                </Text>
            </View>

            <View className="flex-row flex-wrap gap-y-10 justify-between mb-8">
                <View className="w-[45%] items-center">
                   <Text className="text-blue-800 text-4xl font-bold tracking-tight mb-2">12K+</Text>
                   <Text className="text-slate-600 text-sm font-medium tracking-widest uppercase">SESSIONS</Text>
                </View>
                <View className="w-[45%] items-center">
                   <Text className="text-blue-800 text-4xl font-bold tracking-tight mb-2">98%</Text>
                   <Text className="text-slate-600 text-sm font-medium tracking-widest uppercase text-center">SUCCESS{"\n"}RATE</Text>
                </View>
                <View className="w-[45%] items-center">
                   <Text className="text-blue-800 text-4xl font-bold tracking-tight mb-2">450</Text>
                   <Text className="text-slate-600 text-sm font-medium tracking-widest uppercase">IIT MENTORS</Text>
                </View>
                <View className="w-[45%] items-center">
                   <Text className="text-blue-800 text-4xl font-bold tracking-tight mb-2">23</Text>
                   <Text className="text-slate-600 text-sm font-medium tracking-widest uppercase text-center">IIT{"\n"}CAMPUSES</Text>
                </View>
            </View>

            {/* Progress Bar placeholder */}
            <View className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                <View className="w-3/4 h-full bg-blue-400 rounded-full" />
            </View>
        </View>

      </ScrollView>
    </View>
  );
}
