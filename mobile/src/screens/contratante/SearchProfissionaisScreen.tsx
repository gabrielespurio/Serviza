import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, SlidersHorizontal, Star, ShieldCheck } from '../../components/icons';

// Mock data for the professionals based on the design
const PROFESSIONALS = [
  {
    id: '1',
    name: 'Roberto Silva',
    profession: 'Eletricista Residencial',
    level: 'Ouro',
    levelColor: '#F59E0B',
    levelBg: '#FEF3C7',
    reviews: 120,
    rating: 4.9,
    price: 'A partir de R$ 100',
    verifiedColor: '#F59E0B', // Yellow check
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'Ana Souza',
    profession: 'Limpeza Profissional',
    level: 'Prata',
    levelColor: '#64748B',
    levelBg: '#F1F5F9',
    reviews: 45,
    rating: 4.7,
    price: 'A combinar',
    verifiedColor: '#3B82F6', // Blue check
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: '3',
    name: 'Carlos Mendes',
    profession: 'Encanador',
    level: 'Bronze',
    levelColor: '#B45309',
    levelBg: '#FFEDD5',
    reviews: 18,
    rating: 4.5,
    price: 'A partir de R$ 80',
    verifiedColor: '#B45309', // Bronze check
    image: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: '4',
    name: 'Juliana Costa',
    profession: 'Design de Interiores',
    level: 'Especialista',
    levelColor: '#9333EA',
    levelBg: '#F3E8FF',
    reviews: 215,
    rating: 5.0,
    price: 'Orçamento',
    verifiedColor: '#9333EA', // Purple check
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop'
  }
];

const FILTERS = ['Mais Avaliados', 'Eletricista', 'Limpeza', 'Encanador'];

export default function SearchProfissionaisScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-slate-50">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 justify-center items-start"
        >
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-extrabold text-[#1E293B] mr-10">
          Explorar Profissionais
        </Text>
      </View>

      <ScrollView className="flex-1 bg-[#FAFAFA]" showsVerticalScrollIndicator={false}>
        
        {/* Search Bar Area */}
        <View className="px-6 pt-6 mb-5">
          <View className="flex-row items-center">
            <View className="flex-1 flex-row items-center bg-white rounded-2xl border border-slate-100 px-4 h-12 shadow-sm mr-3">
              <Search color="#94A3B8" size={20} />
              <TextInput 
                placeholder="Buscar nome ou serviço..."
                className="flex-1 ml-3 h-full text-slate-800 text-[15px]"
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity className="w-12 h-12 bg-white rounded-2xl border border-slate-100 items-center justify-center shadow-sm">
              <SlidersHorizontal color="#475569" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="px-6 mb-6"
          contentContainerStyle={{ paddingRight: 32 }}
        >
          {/* Main Filter (Preço) */}
          <TouchableOpacity className="flex-row items-center bg-[#F97316] px-5 py-2.5 rounded-full mr-3 shadow-sm">
            <SlidersHorizontal color="#FFFFFF" size={14} style={{ marginRight: 6 }} />
            <Text className="text-white font-bold text-sm">Preço</Text>
          </TouchableOpacity>

          {/* Other Filters */}
          {FILTERS.map((filter, index) => (
            <TouchableOpacity 
              key={index}
              onPress={() => setActiveFilter(activeFilter === filter ? '' : filter)}
              className={`px-5 py-2.5 rounded-full mr-3 border ${
                activeFilter === filter 
                  ? 'bg-slate-800 border-slate-800' 
                  : 'bg-white border-slate-200'
              } shadow-sm`}
            >
              <Text className={`font-bold text-sm ${
                activeFilter === filter ? 'text-white' : 'text-[#475569]'
              }`}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Professionals List */}
        <View className="px-6 pb-8">
          {PROFESSIONALS.map((prof) => (
            <TouchableOpacity 
              key={prof.id}
              activeOpacity={0.85}
              className="bg-white rounded-3xl p-5 mb-4 border border-slate-100 shadow-sm"
              onPress={() => navigation.navigate('ProfessionalProfile', { professional: prof })}
            >
              {/* Top Row: Info */}
              <View className="flex-row mb-4">
                {/* Profile Image */}
                <View className="w-16 h-16 rounded-full bg-slate-200 mr-4 overflow-hidden border-2 border-white shadow-sm">
                  <Image source={{ uri: prof.image }} className="w-full h-full" />
                </View>

                {/* Details */}
                <View className="flex-1 pt-1">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-[#1E293B] font-extrabold text-[17px] mb-1">
                      {prof.name}
                    </Text>
                    <View className="flex-row items-center bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <Star color="#F59E0B" size={12} fill="#F59E0B" />
                      <Text className="text-[#1E293B] font-bold text-[13px] ml-1">{prof.rating}</Text>
                    </View>
                  </View>
                  
                  <Text className="text-[#64748B] text-[13px] font-medium mb-2.5">
                    {prof.profession}
                  </Text>

                  <View className="flex-row items-center">
                    <View style={{ backgroundColor: prof.levelBg }} className="px-2 py-0.5 rounded-md mr-2">
                      <Text style={{ color: prof.levelColor }} className="text-[11px] font-bold">
                        {prof.level}
                      </Text>
                    </View>
                    <Text className="text-[#94A3B8] text-[12px] font-medium">
                      •  {prof.reviews} avaliações
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bottom Row: Price & Button */}
              <View className="flex-row justify-between items-center pt-3 border-t border-slate-50">
                <View className="flex-row items-center flex-1">
                  <View className="w-6 h-6 rounded-full items-center justify-center mr-2 bg-slate-50">
                    <ShieldCheck color={prof.verifiedColor} size={16} strokeWidth={2.5} />
                  </View>
                  <Text className="text-[#1E293B] font-bold text-[14px]">
                    {prof.price.includes('A partir') ? (
                      <>
                        <Text className="text-[#64748B] font-medium text-[14px]">A partir de </Text>
                        <Text className="text-[#1E293B] font-bold text-[14px]">{prof.price.replace('A partir de ', '')}</Text>
                      </>
                    ) : (
                      prof.price
                    )}
                  </Text>
                </View>

                <View className="bg-[#FFF4ED] px-4 py-2.5 rounded-xl">
                  <Text className="text-[#F97316] font-bold text-[13px]">Ver Perfil</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
