import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function FindAMentor() {
  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 pt-12 pb-32">
        <View className="gap-6 w-full mb-8">
            <View className="border border-slate-300 rounded-xl px-12 py-4 shadow-sm relative">
               <TextInput
                  placeholder="Search for mentors by name, IIT, or subject..."
                  className="text-gray-500 text-base"
               />
               <View className="absolute left-4 top-1/2 -translate-y-[8px]">
                   {/* Search Icon Placeholder */}
                   <View className="w-[18px] h-[18px] bg-slate-300 rounded-full" />
               </View>
            </View>

            <View className="flex-row items-center gap-2 mt-4 flex-wrap">
              <Text className="text-gray-600 text-base">Subject Filters:</Text>
              <TouchableOpacity className="bg-blue-800 rounded-full py-2 px-6">
                 <Text className="text-white text-center text-base">All</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white border border-slate-300 rounded-full py-2 px-6">
                 <Text className="text-gray-600 text-center text-base">Maths</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white border border-slate-300 rounded-full py-2 px-6">
                 <Text className="text-gray-600 text-center text-base">Physics</Text>
              </TouchableOpacity>
               <TouchableOpacity className="bg-white border border-slate-300 rounded-full py-2 px-6">
                 <Text className="text-gray-600 text-center text-base">Chemistry</Text>
              </TouchableOpacity>
            </View>
        </View>

        {/* Mentor Cards section */}
        <View className="gap-6 w-full pb-20">
             {/* Card 1 */}
            <View className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
              <View className="flex-row gap-4 mb-4">
                 <View className="rounded-lg overflow-hidden border border-slate-100 w-20 h-20">
                     {/* Image Placeholder */}
                     <View className="w-full h-full bg-slate-200" />
                 </View>
                 <View>
                    <View className="flex-row items-center gap-1 mb-1">
                       {/* Star Icon placeholder */}
                       <View className="w-3 h-3 bg-blue-500 rounded-full" />
                       <Text className="text-gray-900 font-bold">5.0</Text>
                       <Text className="text-slate-400 text-xs">(210 reviews)</Text>
                    </View>
                    <Text className="text-gray-900 text-base mb-1">Priya Iyer</Text>
                    <Text className="text-blue-800 font-bold text-base">IIT Delhi</Text>
                 </View>
              </View>

              <View className="gap-2 mb-4">
                 <View className="flex-row items-center gap-2">
                    {/* Beaker Icon placeholder */}
                    <View className="w-4 h-4 bg-slate-400 rounded" />
                    <Text className="text-gray-600 text-base">Electrical Engineering</Text>
                 </View>
                 <View className="flex-row gap-2 mt-2">
                    <View className="bg-blue-50 px-3 py-1 rounded-full">
                       <Text className="text-blue-800 font-bold text-xs">Chemistry</Text>
                    </View>
                    <View className="bg-blue-50 px-3 py-1 rounded-full">
                       <Text className="text-blue-800 font-bold text-xs">Calculus</Text>
                    </View>
                 </View>
              </View>

              <View className="border-t border-slate-100 flex-row justify-between items-center pt-4">
                  <View>
                     <Text className="text-slate-400 text-xs font-bold tracking-wider mb-1">PER SESSION</Text>
                     <View className="flex-row items-baseline">
                         <Text className="text-gray-900 text-base font-bold">₹900</Text>
                         <Text className="text-slate-500 text-sm">/hr</Text>
                     </View>
                  </View>
                  <TouchableOpacity className="bg-blue-800 rounded-lg py-3 px-6">
                     <Text className="text-white text-base font-medium">Book Session</Text>
                  </TouchableOpacity>
              </View>
            </View>

            {/* Card 2 */}
            <View className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
              <View className="flex-row gap-4 mb-4">
                 <View className="rounded-lg overflow-hidden border border-slate-100 w-20 h-20">
                     {/* Image Placeholder */}
                     <View className="w-full h-full bg-slate-200" />
                 </View>
                 <View>
                    <View className="flex-row items-center gap-1 mb-1">
                       <View className="w-3 h-3 bg-blue-500 rounded-full" />
                       <Text className="text-gray-900 font-bold">4.8</Text>
                       <Text className="text-slate-400 text-xs">(85 reviews)</Text>
                    </View>
                    <Text className="text-gray-900 text-base mb-1">Rohan Verma</Text>
                    <Text className="text-blue-800 font-bold text-base">IIT Kanpur</Text>
                 </View>
              </View>

              <View className="gap-2 mb-4">
                 <View className="flex-row items-center gap-2">
                    <View className="w-4 h-4 bg-slate-400 rounded" />
                    <Text className="text-gray-600 text-base">Mechanical Engineering</Text>
                 </View>
                 <View className="flex-row gap-2 mt-2">
                    <View className="bg-blue-50 px-3 py-1 rounded-full">
                       <Text className="text-blue-800 font-bold text-xs">Physics</Text>
                    </View>
                    <View className="bg-blue-50 px-3 py-1 rounded-full">
                       <Text className="text-blue-800 font-bold text-xs">Mechanics</Text>
                    </View>
                 </View>
              </View>

              <View className="border-t border-slate-100 flex-row justify-between items-center pt-4">
                  <View>
                     <Text className="text-slate-400 text-xs font-bold tracking-wider mb-1">PER SESSION</Text>
                     <View className="flex-row items-baseline">
                         <Text className="text-gray-900 text-base font-bold">₹800</Text>
                         <Text className="text-slate-500 text-sm">/hr</Text>
                     </View>
                  </View>
                  <TouchableOpacity className="bg-blue-800 rounded-lg py-3 px-6">
                     <Text className="text-white text-base font-medium">Book Session</Text>
                  </TouchableOpacity>
              </View>
            </View>

            {/* Promotion CTA */}
            <View className="bg-blue-800 rounded-xl p-6 items-center shadow-sm">
                <View className="w-8 h-10 bg-slate-300 rounded mb-4" /> {/* Icon placeholder */}
                <Text className="text-white text-base mb-2">Become a Mentor</Text>
                <Text className="text-white text-center opacity-90 text-sm mb-6">
                   Are you an IITian looking to guide the next generation? Join our prestigious community.
                </Text>
                <TouchableOpacity className="bg-white rounded-full py-3 px-8 shadow-sm">
                    <Text className="text-blue-800 font-bold text-base">Apply Now</Text>
                </TouchableOpacity>
            </View>
        </View>

      </ScrollView>
    </View>
  );
}
