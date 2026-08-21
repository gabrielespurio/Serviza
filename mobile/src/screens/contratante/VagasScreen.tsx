import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Briefcase, 
  Plus, 
  ChevronRight, 
  Users, 
  Mail, 
  Sparkles, 
  Paintbrush, 
  Wrench, 
  TreeDeciduous, 
  Zap, 
  Droplets, 
  CalendarDays, 
  Hammer, 
  Truck, 
  Heart, 
  Scissors, 
  Car, 
  Dog, 
  Cog, 
  Sprout, 
  Megaphone, 
  Package, 
  Monitor, 
  FileText 
} from '../../components/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import { JOB_CATEGORIES } from '../../data/jobCategories';
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
  status: 'Ativa' | 'Concluída' | 'Pausada' | 'Rascunho' | 'Em análise' | 'Em Andamento' | string;
  proposalsCount?: number;
  createdAt?: string;
}

// Mapeamento de ícones e cores por categoria/profissão para os cards
// Mapeamento de ícones e cores por categoria/profissão usando o serviço centralizado
const getCategoryAppearance = (categoryLabel?: string, profession?: string) => {
  return getCategoryIconAndColors(`${profession || ''} ${categoryLabel || ''}`);
};

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
            paymentValue: item.price ? item.price.toFixed(2).replace('.', ',') : item.paymentValue || '0,00',
            proposalsCount: item.applications ? item.applications.length : (item.proposalsCount !== undefined ? item.proposalsCount : 0),
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

        // Carregar propostas globais e pessoais para contar exatamente quantas propostas reais cada vaga tem
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
          
          // Contagem 100% real: ou achou propostas no storage/combinado, ou veio da API em applications. NUNCA usar números aleatórios antigos!
          const realCount = matchingProps.length > 0 
            ? matchingProps.length 
            : (j.applications && Array.isArray(j.applications) ? j.applications.length : 0);

          return {
            ...j,
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
    if (filter === 'ativas') {
      return job.status === 'Ativa' || job.status === 'OPEN' || job.status === 'Ativo' || !job.status;
    }
    if (filter === 'em_andamento') {
      return job.status === 'Em Andamento' || job.status === 'IN_PROGRESS' || job.status === 'Em análise' || job.status === 'Pausada';
    }
    if (filter === 'finalizadas') {
      return job.status === 'Finalizada' || job.status === 'Concluída' || job.status === 'COMPLETED' || job.status === 'CANCELLED';
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
            const appearance = getCategoryAppearance(job.categoryLabel || job.category, job.profession || job.title);
            const IconComponent = appearance.icon;
            const isAnalyzing = job.status === 'Em análise' || (job.proposalsCount && job.proposalsCount === 0);
            
            // Cor e texto da badge de status
            let badgeBg = '#DCFCE7';
            let badgeColor = '#15803D';
            let badgeText = 'Ativa';

            if (job.status === 'Em análise') {
              badgeBg = '#FEF3C7';
              badgeColor = '#D97706';
              badgeText = 'Em análise';
            } else if (job.status === 'Em Andamento' || job.status === 'IN_PROGRESS') {
              badgeBg = '#E0F2FE';
              badgeColor = '#0369A1';
              badgeText = 'Em Andamento';
            } else if (job.status === 'Concluída' || job.status === 'Finalizada') {
              badgeBg = '#F1F5F9';
              badgeColor = '#475569';
              badgeText = 'Finalizada';
            }

            return (
              <TouchableOpacity 
                key={job.id}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('JobProposals', { job })}
                className="bg-white rounded-[28px] p-5 mb-4 shadow-sm border border-slate-100/90"
              >
                {/* Top Section — Ícone + Título + Badge */}
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-row items-center flex-1 pr-3">
                    {/* Caixa do ícone colorida com cantos arredondados */}
                    <View 
                      className="w-14 h-14 rounded-2xl items-center justify-center mr-3.5"
                      style={{ backgroundColor: appearance.bgColor }}
                    >
                      <IconComponent color={appearance.color} size={24} strokeWidth={2.2} />
                    </View>

                    {/* Título e Data Postado */}
                    <View className="flex-1">
                      <Text className="text-[17px] font-extrabold text-[#1E293B] mb-0.5 leading-snug" numberOfLines={1}>
                        {job.title}
                      </Text>
                      <Text className="text-[13px] text-[#8C7A6B] font-medium">
                        {formatPostedDate(job.createdAt || job.date)}
                      </Text>
                    </View>
                  </View>

                  {/* Badge de Status */}
                  <View 
                    className="px-3.5 py-1 rounded-full"
                    style={{ backgroundColor: badgeBg }}
                  >
                    <Text className="text-[12px] font-bold" style={{ color: badgeColor }}>
                      {badgeText}
                    </Text>
                  </View>
                </View>

                {/* Bottom Section — Propostas e Seta */}
                <View className="flex-row items-center justify-between pt-4 border-t border-slate-100/70">
                  <View className="flex-row items-center">
                    {job.status === 'Em análise' ? (
                      <Mail color="#8C7A6B" size={17} strokeWidth={2.2} className="mr-2" />
                    ) : (
                      <Users color="#FF7A2F" size={18} strokeWidth={2.4} className="mr-2" />
                    )}
                    <Text 
                      className={`text-[14px] font-bold ${
                        job.status === 'Em análise' ? 'text-[#8C7A6B] font-semibold' : 'text-[#FF7A2F]'
                      }`}
                    >
                      {job.status === 'Em análise'
                        ? 'Você está analisando propostas'
                        : `${job.proposalsCount || 1} propostas recebidas`}
                    </Text>
                  </View>

                  <ChevronRight color="#CBD5E1" size={18} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
