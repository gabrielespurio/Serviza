import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Share2, 
  MapPin, 
  CheckCircle2, 
  Star, 
  Award, 
  ShieldCheck, 
  Crown, 
  Clock 
} from '../../components/icons';

// Mock data for the profile based on the design
const PROFILE = {
  name: 'Ricardo Silva',
  profession: 'Eletricista Residencial',
  location: 'São Paulo, SP • 2.5km',
  image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop',
  stats: {
    services: 142,
    rating: 4.9,
    punctuality: '98%',
  },
  badges: [
    { id: '1', title: 'Ouro', icon: Award, color: '#F59E0B', bg: '#FEF3C7' },
    { id: '2', title: 'Verificado', icon: ShieldCheck, color: '#475569', bg: '#F1F5F9' },
    { id: '3', title: 'Especialista', icon: Crown, color: '#3B82F6', bg: '#EFF6FF' },
    { id: '4', title: 'Rápido', icon: Clock, color: '#10B981', bg: '#ECFDF5' },
  ],
  about: 'Olá! Sou especialista em elétrica residencial com mais de 10 anos de experiência. Realizo instalações, reparos e manutenção com foco em segurança e qualidade. Trabalho com equipamentos de ponta para garantir o melhor resultado.',
  services: [
    {
      id: 's1',
      title: 'Instalação de Chuveiro',
      desc: 'Instalação completa com verificação de fiação e...',
      price: 'A partir de R$ 80',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop'
    },
    {
      id: 's2',
      title: 'Revisão Elétrica Geral',
      desc: 'Check-up preventivo de disjuntores, tomadas e fiação...',
      price: 'A partir de R$ 150',
      image: 'https://images.unsplash.com/photo-1558522195-e1201b090344?q=80&w=200&auto=format&fit=crop'
    },
    {
      id: 's3',
      title: 'Instalação de Tomadas',
      desc: 'Substituição ou adição de novos pontos de energia com...',
      price: 'A partir de R$ 45/ponto',
      image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=200&auto=format&fit=crop'
    }
  ],
  reviews: [
    {
      id: 'r1',
      author: 'Ana Maria',
      initials: 'AM',
      avatarBg: '#F3E8FF',
      avatarColor: '#9333EA',
      time: 'Há 2 dias',
      rating: 5,
      text: 'Excelente trabalho! O Ricardo foi super pontual, explicou o problema e resolveu rápido. Deixou tudo limpo depois.'
    },
    {
      id: 'r2',
      author: 'Carlos Souza',
      initials: 'CS',
      avatarBg: '#EFF6FF',
      avatarColor: '#3B82F6',
      time: 'Há 1 semana',
      rating: 5,
      text: 'Profissional muito competente. O preço foi justo pelo serviço prestado. Recomendo.'
    }
  ]
};

export default function ProfessionalProfileScreen({ navigation, route }: any) {
  // If data is passed via navigation, we can use it, otherwise use mock
  const passedProf = route?.params?.professional || {};
  const data = { 
    ...PROFILE, 
    ...passedProf,
    // Garantir que as listas não sejam sobrescritas por valores simples (ex: reviews: 120 da Busca)
    reviews: Array.isArray(passedProf.reviews) ? passedProf.reviews : PROFILE.reviews,
    services: Array.isArray(passedProf.services) ? passedProf.services : PROFILE.services,
    badges: Array.isArray(passedProf.badges) ? passedProf.badges : PROFILE.badges,
    stats: {
      ...PROFILE.stats,
      ...(passedProf.stats || {}),
      rating: passedProf.rating || PROFILE.stats.rating,
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 justify-center items-start"
        >
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[13px] font-extrabold text-[#64748B] tracking-wider uppercase mr-2">
          Perfil Profissional
        </Text>
        <TouchableOpacity className="w-10 h-10 justify-center items-end">
          <Share2 color="#1E293B" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
        
        {/* Profile Info Header */}
        <View className="items-center px-6 pt-2 pb-6">
          <View className="relative">
            <View className="w-28 h-28 rounded-full bg-slate-200 overflow-hidden border-[3px] border-white shadow-sm mb-4">
              <Image source={{ uri: data.image }} className="w-full h-full" />
            </View>
            {/* Online indicator */}
            <View className="absolute bottom-5 right-1 w-5 h-5 bg-[#10B981] rounded-full border-2 border-white" />
          </View>
          
          <View className="flex-row items-center mb-1">
            <Text className="text-[22px] font-extrabold text-[#1E293B] mr-1.5">{data.name}</Text>
            <CheckCircle2 color="#3B82F6" size={18} fill="#E0F2FE" />
          </View>
          <Text className="text-[14px] font-medium text-[#64748B] mb-2">{data.profession}</Text>
          
          <View className="flex-row items-center">
            <MapPin color="#94A3B8" size={14} style={{ marginRight: 4 }} />
            <Text className="text-[13px] font-medium text-[#94A3B8]">{data.location}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View className="px-6 mb-8">
          <View className="flex-row bg-white rounded-3xl border border-slate-100 shadow-sm py-4">
            <View className="flex-1 items-center border-r border-slate-100">
              <Text className="text-[20px] font-extrabold text-[#1E293B] mb-0.5">{data.stats.services}</Text>
              <Text className="text-[11px] font-medium text-[#64748B]">Serviços</Text>
            </View>
            <View className="flex-1 items-center border-r border-slate-100">
              <View className="flex-row items-center mb-0.5">
                <Text className="text-[20px] font-extrabold text-[#1E293B] mr-1">{data.stats.rating}</Text>
                <Star color="#F59E0B" size={14} fill="#F59E0B" />
              </View>
              <Text className="text-[11px] font-medium text-[#64748B]">Avaliação</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-[20px] font-extrabold text-[#1E293B] mb-0.5">{data.stats.punctuality}</Text>
              <Text className="text-[11px] font-medium text-[#64748B]">Pontualidade</Text>
            </View>
          </View>
        </View>

        {/* Conquistas */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center px-6 mb-4">
            <Text className="text-[18px] font-extrabold text-[#1E293B]">Conquistas</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-[13px] font-bold text-[#F97316] mr-1">Ver todas</Text>
              <Text className="text-[13px] font-bold text-[#F97316]">›</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
            {data.badges.map((badge: any) => {
              const IconComponent = badge.icon;
              return (
                <View key={badge.id} className="items-center mr-6">
                  <View 
                    style={{ backgroundColor: badge.bg }} 
                    className="w-16 h-16 rounded-full items-center justify-center mb-2 shadow-sm"
                  >
                    <IconComponent color={badge.color} size={24} strokeWidth={2.5} />
                  </View>
                  <Text className="text-[12px] font-semibold text-[#475569]">{badge.title}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Sobre */}
        <View className="px-6 mb-8">
          <Text className="text-[18px] font-extrabold text-[#1E293B] mb-4">Sobre</Text>
          <View className="bg-slate-50 rounded-3xl p-5 border border-slate-100">
            <Text className="text-[#475569] text-[14.5px] leading-relaxed font-medium">
              {data.about}
            </Text>
          </View>
        </View>

        {/* Catálogo de Serviços */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[18px] font-extrabold text-[#1E293B]">Catálogo de Serviços</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-[13px] font-bold text-[#F97316] mr-1">Ver todos</Text>
              <Text className="text-[13px] font-bold text-[#F97316]">›</Text>
            </TouchableOpacity>
          </View>

          {data.services.map((srv: any) => (
            <TouchableOpacity 
              key={srv.id} 
              activeOpacity={0.8}
              className="flex-row bg-white rounded-3xl p-4 mb-3 border border-slate-100 shadow-sm"
            >
              <View className="w-[72px] h-[72px] rounded-2xl bg-slate-200 overflow-hidden mr-4">
                <Image source={{ uri: srv.image }} className="w-full h-full" />
              </View>
              <View className="flex-1 justify-center">
                <Text className="text-[15px] font-extrabold text-[#1E293B] mb-1">{srv.title}</Text>
                <Text className="text-[12px] font-medium text-[#64748B] mb-2.5 line-clamp-1" numberOfLines={1}>
                  {srv.desc}
                </Text>
                <Text className="text-[13px] font-extrabold text-[#F97316]">{srv.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Avaliações Recentes */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[18px] font-extrabold text-[#1E293B]">Avaliações Recentes</Text>
            <View className="flex-row items-center">
              <Text className="text-[15px] font-extrabold text-[#1E293B] mr-1">4.9</Text>
              <Star color="#F59E0B" size={14} fill="#F59E0B" />
            </View>
          </View>

          {data.reviews.map((rev: any) => (
            <View key={rev.id} className="bg-slate-50 rounded-3xl p-5 mb-3 border border-slate-100">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center">
                  <View 
                    style={{ backgroundColor: rev.avatarBg }}
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  >
                    <Text style={{ color: rev.avatarColor }} className="font-extrabold text-[13px]">
                      {rev.initials}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-[14px] font-extrabold text-[#1E293B] mb-0.5">{rev.author}</Text>
                    <Text className="text-[11px] font-medium text-[#94A3B8]">{rev.time}</Text>
                  </View>
                </View>
                <View className="flex-row">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} color="#F59E0B" size={12} fill={i <= rev.rating ? "#F59E0B" : "transparent"} style={{ marginLeft: 2 }} />
                  ))}
                </View>
              </View>
              <Text className="text-[#475569] text-[13.5px] leading-relaxed font-medium">
                {rev.text}
              </Text>
            </View>
          ))}

          <TouchableOpacity className="py-4 items-center">
            <Text className="text-[13px] font-bold text-[#64748B]">Ler todas as 84 avaliações</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      
      {/* Botão Inferior Flutuante (Opcional, mas útil para chamar o prestador) */}
      <View className="px-6 py-4 bg-white border-t border-slate-50">
        <TouchableOpacity className="w-full bg-[#F97316] py-4 rounded-2xl items-center shadow-sm">
          <Text className="text-white font-extrabold text-[16px]">Solicitar Orçamento</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
