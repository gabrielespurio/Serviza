import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, ChevronRight, Briefcase, Filter, Sparkles, Wrench, Clock } from '../../components/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JOB_CATEGORIES } from '../../data/jobCategories';
import { api } from '../../services/api';
import { CategoryIcon, getCategoryIconAndColors } from '../../components/CategoryIcon';

export default function SearchJobsScreen({ route, navigation }: any) {
  const initialCategory = route?.params?.category || 'todos';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllRealJobs = useCallback(async () => {
    try {
      setRefreshing(true);
      // 1. Carregar vagas locais criadas pelo contratante (@ContrataAI:myJobs)
      const rawLocal = await AsyncStorage.getItem('@ContrataAI:myJobs');
      const localJobs = rawLocal ? JSON.parse(rawLocal) : [];

      const formattedLocal = localJobs.map((j: any) => ({
        id: j.id,
        title: j.title || 'Serviço Solicitado',
        categoryLabel: j.categoryLabel || j.profession || 'Serviço Presencial',
        categoryId: j.category || 'outros',
        location: j.location || 'São Paulo - SP',
        price: j.paymentValue ? parseFloat(j.paymentValue) || 200 : 200,
        priceLabel: j.paymentValue ? `R$ ${j.paymentValue}` : 'A combinar',
        timeAgo: 'Hoje',
        description: j.description || `Preciso de um profissional de ${j.profession || 'serviços presenciais'} para atendimento rápido no local.`,
        date: j.date || new Date().toISOString()
      }));

      // 2. Buscar vagas reais da API /jobs do backend
      let apiJobs: any[] = [];
      try {
        const res = await api.get('/jobs', { timeout: 2000 });
        if (Array.isArray(res.data)) {
          apiJobs = res.data.map(j => ({
            id: j.id,
            title: j.title || 'Serviço Presencial',
            categoryLabel: j.category || 'Serviço Presencial',
            categoryId: 'outros',
            location: j.location || 'São Paulo - SP',
            price: j.price || 150,
            priceLabel: `R$ ${j.price || 150}`,
            timeAgo: 'Hoje',
            description: j.description || 'Atendimento presencial solicitado por contratante.',
            date: j.date || new Date().toISOString()
          }));
        }
      } catch (e) {}

      // Apenas vagas reais sem duplicação
      const combinedReal = [...formattedLocal, ...apiJobs];
      setAllJobs(combinedReal);
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (route?.params?.category) {
      setSelectedCategory(route.params.category);
    }
    fetchAllRealJobs();
    if (!navigation || typeof navigation.addListener !== 'function') return;
    const unsubscribe = navigation.addListener('focus', () => {
      if (route?.params?.category) {
        setSelectedCategory(route.params.category);
      }
      fetchAllRealJobs();
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        try { unsubscribe(); } catch (e) {}
      }
    };
  }, [route?.params?.category, navigation, fetchAllRealJobs]);

  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      // Filtro de categoria
      if (selectedCategory !== 'todos' && job.categoryId !== selectedCategory) {
        const catObj = JOB_CATEGORIES.find(c => c.id === selectedCategory);
        if (catObj && !catObj.label.toLowerCase().includes((job.categoryLabel || '').toLowerCase()) && !(job.title || '').toLowerCase().includes(selectedCategory)) {
          return false;
        }
      }
      // Filtro de busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = (job.title || '').toLowerCase().includes(q);
        const matchCat = (job.categoryLabel || '').toLowerCase().includes(q);
        const matchDesc = (job.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchDesc) return false;
      }
      return true;
    });
  }, [allJobs, selectedCategory, searchQuery]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      {/* Header e Busca */}
      <View className="px-6 pt-4 pb-3 bg-white border-b border-slate-100">
        <Text className="text-2xl font-extrabold text-[#1E293B] mb-3">Buscar Demandas Reais</Text>

        <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 py-3 border border-slate-200/80">
          <Search color="#94A3B8" size={19} className="mr-2.5" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por profissão ou palavra-chave..."
            placeholderTextColor="#94A3B8"
            className="flex-1 text-[#1E293B] text-[15px] font-medium p-0"
          />
        </View>
      </View>

      {/* Chips de Categorias Horizontal */}
      <View className="bg-white pb-3 pt-2 border-b border-slate-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory('todos')}
            className={`px-4 py-2 rounded-full border ${
              selectedCategory === 'todos' ? 'bg-[#1E293B] border-[#1E293B]' : 'bg-white border-slate-200'
            }`}
          >
            <Text className={`text-xs font-bold ${selectedCategory === 'todos' ? 'text-white' : 'text-[#64748B]'}`}>
              Todas as Vagas
            </Text>
          </TouchableOpacity>

          {JOB_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full border flex-row items-center ${
                selectedCategory === cat.id ? 'bg-[#FF7A2F] border-[#FF7A2F]' : 'bg-white border-slate-200'
              }`}
            >
              <View className="mr-1.5">
                <CategoryIcon category={cat.id} color={selectedCategory === cat.id ? '#FFFFFF' : cat.color} size={15} />
              </View>
              <Text className={`text-xs font-bold ${selectedCategory === cat.id ? 'text-white' : 'text-[#64748B]'}`}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de Vagas Reais */}
      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllRealJobs} tintColor="#FF7A2F" />}
      >
        <Text className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider mb-3 ml-1">
          {filteredJobs.length} {filteredJobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
        </Text>

        {filteredJobs.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 border border-slate-100 items-center justify-center my-6">
            <Briefcase color="#CBD5E1" size={44} strokeWidth={1.5} className="mb-3" />
            <Text className="text-base font-bold text-[#334155] text-center mb-1">
              Nenhuma vaga real disponível no momento
            </Text>
            <Text className="text-xs text-[#64748B] text-center">
              Assim que um contratante publicar um serviço na plataforma, ele estará disponível aqui.
            </Text>
          </View>
        ) : (
          filteredJobs.map(job => {
            const jobDetails = getCategoryIconAndColors(job.categoryLabel || job.categoryId || job.title);
            return (
              <TouchableOpacity
                key={job.id}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('JobDetails', { job })}
                className="bg-white rounded-[26px] p-5 mb-3.5 border border-slate-100/90 shadow-sm flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <View 
                    className="w-14 h-14 rounded-2xl items-center justify-center mr-3.5"
                    style={{ backgroundColor: jobDetails.bgColor }}
                  >
                    <CategoryIcon category={job.categoryLabel || job.categoryId} profession={job.profession || job.title} color={jobDetails.color} size={24} strokeWidth={2.4} />
                  </View>
                <View className="flex-1">
                  <Text className="text-base font-extrabold text-[#1E293B] mb-1" numberOfLines={1}>
                    {job.title}
                  </Text>
                  <View className="flex-row items-center flex-wrap gap-1">
                    <MapPin color="#64748B" size={13} />
                    <Text className="text-xs text-[#64748B] font-medium mr-1.5">{job.location}</Text>
                    <Text className="text-xs font-extrabold text-[#16A34A]">{job.priceLabel}</Text>
                  </View>
                </View>
              </View>

              <View className="items-end">
                <View className="bg-slate-100 px-2.5 py-1 rounded-full mb-1">
                  <Text className="text-[11px] font-bold text-[#64748B]">{job.timeAgo}</Text>
                </View>
                <ChevronRight color="#CBD5E1" size={18} />
              </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
