import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

export default function SessionChat({ navigation }) {
  return (
    <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-200">
           <View className="flex-row items-center gap-3">
               <TouchableOpacity onPress={() => navigation.goBack()}>
                  <View className="w-5 h-5" >
                      <Text className="text-blue-800 text-xl font-bold">←</Text>
                  </View>
               </TouchableOpacity>
               <Text className="text-blue-800 text-xl font-bold">Live Session</Text>
           </View>
           <View className="flex-row items-center gap-3 bg-red-100 rounded-full px-3 py-1">
               <View className="w-2 h-2 rounded-full bg-red-600" />
               <Text className="text-red-600 text-sm font-bold">REC 14:02</Text>
           </View>
           <TouchableOpacity>
               <Text className="text-blue-800 text-xl font-bold">⋮</Text>
           </TouchableOpacity>
        </View>

        {/* Chat Title */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-200">
           <View className="flex-row items-center gap-3">
               <View className="w-5 h-5 bg-blue-800 rounded opacity-80" /> {/* Chat Icon Placeholder */}
               <Text className="text-gray-900 text-2xl font-bold">Session Chat</Text>
           </View>
           <TouchableOpacity>
               <Text className="text-slate-500 text-xl">✕</Text>
           </TouchableOpacity>
        </View>

        {/* Chat Area */}
        <ScrollView className="flex-1 px-4 py-6">
            <View className="items-center mb-6">
                <View className="bg-slate-100 rounded-full px-4 py-1">
                   <Text className="text-slate-500 text-xs">10:30 AM</Text>
                </View>
            </View>

            {/* Message 1 (Received) */}
            <View className="flex-row gap-3 mb-6 pr-12">
               <View className="w-8 h-8 rounded-full bg-slate-300 overflow-hidden mt-6" /> {/* Avatar */}
               <View>
                   <Text className="text-gray-900 text-xs font-bold mb-1 ml-1">Prof. Ananya</Text>
                   <View className="bg-blue-50 rounded-2xl p-4 rounded-tl-sm">
                       <Text className="text-gray-900 text-base leading-relaxed">
                           Good morning! I've uploaded the reference PDF for the Fourier Transform derivation we just discussed. Did you see it?
                       </Text>
                   </View>
               </View>
            </View>

            {/* Message 2 (Sent) */}
            <View className="flex-row justify-end gap-3 mb-6 pl-12">
               <View className="items-end">
                   <Text className="text-gray-900 text-xs font-bold mb-1 mr-1">You</Text>
                   <View className="bg-blue-900 rounded-2xl p-4 rounded-tr-sm">
                       <Text className="text-white text-base leading-relaxed">
                           Yes Professor, I'm downloading it now. The third step in the proof was a bit confusing for me though.
                       </Text>
                   </View>
               </View>
               <View className="w-8 h-8 rounded-full bg-slate-300 overflow-hidden mt-6" /> {/* Avatar */}
            </View>

            {/* Message 3 (Received) */}
            <View className="flex-row gap-3 mb-6 pr-12">
               <View className="w-8 h-8 rounded-full bg-slate-300 overflow-hidden mt-6" /> {/* Avatar */}
               <View>
                   <Text className="text-gray-900 text-xs font-bold mb-1 ml-1">Prof. Ananya</Text>
                   <View className="bg-blue-50 rounded-2xl p-4 rounded-tl-sm">
                       <Text className="text-gray-900 text-base leading-relaxed">
                           No problem! Let's re-examine that part of the slide. I'll share that specific screen again.
                       </Text>
                   </View>
               </View>
            </View>

            {/* System Message */}
            <View className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 mb-6">
                 <Text className="text-cyan-800 text-sm text-center">
                     Prof. Ananya shared a file: fourier_basics.pdf
                 </Text>
            </View>
        </ScrollView>

        {/* Input Area */}
        <View className="px-4 py-3 border-t border-slate-200">
           <View className="border border-slate-200 rounded-full flex-row items-center p-1 pl-4 h-14 bg-white">
               <TouchableOpacity className="mr-2">
                  <View className="w-6 h-6 border-2 border-slate-400 rounded-full items-center justify-center">
                     <Text className="text-slate-400 text-lg leading-[22px]">+</Text>
                  </View>
               </TouchableOpacity>
               <TextInput 
                  placeholder="Type a message..." 
                  className="flex-1 text-base text-gray-900 h-full"
               />
               <TouchableOpacity className="bg-blue-900 rounded-full w-12 h-12 items-center justify-center">
                  <Text className="text-white text-lg font-bold">➤</Text>
               </TouchableOpacity>
           </View>
           <Text className="text-slate-400 text-center text-xs mt-2 mb-2">Everyone in the meeting can see these messages</Text>
        </View>

    </View>
  );
}
