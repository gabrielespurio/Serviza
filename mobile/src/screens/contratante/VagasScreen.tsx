import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Briefcase, 
  Plus, 
  ChevronRight, 
  Users
} from '../../components/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import { CategoryIcon, getCategoryIconAndColors } from '../../components/CategoryIcon';

export interface JobItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  categoryLabel?: string;
  profession?: string;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  address?: {
    cidade?: string;
    estado?: string;
    rua?: string;
    bairro?: string;
  };
  paymentType?: string;
  paymentValue?: string;
  price?: number;
  status: 'Ativa' | 'Concluída' | 'Pausada' | 'Rascunho' | 'Em análise' | 'Em Andamento' | string;
  proposalsCount?: number;
  createdAt?: string;
}

const formatPostedDate = (isoString?: string | null): string => {
  if (!isoString) return 'Postado recentemente';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Postado recentemente';
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    return `Postado em ${day} ${month}`;
  } catch {
    return 'Postado recentemente';
  }
};

export default function VagasScreen({ navigation }: any) {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [filter, setFilter] = useState<'ativas' | 'em_andamento' | 'finalizadas'>('ativas');
  const [refreshing, setRefreshing] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      // Checar rascunho
      const rawDraft = await AsyncStorage.getItem('@ContrataAI:jobDraft');
      setHasDraft(!!rawDraft);

      let serverJobs: any[] = [];
      try {
        const res = await api.get('/jobs/my').catch((e: any) => {
          if (e && (e.code === 'ECONNABORTED' || !e.response)) return { data: [] };
          return api.get('/jobs').catch(() => ({ data: [] }));
        });
        if (res.data && Array.isArray(res.data)) {
          serverJobs = res.data.map(item => ({
            ...item,
            status: item.status === 'OPEN' ? 'Ativa' : item.status === 'COMPLETED' ? 'Concluída' : item.status === 'IN_PROGRESS' ? 'Em Andamento' : item.status,
            paymentValue: item.price ? (typeof item.price === 'number' ? item.price.toFixed(2).replace('.', ',') : String(item.price)) : item.paymentValue || '0,00',
            proposalsCount: item.applications ? item.applications.length : 0,
            createdAt: item.createdAt || item.date || new Date().toISOString()
          }));
        }
      } catch {
        // servidor offline ou sem token
      }

      // Carregar vagas locais e mesclar com as do servidor
      try {
        const rawJobs = await AsyncStorage.getItem('@ContrataAI:myJobs');
        const localJobs = rawJobs ? JSON.parse(rawJobs) : [];
        
        const combined = [...localJobs];
        serverJobs.forEach(sj => {
          if (!combined.some(cj => cj.id === sj.id || (cj.title === sj.title && cj.date === sj.date))) {
            combined.push(sj);
          }
        });

        // Carregar propostas reais salvas no storage
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

        const enrichedJobs = combined.map(j => {
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
          
          // Contagem 100% REAL de propostas recebidas (sem valores fictícios forçados)
          const realCount = matchingProps.length > 0 
            ? matchingProps.length 
            : (j.applications && Array.isArray(j.applications) ? j.applications.length : 0);

          return {
            ...j,
            paymentValue: j.paymentValue || (j.price ? (typeof j.price === 'number' ? j.price.toFixed(2).replace('.', ',') : String(j.price)) : '0,00'),
            createdAt: j.createdAt || j.date || new Date().toISOString(),
            proposalsCount: realCount
          };
        });

        setJobs(enrichedJobs);
      } catch {
        setJobs(serverJobs);
      }
    } catch (error) {
      console.log('Erro ao carregar vagas', error);
    }
  }, []);

  useEffect(() => {
    loadJobs();
    if (!navigation || typeof navigation.addListener !== 'function') return;
    const unsubscribe = navigation.addListener('focus', () => {
      loadJobs();
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        try { unsubscribe(); } catch (e) {}
      }
    };
  }, [loadJobs, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  // Filtragem coerente com as abas do design (Ativas, Em Andamento, Finalizadas)
  const filteredJobs = jobs.filter(job => {
    const statusLower = (job.status || 'Ativa').toLowerCase();
    if (filter === 'ativas') {
      return statusLower.includes('ativa') || statusLower === 'open' || !job.status;
    }
    if (filter === 'em_andamento') {
      return statusLower.includes('andamento') || statusLower === 'in_progress' || statusLower.includes('análise') || statusLower.includes('analise') || statusLower.includes('pausada');
    }
    if (filter === 'finalizadas') {
      return statusLower.includes('conclu') || statusLower.includes('finaliz') || statusLower === 'completed' || statusLower === 'cancelled';
    }
    return true;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      {/* Header — Voltar + Título Grande */}
      <View className="px-6 pt-5 pb-3 bg-[#FAFAFA] flex-row items-center">
        {navigation.canGoBack() && (
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mr-3 p-1"
          >
            <View className="w-8 h-8 items-center justify-center rounded-full bg-slate-100">
              <Text className="text-[#334155] font-bold text-lg">←</Text>
            </View>
          </TouchableOpacity>
        )}
        <Text className="text-[28px] font-extrabold text-[#1E293B] tracking-tight">
          Minhas Vagas
        </Text>
      </View>

      {/* Botão Laranja Destaque Larga - Criar Nova Vaga */}
      <View className="px-6 pb-5 bg-[#FAFAFA]">
        <TouchableOpacity 
          activeOpacity={0.88}
          onPress={() => navigation.navigate('CreateJob')}
          className="bg-[#FF7A2F] rounded-full py-4 flex-row items-center justify-center shadow-sm"
        >
          <View className="w-6 h-6 rounded-full bg-white items-center justify-center mr-2.5 shadow-sm">
            <Plus color="#FF7A2F" size={16} strokeWidth={3} />
          </View>
          <Text className="text-white font-bold text-[16px] tracking-wide">
            Criar Nova Vaga
          </Text>
        </TouchableOpacity>
      </View>

      {/* Abas Flat Sublinhadas (Ativas | Em Andamento | Finalizadas) */}
      <View className="flex-row border-b border-slate-200/80 px-6 bg-[#FAFAFA] mb-2">
        {[
          { id: 'ativas', label: 'Ativas' },
          { id: 'em_andamento', label: 'Em Andamento' },
          { id: 'finalizadas', label: 'Finalizadas' }
        ].map(tab => {
          const isActive = filter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setFilter(tab.id as any)}
              className={`flex-1 pb-3 items-center ${isActive ? 'border-b-2 border-[#FF7A2F]' : ''}`}
            >
              <Text className={`text-[15px] ${isActive ? 'font-extrabold text-[#1E293B]' : 'font-semibold text-[#8C7A6B]'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista de Cards de Vagas */}
      <ScrollView 
        className="flex-1 px-6 pt-3"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF7A2F" />}
      >
        {/* Aviso de Rascunho se existir */}
        {hasDraft && (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateJob')}
            className="bg-[#FFF4ED] border border-[#FF7A2F]/40 rounded-3xl p-4 mb-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-11 h-11 rounded-2xl bg-[#FF7A2F] items-center justify-center mr-3.5">
                <Briefcase color="#fff" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-[#FF7A2F] font-bold text-[15px]">Rascunho em andamento</Text>
                <Text className="text-[#8C7A6B] text-xs mt-0.5">Toque para continuar o preenchimento</Text>
              </View>
            </View>
            <ChevronRight color="#FF7A2F" size={20} />
          </TouchableOpacity>
        )}

        {/* Exibição se não houver vagas naquele filtro */}
        {filteredJobs.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 border border-slate-100 items-center mt-6 shadow-sm">
            <View className="w-16 h-16 bg-[#FFF4ED] rounded-full items-center justify-center mb-4">
              <Briefcase color="#FF7A2F" size={28} />
            </View>
            <Text className="text-[#1E293B] font-bold text-base mb-2">
              {jobs.length === 0 ? 'Nenhuma vaga publicada ainda' : 'Nenhuma vaga neste status'}
            </Text>
            <Text className="text-[#8C7A6B] text-sm text-center mb-5 leading-relaxed">
              {jobs.length === 0 
                ? 'Crie sua primeira vaga no botão acima para encontrar profissionais freelancers rapidamente.'
                : 'Selecione outra aba acima para conferir suas outras vagas.'}
            </Text>
            {jobs.length === 0 && (
              <Button 
                title="Criar Nova Vaga" 
                onPress={() => navigation.navigate('CreateJob')} 
              />
            )}
          </View>
        ) : (
          filteredJobs.map((job) => {
            const jobDetails = getCategoryIconAndColors(job.categoryLabel || job.profession || job.title);
            const count = typeof job.proposalsCount === 'number' ? job.proposalsCount : 0;
            
            // Cor e texto da badge de status
            let badgeBg = '#DCFCE7';
            let badgeColor = '#15803D';
            let badgeText = 'Ativa';

            const statusLower = (job.status || 'Ativa').toLowerCase();
            if (statusLower.includes('análise') || statusLower.includes('analise')) {
              badgeBg = '#FEF3C7';
              badgeColor = '#D97706';
              badgeText = 'Em análise';
            } else if (statusLower.includes('andamento') || statusLower === 'in_progress') {
              badgeBg = '#E0F2FE';
              badgeColor = '#0369A1';
              badgeText = 'Em Andamento';
            } else if (statusLower.includes('conclu') || statusLower.includes('finaliz') || statusLower === 'completed') {
              badgeBg = '#F1F5F9';
              badgeColor = '#475569';
              badgeText = 'Finalizada';
            } else if (statusLower.includes('pausada')) {
              badgeBg = '#FEE2E2';
              badgeColor = '#B91C1C';
              badgeText = 'Pausada';
            }

            return (
              <TouchableOpacity 
                key={job.id}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('JobProposals', { job })}
                className="bg-white rounded-3xl p-5 mb-3.5 shadow-sm border border-slate-100"
              >
                {/* Linha Principal: Ícone da Categoria + Título/Subtítulo + Valor em R$ */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1 pr-3">
                    {/* Ícone oficial da CATEGORIA com arte 3D ou vetor colorido */}
                    <View 
                      className="rounded-2xl items-center justify-center mr-3.5 overflow-hidden"
                      style={{ width: 50, height: 50, backgroundColor: jobDetails.bgColor || '#FFF4ED' }}
                    >
                      <CategoryIcon 
                        category={job.categoryLabel || job.category || job.profession} 
                        profession={job.profession || job.title} 
                        color={jobDetails.color} 
                        size={24} 
                        strokeWidth={2.4} 
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-[#1E293B] font-extrabold text-[16px] leading-snug" numberOfLines={1}>
                        {job.title}
                      </Text>
                      <View className="flex-row items-center mt-0.5">
                        <Text className="text-[#64748B] text-xs font-semibold">
                          {job.profession && job.profession !== job.title 
                            ? job.profession 
                            : (job.categoryLabel || jobDetails.label || 'Serviço')}
                        </Text>
                        <Text className="text-[#CBD5E1] text-xs mx-1.5">•</Text>
                        <Text className="text-[#94A3B8] text-[11px] font-medium">
                          {formatPostedDate(job.createdAt || job.date)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Valor da vaga */}
                  <Text className="text-[#F97316] font-extrabold text-base">
                    R$ {job.paymentValue || '0,00'}
                  </Text>
                </View>

                {/* Linha Inferior: Badge de Status + Propostas Recebidas Reais */}
                <View className="flex-row items-center pt-2.5 border-t border-slate-100 justify-between">
                  <View 
                    className="px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: badgeBg }}
                  >
                    <Text className="text-[11px] font-bold uppercase tracking-wider" style={{ color: badgeColor }}>
                      {badgeText}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    {count > 0 ? (
                      <View className="flex-row items-center">
                        <Users color="#FF7A2F" size={14} strokeWidth={2.4} style={{ marginRight: 5 }} />
                        <Text className="text-[#FF7A2F] font-bold text-xs">
                          {count === 1 ? '1 proposta recebida' : `${count} propostas recebidas`}
                        </Text>
                        <ChevronRight color="#FF7A2F" size={13} strokeWidth={2.8} style={{ marginLeft: 3 }} />
                      </View>
                    ) : (
                      <View className="flex-row items-center">
                        <Text className="text-[#FF7A2F] font-bold text-xs">
                          Aguardando propostas
                        </Text>
                        <ChevronRight color="#CBD5E1" size={13} strokeWidth={2.4} style={{ marginLeft: 3 }} />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
