import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Image } from 'react-native';

export default function MentorDashboard() {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <View className="flex-1 bg-[#F8F9FF]">
      <ScrollView className="flex-1 px-4 pt-10 pb-32">
        {/* Welcome Section */}
        <View className="mb-6">
           <Text className="text-gray-900 text-4xl font-bold mb-2">Welcome back, Dr. Aryan</Text>
           <Text className="text-slate-600 text-base mb-4">Your students are looking forward to today's sessions.</Text>
           
           <View className="flex-row items-center border border-slate-200 bg-white rounded-lg self-start py-2 px-4 shadow-sm">
              <Text className="text-slate-500 text-xs font-bold tracking-wider mr-3">AVAILABILITY</Text>
              <Switch 
                 value={isOnline} 
                 onValueChange={setIsOnline} 
                 trackColor={{ false: '#cbd5e1', true: '#00288e' }} 
                 thumbColor={'#ffffff'}
                 style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }}
              />
              <Text className="text-blue-800 font-bold ml-2 text-sm">{isOnline ? 'Online' : 'Offline'}</Text>
           </View>
        </View>

        {/* Upcoming Sessions */}
        <View className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
            <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center gap-2">
                    {/* Calendar Icon */}
                    <View className="w-5 h-5 bg-blue-800 rounded-sm" />
                    <Text className="text-gray-900 text-2xl font-bold">Upcoming{"\n"}Sessions</Text>
                </View>
                <TouchableOpacity>
                   <Text className="text-blue-800 text-center text-sm font-medium">View{"\n"}Calendar</Text>
                </TouchableOpacity>
            </View>

            <View className="gap-4">
                {/* Session 1 */}
                <View className="border border-slate-100 rounded-xl p-4 flex-row justify-between items-center bg-slate-50">
                    <View className="flex-row gap-4 items-center">
                        <View className="bg-blue-100 rounded-lg p-2 items-center justify-center w-12 h-12">
                           <Text className="text-blue-800 text-xs font-bold uppercase">OCT</Text>
                           <Text className="text-blue-800 text-lg font-black leading-tight">14</Text>
                        </View>
                        <View>
                           <Text className="text-gray-900 text-base font-bold">Rohan Mehta</Text>
                           <Text className="text-slate-500 text-xs w-[100px]" numberOfLines={2}>Quantum Mechanics Basics</Text>
                        </View>
                    </View>
                    <View className="items-end gap-2">
                        <Text className="text-gray-900 font-bold text-sm">10:30 AM</Text>
                        <TouchableOpacity className="bg-blue-800 rounded-lg px-4 py-1.5 flex-row items-center gap-1">
                            <View className="w-3 h-3 bg-white rounded-full opacity-50" /> {/* Camera Icon placeholder */}
                            <Text className="text-white text-xs font-bold">Join</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Session 2 */}
                <View className="border border-slate-100 rounded-xl p-4 flex-row justify-between items-center bg-white shadow-sm">
                    <View className="flex-row gap-4 items-center">
                        <View className="bg-blue-100 rounded-lg p-2 items-center justify-center w-12 h-12">
                           <Text className="text-blue-800 text-xs font-bold uppercase">OCT</Text>
                           <Text className="text-blue-800 text-lg font-black leading-tight">14</Text>
                        </View>
                        <View>
                           <Text className="text-gray-900 text-base font-bold">Ishita Goyal</Text>
                           <Text className="text-slate-500 text-xs w-[100px]" numberOfLines={2}>JEE Advanced Prep - Organic Chem</Text>
                        </View>
                    </View>
                    <View className="items-end gap-2">
                        <Text className="text-gray-900 font-bold text-sm">02:00 PM</Text>
                        <TouchableOpacity className="bg-blue-800 rounded-lg px-4 py-1.5 flex-row items-center gap-1">
                            <View className="w-3 h-3 bg-white rounded-full opacity-50" />
                            <Text className="text-white text-xs font-bold">Join</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Session 3 */}
                 <View className="border border-slate-100 rounded-xl p-4 flex-row justify-between items-center bg-white shadow-sm">
                    <View className="flex-row gap-4 items-center">
                        <View className="bg-blue-50 border border-slate-200 rounded-lg p-2 items-center justify-center w-12 h-12">
                           <Text className="text-blue-800 text-xs font-bold uppercase opacity-60">OCT</Text>
                           <Text className="text-blue-900 text-lg font-black leading-tight opacity-70">15</Text>
                        </View>
                        <View>
                           <Text className="text-gray-900 text-base font-bold">Aravind S.</Text>
                           <Text className="text-slate-500 text-xs w-[100px]" numberOfLines={2}>Career Guidance: Data Science</Text>
                        </View>
                    </View>
                    <View className="items-end gap-2">
                        <Text className="text-gray-900 font-bold text-sm">09:00 AM</Text>
                        <TouchableOpacity className="bg-blue-800 rounded-lg px-4 py-1.5 flex-row items-center gap-1">
                            <View className="w-3 h-3 bg-white rounded-full opacity-50" />
                            <Text className="text-white text-xs font-bold">Join</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>

        {/* Optimize Profile Banner */}
        <View className="bg-[#1E3A8A] rounded-xl p-6 mb-6 overflow-hidden relative">
            {/* Background decoration */}
            <View className="absolute right-[-20px] bottom-[-20px] opacity-20">
                 {/* Rocket icon placeholder */}
                 <View className="w-32 h-32 bg-white rounded-full transform rotate-45" />
            </View>
            <Text className="text-white text-xl font-semibold mb-2">Optimize your profile</Text>
            <Text className="text-blue-100 text-sm mb-4 leading-relaxed max-w-[80%]">
                Updated profiles receive 45% more booking requests. Check your expertise tags and availability.
            </Text>
            <TouchableOpacity className="bg-white rounded-lg py-2 px-4 self-start flex-row items-center gap-2">
                 <View className="w-4 h-4 bg-blue-800" /> {/* Settings icon */}
                 <Text className="text-blue-800 font-bold text-sm">Profile Settings</Text>
            </TouchableOpacity>
        </View>

        {/* Earnings Card */}
        <View className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
            <Text className="text-slate-500 text-sm font-medium mb-1">Total Earnings</Text>
            <View className="flex-row justify-between items-center mb-4">
               <Text className="text-gray-900 text-3xl font-bold tracking-tight">₹ 42,500</Text>
               <View className="flex-row items-center">
                   {/* Arrow Up Icon */}
                   <View className="w-3 h-3 bg-green-500 rounded-full mr-1" />
                   <Text className="text-green-500 font-bold text-sm">12%</Text>
               </View>
            </View>
            <View className="w-full h-2 bg-blue-100 rounded-full overflow-hidden mb-2">
                <View className="w-[70%] h-full bg-blue-800 rounded-full" />
            </View>
            <Text className="text-slate-400 text-xs">70% of monthly goal reached</Text>
        </View>

        {/* New Requests */}
        <View className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
           <View className="flex-row justify-between items-center mb-6">
               <View className="flex-row items-center gap-2">
                   <View className="w-5 h-5 bg-blue-800 rounded-full" /> {/* Users Icon */}
                   <Text className="text-gray-900 text-xl font-bold">New Requests</Text>
               </View>
               <View className="bg-red-600 rounded-full w-6 h-6 items-center justify-center">
                   <Text className="text-white text-xs font-bold">2</Text>
               </View>
           </View>
           
           <View className="gap-4">
              {/* Request 1 */}
              <View className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                 <View className="flex-row items-center gap-3 mb-4">
                    <View className="w-10 h-10 rounded-full bg-slate-300" /> {/* Avatar */}
                    <View>
                        <Text className="text-gray-900 font-bold text-sm">Rahul Khanna</Text>
                        <Text className="text-slate-500 text-xs">Mentorship • 4 Sessions</Text>
                    </View>
                 </View>
                 <View className="flex-row gap-3">
                     <TouchableOpacity className="flex-1 bg-blue-800 rounded-lg py-2 items-center">
                         <Text className="text-white font-bold text-sm">Accept</Text>
                     </TouchableOpacity>
                     <TouchableOpacity className="flex-1 bg-slate-100 rounded-lg py-2 items-center">
                         <Text className="text-slate-600 font-bold text-sm">Reject</Text>
                     </TouchableOpacity>
                 </View>
              </View>

              {/* Request 2 */}
              <View className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                 <View className="flex-row items-center gap-3 mb-4">
                    <View className="w-10 h-10 rounded-full bg-slate-300" /> {/* Avatar */}
                    <View>
                        <Text className="text-gray-900 font-bold text-sm">Sneha Kapur</Text>
                        <Text className="text-slate-500 text-xs">Review • 1 Session</Text>
                    </View>
                 </View>
                 <View className="flex-row gap-3">
                     <TouchableOpacity className="flex-1 bg-blue-800 rounded-lg py-2 items-center">
                         <Text className="text-white font-bold text-sm">Accept</Text>
                     </TouchableOpacity>
                     <TouchableOpacity className="flex-1 bg-slate-100 rounded-lg py-2 items-center">
                         <Text className="text-slate-600 font-bold text-sm">Reject</Text>
                     </TouchableOpacity>
                 </View>
              </View>
           </View>
        </View>

        {/* Performance Stats */}
        <View className="bg-blue-100 rounded-xl p-6 shadow-sm mb-6">
            <Text className="text-blue-800 font-bold text-xs tracking-widest uppercase mb-6">PERFORMANCE STATS</Text>
            <View className="flex-row justify-around">
                <View className="items-center">
                    <Text className="text-gray-900 text-3xl font-black tracking-tight mb-1">4.9</Text>
                    <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">RATING</Text>
                </View>
                <View className="w-px h-full bg-blue-200" />
                <View className="items-center">
                    <Text className="text-gray-900 text-3xl font-black tracking-tight mb-1">152</Text>
                    <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">HOURS</Text>
                </View>
            </View>
        </View>

      </ScrollView>
    </View>
  );
}
