import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Wrench } from '../components/icons';

export default function OnboardingScreen({ navigation }: any) {
  return (
    <View className="flex-1 bg-[#FF9A58]">
      {/* Background Gradient */}
      <LinearGradient
        colors={['#FF9A58', '#FF7F3F']}
        className="absolute inset-0"
      />

      {/* Main Illustration Area */}
      <View className="flex-1 justify-center items-center pb-20 relative">
        {/* The 3D Image Card */}
        <View 
          className="w-72 h-72 rounded-[40px] overflow-hidden items-center justify-center bg-[#15463E]"
          style={{
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
              android: { elevation: 15 },
              web: { boxShadow: '0px 20px 40px rgba(0,0,0,0.3)' }
            })
          }}
        >
          <Image 
            source={require('../../assets/floating_tools.png')} 
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Top Right Floating Badge */}
        <View className="absolute top-16 right-6 w-16 h-16 bg-white rounded-full justify-center items-center shadow-lg">
          <View className="w-10 h-10 bg-[#34D399] rounded-full justify-center items-center">
            <Check color="#fff" size={24} strokeWidth={3} />
          </View>
        </View>

        {/* Bottom Left Floating Badge */}
        <View className="absolute bottom-28 left-6 w-20 h-20 bg-white rounded-full justify-center items-center shadow-lg">
          <Wrench color="#FF7F3F" size={36} strokeWidth={2.5} />
        </View>
      </View>

      {/* Bottom Sheet */}
      <View className="bg-white rounded-t-[40px] px-8 pt-10 pb-12 w-full h-[45%] justify-between">
        <View>
          {/* Pagination Indicators */}
          <View className="flex-row justify-center space-x-2 mb-8 gap-2">
            <View className="w-10 h-2 bg-[#FF7F3F] rounded-full" />
            <View className="w-2 h-2 bg-slate-200 rounded-full" />
            <View className="w-2 h-2 bg-slate-200 rounded-full" />
          </View>

          <Text className="text-3xl font-extrabold text-[#1E293B] text-center mb-4">
            Encontre o serviço ideal.
          </Text>
          <Text className="text-[15px] text-[#64748B] text-center mb-8 leading-relaxed px-4">
            Conectamos profissionais qualificados a quem precisa de ajuda rápida.
          </Text>
        </View>

        <View>
          {/* Primary Button */}
          <TouchableOpacity 
            className="w-full bg-[#34D399] rounded-2xl py-4 mb-4 items-center"
            onPress={() => navigation.navigate('RegisterScreen')}
            style={{
              ...Platform.select({
                ios: { shadowColor: '#34D399', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
                web: { boxShadow: '0px 8px 16px rgba(52, 211, 153, 0.3)' }
              })
            }}
          >
            <Text className="text-white text-center font-bold text-lg tracking-wide">Começar agora</Text>
          </TouchableOpacity>

          {/* Secondary Button */}
          <TouchableOpacity 
            className="w-full py-4 items-center"
            onPress={() => navigation.navigate('Login')}
          >
            <Text className="text-[#FF7F3F] text-center font-bold text-[16px]">Já tenho conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
