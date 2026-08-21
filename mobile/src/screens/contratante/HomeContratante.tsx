import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, Zap, Wrench, Paintbrush, ShieldCheck, Plus, Briefcase, Star, ArrowRight, Calendar, MapPin } from '../../components/icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { JOB_CATEGORIES } from '../../data/jobCategories';
import { CategoryIcon, getCategoryIconAndColors } from '../../components/CategoryIcon';

export default function HomeContratante({ navigation }: any) {
  const [userName, setUserName] = useState('');
  const [userInitial, setUserInitial] = useState('U');
  const [myJobs, setMyJobs] = useState<any[]>([]);

  React.useEffect(() => {
    async function loadUser() {
      try {
        const data = await AsyncStorage.getItem('@ContrataAI:userData');
        if (data) {
          const { name } = JSON.parse(data);
          const first = name.split(' ')[0];
          setUserName(first);
          setUserInitial(first.charAt(0).toUpperCase());
        } else {
          setUserName('Usuário');
          setUserInitial('U');
        }
      } catch (e) {
        setUserName('Usuário');
        setUserInitial('U');
      }
    }
    loadUser();
  }, []);

  const loadMyJobs = useCallback(async () => {
    let serverJobs: any[] = [];
    try {
      const res = await api.get('/jobs/my').catch((e: any) => {
        if (e && (e.code === 'ECONNABORTED' || !e.response)) return { data: [] };
        return api.get('/jobs').catch(() => ({ data: [] }));
      });
      if (res.data && Array.isArray(res.data)) {
        serverJobs = res.data.map(item => ({
          ...item,
          status: item.status === 'OPEN' ? 'Ativa' : item.status === 'COMPLETED' ? 'Concluída' : item.status,
          paymentValue: item.price ? item.price.toFixed(2).replace('.', ',') : item.paymentValue || '0,00',
          proposalsCount: item.applications ? item.applications.length : (item.proposalsCount || 0)
        }));
      }
    } catch {
      // servidor offline ou sem token
    }

    try {
      const raw = await AsyncStorage.getItem('@ContrataAI:myJobs');
      const localJobs = raw ? JSON.parse(raw) : [];
      
      // Mesclar removendo duplicatas pelo ID ou título
      const combined = [...localJobs];
      serverJobs.forEach(sj => {
        if (!combined.some(cj => cj.id === sj.id || (cj.title === sj.title && cj.date === sj.date))) {
          combined.push(sj);
        }
      });

      // Carregar propostas globais e pessoais para exibir contagem 100% real
      const rawAllProps = await AsyncStorage.getItem('@ContrataAI:allProposals');
      const rawMyProps = await AsyncStorage.getItem('@ContrataAI:myProposals');
      const allProps = rawAllProps ? JSON.parse(rawAllProps) : [];
      const myProps = rawMyProps ? JSON.parse(rawMyProps) : [];

      const combinedProps = [...allProps];
      myProps.forEach((mp: any) => {
        if (!combinedProps.some((cp: any) => cp.id === mp.id)) {
          combinedProps.push(mp);
        }
      });

      const enriched = combined.map(j => {
        const matchingProps = combinedProps.filter((p: any) => {
          if (p.jobId && j.id && String(p.jobId) === String(j.id)) {
            return true;
          }
          if (p.jobTitle && j.title && String(p.jobTitle).toLowerCase().trim() === String(j.title).toLowerCase().trim()) {
            const pCat = (p.jobCategory || p.jobProfession || p.categoryLabel || p.skills?.[0] || '').toLowerCase().trim();
            const jCat = (j.categoryLabel || j.profession || j.category || '').toLowerCase().trim();
            if (pCat && jCat && (pCat.includes(jCat) || jCat.includes(pCat) || pCat === jCat)) {
              return true;
            }
          }
          return false;
        });
        
        const realCount = matchingProps.length > 0 
          ? matchingProps.length 
          : (j.applications && Array.isArray(j.applications) ? j.applications.length : 0);

        return {
          ...j,
          proposalsCount: realCount
        };
      });

      setMyJobs(enriched);
    } catch {
      setMyJobs(serverJobs);
    }
  }, []);

  useEffect(() => {
    loadMyJobs();
    if (!navigation || typeof navigation.addListener !== 'function') return;
    const unsubscribe = navigation.addListener('focus', () => {
      loadMyJobs();
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        try { unsubscribe(); } catch (e) {}
      }
    };
  }, [loadMyJobs, navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-6 pb-6">
          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-14 h-14 rounded-full bg-[#FFF4ED] items-center justify-center border border-orange-100">
                <Text className="text-[#F97316] text-xl font-extrabold">{userInitial}</Text>
              </View>
              <View className="absolute bottom-0 right-0 w-4 h-4 bg-[#34D399] rounded-full border-2 border-white" />
            </View>
            <View className="ml-3">
              <Text className="text-[#64748B] text-sm font-medium">Bem-vindo de volta,</Text>
              <Text className="text-[#1E293B] text-xl font-extrabold">Olá, {userName}!</Text>
            </View>
          </View>
          
          <TouchableOpacity className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100">
            <Text className="text-xl">🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center bg-white rounded-2xl border border-slate-100 px-4 py-1 shadow-sm">
            <Search color="#94A3B8" size={20} />
            <TextInput 
              placeholder="Busque por profissionais ou serviços"
              className="flex-1 ml-3 h-12 text-slate-800 text-[15px]"
              placeholderTextColor="#94A3B8"
            />
            <TouchableOpacity className="w-10 h-10 bg-[#FFF3ED] rounded-xl items-center justify-center ml-2">
              <SlidersHorizontal color="#F97316" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categorias */}
        <View className="px-6 mb-8">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
            {JOB_CATEGORIES.slice(0, 8).map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => navigation.navigate('CreateJob', { preselectedCategory: cat.id })}
                className="items-center mr-6"
              >
                <View 
                  className="w-16 h-16 rounded-2xl items-center justify-center mb-2 border border-slate-100 shadow-2xs"
                  style={{ backgroundColor: cat.bgColor || '#FFF4ED' }}
                >
                  <CategoryIcon category={cat.id} color={cat.color || '#F97316'} size={24} />
                </View>
                <Text className="text-[#475569] text-xs font-semibold">{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Profissionais em Destaque — exibir primeiro para o contratante */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-extrabold text-[#1E293B] mb-4">Profissionais em Destaque</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible pb-4">
            
            <View className="bg-white rounded-[24px] p-5 w-64 mr-4 shadow-sm border border-slate-50">
              <View className="flex-row items-start justify-between mb-4">
                <View className="w-14 h-14 bg-slate-200 rounded-full overflow-hidden">
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop' }} className="w-full h-full" />
                </View>
                <View className="bg-[#FEF3C7] w-8 h-8 rounded-full items-center justify-center">
                  <Star color="#D97706" size={14} fill="#D97706" />
                </View>
              </View>
              <Text className="text-[#1E293B] font-extrabold text-lg mb-1">Ana Silva</Text>
              <Text className="text-[#64748B] text-xs mb-2">Especialista em Limpeza</Text>
              
              <View className="flex-row items-center mb-4">
                <Star color="#F59E0B" size={14} fill="#F59E0B" />
                <Text className="text-[#1E293B] font-bold text-sm ml-1 mr-1">4.9</Text>
                <Text className="text-[#94A3B8] text-xs">(124 avaliações)</Text>
              </View>

              <View className="flex-row mb-4">
                <View className="bg-slate-100 px-2 py-1 rounded-md mr-2">
                  <Text className="text-[#475569] text-[10px]">Residencial</Text>
                </View>
                <View className="bg-slate-100 px-2 py-1 rounded-md">
                  <Text className="text-[#475569] text-[10px]">Pós-Obra</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => navigation.navigate('ProfessionalProfile', { professional: { name: 'Ana Silva', profession: 'Especialista em Limpeza', rating: 4.9, reviews: 124, price: 'A combinar', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop' } })}
                className="w-full bg-[#FFF4ED] py-3 rounded-xl items-center"
              >
                <Text className="text-[#F97316] font-bold text-sm">Ver Perfil</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white rounded-[24px] p-5 w-64 shadow-sm border border-slate-50">
              <View className="flex-row items-start justify-between mb-4">
                <View className="w-14 h-14 bg-slate-200 rounded-full overflow-hidden">
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop' }} className="w-full h-full" />
                </View>
                <View className="bg-[#FEF3C7] w-8 h-8 rounded-full items-center justify-center">
                  <Star color="#D97706" size={14} fill="#D97706" />
                </View>
              </View>
              <Text className="text-[#1E293B] font-extrabold text-lg mb-1">Carlos Roberto</Text>
              <Text className="text-[#64748B] text-xs mb-2">Eletricista Predial</Text>
              
              <View className="flex-row items-center mb-4">
                <Star color="#F59E0B" size={14} fill="#F59E0B" />
                <Text className="text-[#1E293B] font-bold text-sm ml-1 mr-1">5.0</Text>
                <Text className="text-[#94A3B8] text-xs">(89 avaliações)</Text>
              </View>

              <View className="flex-row mb-4">
                <View className="bg-slate-100 px-2 py-1 rounded-md mr-2">
                  <Text className="text-[#475569] text-[10px]">Instalação</Text>
                </View>
                <View className="bg-slate-100 px-2 py-1 rounded-md">
                  <Text className="text-[#475569] text-[10px]">Manutenção</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => navigation.navigate('ProfessionalProfile', { professional: { name: 'Carlos Roberto', profession: 'Eletricista Predial', rating: 5.0, reviews: 89, price: 'A partir de R$ 80', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop' } })}
                className="w-full bg-[#FFF4ED] py-3 rounded-xl items-center"
              >
                <Text className="text-[#F97316] font-bold text-sm">Ver Perfil</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>

        {/* Anúncio compacto — banner discreto */}
        <View className="px-6 mb-6">
          <TouchableOpacity 
            activeOpacity={0.9}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#1E293B', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                <Star color="#F59E0B" size={16} fill="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Serviza Pro — Destaque seu perfil</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700', marginRight: 4 }}>Saiba mais</Text>
              <ArrowRight color="#F59E0B" size={12} />
            </View>
          </TouchableOpacity>
          <Text style={{ fontSize: 9, color: '#CBD5E1', textAlign: 'right', marginTop: 3 }}>Anúncio</Text>
        </View>

        {/* Minhas Vagas */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-extrabold text-[#1E293B]">Minhas Vagas</Text>
            {myJobs.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Busca')}>
                <Text className="text-[#F97316] font-bold text-sm">Ver todas ({myJobs.length})</Text>
              </TouchableOpacity>
            )}
          </View>

          {myJobs.length === 0 ? (
            <View className="bg-white rounded-3xl p-8 border border-slate-100 items-center shadow-sm">
              <View className="w-16 h-16 bg-[#FFF4ED] rounded-full items-center justify-center mb-4">
                <Briefcase color="#F97316" size={28} />
              </View>
              <Text className="text-[#1E293B] font-bold text-base mb-2">Nenhuma vaga publicada</Text>
              <Text className="text-[#94A3B8] text-sm text-center mb-5 leading-relaxed">
                Publique sua primeira vaga e encontre profissionais qualificados rapidamente.
              </Text>
              <TouchableOpacity 
                className="bg-[#FFF4ED] px-6 py-3.5 rounded-xl"
                onPress={() => navigation.navigate('CreateJob')}
              >
                <Text className="text-[#F97316] font-bold text-sm">Publicar minha primeira vaga</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myJobs.slice(0, 2).map((job) => {
              const jobDetails = getCategoryIconAndColors(job.categoryLabel || job.profession || job.title);
              return (
                <TouchableOpacity 
                  key={job.id}
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate('JobProposals', { job })}
                  className="bg-white rounded-3xl p-5 border border-slate-100 mb-3 shadow-sm"
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center flex-1 pr-3">
                      <View 
                        className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                        style={{ backgroundColor: jobDetails.bgColor }}
                      >
                        <CategoryIcon category={job.categoryLabel || job.profession} profession={job.profession || job.title} color={jobDetails.color} size={22} strokeWidth={2.4} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[#1E293B] font-extrabold text-[16px] leading-snug" numberOfLines={1}>{job.title}</Text>
                        <Text className="text-[#64748B] text-xs font-medium mt-0.5">
                          {job.profession || job.categoryLabel || jobDetails.label}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[#F97316] font-extrabold text-base">
                      R$ {job.paymentValue || '0,00'}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center pt-2 border-t border-slate-100 justify-between">
                    <View className="bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                      <Text className="text-[#15803D] text-[11px] font-bold uppercase tracking-wider">
                        {job.status || 'Ativa'}
                      </Text>
                    </View>
                    <Text className="text-[#F97316] font-bold text-xs">
                      {job.proposalsCount > 0 ? `${job.proposalsCount} propostas` : 'Aguardando propostas'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Footer */}
        <View className="px-6 pb-20 mt-2">
          <TouchableOpacity className="w-full bg-[#FFF4ED] py-4 rounded-2xl flex-row justify-center items-center">
            <Text className="text-[#F97316] font-bold text-[15px] mr-2">Ver todos os profissionais</Text>
            <ArrowRight color="#F97316" size={18} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
