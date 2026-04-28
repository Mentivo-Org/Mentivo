import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';

export default function AudioCall() {
  return (
    <SafeAreaView className="flex-1 bg-[#11131A]">
      <StatusBar barStyle="light-content" backgroundColor="#11131A" />
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
          <View>
              <Text className="text-white text-xl font-bold mb-1">IIT Mentors  •  00:42:15</Text>
              <View className="flex-row items-center">
                  <View className="w-3 h-3 bg-slate-400 rounded-full mr-2" /> {/* Group icon placeholder */}
                  <Text className="text-slate-400 text-sm">2 participants</Text>
              </View>
          </View>
          <View className="flex-row gap-6">
              {/* Rotate Camera Icon Placeholder */}
              <TouchableOpacity className="w-6 h-6 border-2 border-slate-300 rounded items-center justify-center">
                  <Text className="text-slate-300 text-[10px]">⟲</Text>
              </TouchableOpacity>
              {/* Speaker Icon Placeholder */}
              <TouchableOpacity className="w-6 h-6 items-center justify-center">
                  <Text className="text-slate-300 text-lg">🔊</Text>
              </TouchableOpacity>
          </View>
      </View>

      {/* Main Call Area */}
      <View className="flex-1 justify-center items-center relative">

          {/* Participant PiP (Picture in Picture) */}
          <View className="absolute top-4 right-6 bg-[#1A1D24] border border-[#2A2E39] rounded-2xl w-32 h-44 items-center justify-center overflow-hidden z-10 shadow-lg">
               <View className="bg-slate-700 w-16 h-16 rounded-full items-center justify-center border-4 border-[#1A1D24]">
                   <View className="w-8 h-8 rounded-full bg-slate-500" />
               </View>
               {/* Mic muted icon */}
               <View className="absolute bottom-3 right-3 bg-[#11131A] p-1.5 rounded-full items-center justify-center">
                  <View className="w-3 h-3 bg-slate-400 rounded-full" />
               </View>
          </View>

          {/* Main User Avatar */}
          <View className="w-48 h-48 rounded-full bg-[#0E1528] items-center justify-center mb-8 border-[8px] border-[#141A2E]">
               <View className="w-24 h-24 rounded-full bg-[#00288e] flex-col items-center justify-end overflow-hidden pb-2">
                   <View className="w-10 h-10 bg-[#003ad4] rounded-full mb-1" />
                   <View className="w-20 h-10 bg-[#003ad4] rounded-t-full" />
               </View>
          </View>

          {/* Name Tag */}
          <View className="absolute bottom-28 left-6 bg-[#11131A] px-4 py-2 rounded-lg border border-[#2A2E39] flex-row items-center gap-2">
             <Text className="text-white font-medium">Prof. Ananya Sharma</Text>
             <View className="w-3 h-3 bg-blue-500 rounded-full" /> {/* Verified tick placeholder */}
          </View>

      </View>

      {/* Controls Bar */}
      <View className="flex-row justify-between items-center px-8 py-6 bg-[#11131A]">
          {/* Mic */}
          <TouchableOpacity className="w-14 h-14 rounded-full bg-[#2A2E39] items-center justify-center">
              <Text className="text-white text-xl">🎙</Text>
          </TouchableOpacity>
          
          {/* Video */}
          <TouchableOpacity className="w-14 h-14 rounded-full bg-[#2A2E39] items-center justify-center">
              <Text className="text-white text-xl">📹</Text>
          </TouchableOpacity>
          
          {/* Hand Raise */}
          <TouchableOpacity className="w-14 h-14 rounded-full bg-[#2A2E39] items-center justify-center">
              <Text className="text-white text-xl">✋</Text>
          </TouchableOpacity>
          
          {/* Chat */}
          <TouchableOpacity className="w-14 h-14 rounded-full bg-[#2A2E39] items-center justify-center">
              <Text className="text-white text-xl">💬</Text>
          </TouchableOpacity>

          {/* More options */}
          <TouchableOpacity className="w-14 h-14 rounded-full bg-[#2A2E39] items-center justify-center">
              <Text className="text-white text-xl">⋮</Text>
          </TouchableOpacity>
          
          {/* End Call */}
          <TouchableOpacity className="w-16 h-12 rounded-[24px] bg-[#EA4335] items-center justify-center">
              <Text className="text-white text-2xl transform rotate-[135deg]">📞</Text>
          </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
