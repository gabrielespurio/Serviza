import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  MapPin, 
  ChevronRight, 
  Sparkles, 
  Briefcase, 
  Clock, 
  Wrench, 
  Paintbrush, 
  Zap, 
  CalendarDays,
  Truck,
  BookOpen,
  X,
  MessageSquare,
  CheckCircle2
} from '../../components/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JOB_CATEGORIES } from '../../data/jobCategories';
import { api } from '../../services/api';
import { CategoryIcon, getCategoryIconAndColors } from '../../components/CategoryIcon';

export default function HomePrestador({ navigation }: any) {
  const [userData, setUserData] = useState({
    name: 'Prestador',
    email: '',
    avatarUrl: null as string | null,
    skills: [] as string[],
    city: 'São Paulo, SP'
  });

  const [topJobs, setTopJobs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const loadNotifications = async () => {
    try {
      const raw = await AsyncStorage.getItem('@ContrataAI:notifications');
      if (raw) {
        setNotifications(JSON.parse(raw));
      }
    } catch (e) {}
  };

  const fetchPrestadorDataAndJobs = useCallback(async () => {
    try {
      setRefreshing(true);

      // 1. Carregar dados REAIS do prestador salvo localmente no AsyncStorage
      const savedUserRaw = await AsyncStorage.getItem('@ContrataAI:userData');
      const savedAvatar = await AsyncStorage.getItem('@ContrataAI:avatarUrl');
      
      let currentUser = { ...userData };
      if (savedUserRaw) {
        const parsed = JSON.parse(savedUserRaw);
        const nameClean = parsed.name ? (parsed.name.includes('@') ? parsed.name.split('@')[0] : parsed.name) : 'Prestador';
        currentUser = {
          name: nameClean,
          email: parsed.email || '',
          avatarUrl: savedAvatar || parsed.avatarUrl || null,
          skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 
            ? parsed.skills 
            : (parsed.subcategory ? [parsed.subcategory] : []),
          city: parsed.city || 'São Paulo, SP'
        };
        setUserData(currentUser);
      }

      // 2. Tentar sincronizar via API em segundo plano sem bloquear a interface (timeout 1.5s)
      api.get('/users/profile', { timeout: 1500 }).then(async (profileRes) => {
        if (profileRes.data) {
          const nameClean = profileRes.data.name ? (profileRes.data.name.includes('@') ? profileRes.data.name.split('@')[0] : profileRes.data.name) : currentUser.name;
          const updatedUser = {
            ...currentUser,
            name: nameClean,
            email: profileRes.data.email || currentUser.email,
            avatarUrl: profileRes.data.avatarUrl || currentUser.avatarUrl,
            skills: profileRes.data.prestador?.skills?.length 
              ? profileRes.data.prestador.skills 
              : (profileRes.data.skills?.length ? profileRes.data.skills : currentUser.skills)
          };
          setUserData(updatedUser);
          await AsyncStorage.setItem('@ContrataAI:userData', JSON.stringify({
            ...updatedUser,
            role: 'PRESTADOR'
          }));
        }
      }).catch(() => {});

      // 3. Carregar SOMENTE Vagas REAIS do Sistema (API e @ContrataAI:myJobs)
      let apiJobs: any[] = [];
      try {
        const res = await api.get('/jobs', { timeout: 2000 });
        if (Array.isArray(res.data)) {
          apiJobs = res.data.map((j: any) => ({
            id: j.id,
            title: j.title || 'Serviço Presencial',
            categoryLabel: j.category || j.profession || 'Serviço',
            location: j.location || currentUser.city || 'São Paulo - SP',
            price: j.price || 150,
            priceLabel: `R$ ${j.price || 150}`,
            timeAgo: 'Hoje',
            iconType: 'wrench',
            iconBg: '#FFF4ED',
            iconColor: '#FF7A2F',
            description: j.description || 'Atendimento presencial solicitado pelo contratante.',
            clientName: j.clientName || 'Contratante Verificado',
            clientRating: 5.0,
            clientJobsCount: 1
          }));
        }
      } catch (e) {}

      const rawLocalJobs = await AsyncStorage.getItem('@ContrataAI:myJobs');
      const localJobs = rawLocalJobs ? JSON.parse(rawLocalJobs) : [];

      const formattedLocal = localJobs.map((j: any) => ({
        id: j.id,
        title: j.title || 'Serviço Solicitado',
        categoryLabel: j.categoryLabel || j.profession || 'Serviço Presencial',
        location: j.location || currentUser.city || 'São Paulo - SP',
        price: j.paymentValue ? parseFloat(j.paymentValue) || 200 : 200,
        priceLabel: j.paymentValue ? `R$ ${j.paymentValue}` : 'A combinar',
        timeAgo: 'Hoje',
        iconType: 'wrench',
        iconBg: '#FFF4ED',
        iconColor: '#FF7A2F',
        description: j.description || `Demanda presencial para ${j.profession || 'atendimento rápido'}.`,
        clientName: 'Contratante Serviza',
        clientRating: 5.0,
        clientJobsCount: 1
      }));

      const combinedJobs = [...formattedLocal];
      apiJobs.forEach(aj => {
        if (!combinedJobs.some((cj: any) => cj.id === aj.id || cj.title === aj.title)) {
          combinedJobs.push(aj);
        }
      });

      setTopJobs(combinedJobs);
    } catch (e) {
      console.log('Erro ao carregar dados do prestador', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrestadorDataAndJobs();
    if (!navigation || typeof navigation.addListener !== 'function') return;
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPrestadorDataAndJobs();
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        try { unsubscribe(); } catch (e) {}
      }
    };
  }, [navigation, fetchPrestadorDataAndJobs]);

  const primarySkill = userData.skills && userData.skills[0] 
    ? userData.skills[0] 
    : 'Serviços Presenciais';

  const firstName = userData.name.split(' ')[0];
  const initialLetter = firstName.charAt(0).toUpperCase();
  const isStockOrDummyAvatar = !userData.avatarUrl || userData.avatarUrl.includes('unsplash.com') || userData.avatarUrl.includes('dummy');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <ScrollView
        className="flex-1 px-6 pt-3"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchPrestadorDataAndJobs} tintColor="#FF7A2F" />}
      >
        {/* Top Header — Avatar Real + Saudação Real + Notificações */}
        <View className="flex-row items-center justify-between mb-6 pt-1">
          <View className="flex-row items-center flex-1 pr-3">
            <View className="mr-3 relative">
              {!isStockOrDummyAvatar ? (
                <Image
                  source={{ uri: userData.avatarUrl }}
                  className="w-13 h-13 rounded-full bg-slate-200 border-2 border-white shadow-xs"
                  style={{ width: 52, height: 52, borderRadius: 26 }}
                />
              ) : (
                <View className="w-13 h-13 rounded-full bg-[#FF7A2F] items-center justify-center border-2 border-white shadow-xs" style={{ width: 52, height: 52, borderRadius: 26 }}>
                  <Text className="text-white font-black text-xl">{initialLetter}</Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#16A34A] border-2 border-white" />
            </View>

            <View>
              <Text className="text-xs text-[#64748B] font-semibold">Olá,</Text>
              <Text className="text-[22px] font-extrabold text-[#1E293B] leading-tight capitalize" numberOfLines={1}>
                {firstName}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              loadNotifications();
              setNotificationsModalVisible(true);
            }}
            className="w-11 h-11 rounded-full bg-white border border-slate-200/90 items-center justify-center shadow-2xs relative"
          >
            <Bell color="#1E293B" size={20} />
            <View className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#FF7A2F] border-2 border-white" />
          </TouchableOpacity>
        </View>

        {/* Banner Hero — PRÓXIMO SERVIÇO / ATUAÇÃO REAL */}
        <View 
          className="rounded-[30px] overflow-hidden mb-7 shadow-md"
          style={{
            ...Platform.select({
              ios: { shadowColor: '#FF7A2F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 14 },
              android: { elevation: 6 }
            })
          }}
        >
          <LinearGradient
            colors={['#FF8A4C', '#FF6B1A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 22 }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[11px] font-bold text-white/90 uppercase tracking-widest">
                PRÓXIMO SERVIÇO / ATUAÇÃO
              </Text>
              <View className="w-11 h-11 rounded-2xl bg-white/20 items-center justify-center">
                <Sparkles color="#FFFFFF" size={22} />
              </View>
            </View>

            <Text className="text-[24px] font-extrabold text-white mb-5 leading-tight">
              {primarySkill}
            </Text>

            <View className="flex-row items-center justify-between pt-1">
              <View className="bg-white/25 px-4 py-2 rounded-full flex-row items-center">
                <Clock color="#FFFFFF" size={15} className="mr-1.5" />
                <Text className="text-white font-bold text-xs">Ativo na Plataforma</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Busca', { category: 'todos' })}
                className="flex-row items-center"
              >
                <Text className="text-white font-extrabold text-[14px] mr-1">Ver vagas</Text>
                <ChevronRight color="#FFFFFF" size={18} strokeWidth={2.8} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Categorias Section (Lista Real de Categorias da Plataforma) */}
        <View className="mb-7">
          <Text className="text-[19px] font-extrabold text-[#1E293B] mb-4">
            Categorias
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14 }}
          >
            {JOB_CATEGORIES.slice(0, 8).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Busca', { category: cat.id })}
                className="items-center w-20"
              >
                <View 
                  className="w-16 h-16 rounded-full items-center justify-center mb-1.5 border border-orange-100/80 shadow-2xs"
                  style={{ backgroundColor: cat.bgColor || '#FFF4ED' }}
                >
                  <CategoryIcon category={cat.id} color={cat.color || '#FF7A2F'} size={24} />
                </View>
                <Text className="text-[12px] font-bold text-[#64748B] text-center" numberOfLines={1}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Top Vagas Section (Apenas Demandas Reais do Sistema) */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[19px] font-extrabold text-[#1E293B]">
            Top Vagas Reais
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Busca', { category: 'todos' })}>
            <Text className="text-sm font-extrabold text-[#FF7A2F]">
              Ver todas ({topJobs.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View>
          {topJobs.length === 0 ? (
            <View className="bg-white rounded-3xl p-8 border border-slate-100 items-center justify-center my-2">
              <Briefcase color="#CBD5E1" size={42} strokeWidth={1.5} className="mb-3" />
              <Text className="text-base font-extrabold text-[#334155] text-center mb-1">
                Nenhuma vaga publicada no momento
              </Text>
              <Text className="text-xs text-[#64748B] text-center">
                Assim que um contratante publicar uma demanda real de serviço presencial, ela aparecerá aqui instantaneamente.
              </Text>
            </View>
          ) : (
            topJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('JobDetails', { job })}
                className="bg-white rounded-[26px] p-4 mb-3.5 border border-slate-100/90 shadow-sm flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 pr-2">
                  <View 
                    className="w-14 h-14 rounded-2xl items-center justify-center mr-3.5"
                    style={{ backgroundColor: job.iconBg || getCategoryIconAndColors(job.categoryLabel || job.title).bgColor }}
                  >
                    <CategoryIcon category={job.categoryLabel || job.categoryId} profession={job.profession || job.title} color={job.iconColor || getCategoryIconAndColors(job.categoryLabel || job.title).color} size={24} />
                  </View>

                  <View className="flex-1">
                    <Text className="text-[16px] font-extrabold text-[#1E293B] mb-1" numberOfLines={1}>
                      {job.title}
                    </Text>
                    <View className="flex-row items-center flex-wrap gap-1">
                      <MapPin color="#64748B" size={13} />
                      <Text className="text-xs font-semibold text-[#64748B] mr-1">{job.location}</Text>
                      <Text className="text-xs font-bold text-[#CBD5E1]">•</Text>
                      <Text className="text-xs font-extrabold text-[#16A34A] ml-1">{job.priceLabel}</Text>
                    </View>
                  </View>
                </View>

                <View className="items-end">
                  <View className="bg-slate-100 px-2.5 py-1 rounded-full mb-1">
                    <Text className="text-[11px] font-bold text-[#64748B]">{job.timeAgo}</Text>
                  </View>
                  <ChevronRight color="#CBD5E1" size={18} strokeWidth={2.4} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal / Bottom Sheet de Notificações do Prestador */}
      <Modal
        visible={notificationsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
          <View className="flex-row items-center justify-between px-6 pt-4 pb-4 bg-white border-b border-slate-100">
            <View>
              <Text className="text-xs font-bold text-[#FF7A2F] uppercase tracking-wider">
                Atualizações
              </Text>
              <Text className="text-xl font-extrabold text-[#1E293B]">
                Suas Notificações
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setNotificationsModalVisible(false)}
              className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
            >
              <X color="#64748B" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {notifications && notifications.length > 0 ? (
              notifications.map((notif, idx) => {
                const isAccepted = notif.type === 'PROPOSAL_ACCEPTED';
                const isNegotiating = notif.type === 'PROPOSAL_NEGOTIATING';
                const isRejected = notif.type === 'PROPOSAL_REJECTED';

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={isAccepted || isNegotiating ? 0.8 : 1}
                    onPress={() => {
                      if (isAccepted || isNegotiating) {
                        setNotificationsModalVisible(false);
                        navigation.navigate('ChatScreen', {
                          recipientId: notif.proposalId || notif.recipientId || 'default',
                          recipientName: notif.contratanteName || 'Gabriel Contratante',
                          recipientAvatar: notif.contratanteAvatar || null,
                          jobId: notif.jobId || 'job-atual',
                          jobTitle: notif.jobTitle || 'Serviço',
                          proposalPrice: notif.proposalPrice || 30,
                          proposalId: notif.proposalId,
                          status: isAccepted ? 'ACCEPTED' : 'NEGOTIATING'
                        });
                      }
                    }}
                    className={`p-4 rounded-3xl mb-3 border ${
                      isAccepted
                        ? 'bg-[#F0FDF4] border-[#86EFAC]'
                        : isNegotiating
                        ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                        : 'bg-white border-slate-100 shadow-2xs'
                    }`}
                  >
                    <View className="flex-row items-start gap-3.5">
                      <View className={`w-11 h-11 rounded-2xl items-center justify-center ${
                        isAccepted
                          ? 'bg-[#22C55E]'
                          : isNegotiating
                          ? 'bg-[#3B82F6]'
                          : 'bg-slate-100'
                      }`}>
                        {isAccepted && <CheckCircle2 color="#FFFFFF" size={20} />}
                        {isNegotiating && <MessageSquare color="#FFFFFF" size={18} />}
                        {isRejected && <X color="#64748B" size={18} />}
                        {!isAccepted && !isNegotiating && !isRejected && <Bell color="#64748B" size={18} />}
                      </View>

                      <View className="flex-1">
                        <View className="flex-row justify-between items-center mb-1">
                          <Text className="text-sm font-extrabold text-[#1E293B] flex-1 mr-2">
                            {notif.title}
                          </Text>
                          <Text className="text-[10px] text-[#94A3B8] font-medium">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>

                        <Text className="text-xs text-[#475569] leading-relaxed font-normal">
                          {notif.message}
                        </Text>

                        {(isAccepted || isNegotiating) && (
                          <View className="flex-row items-center mt-2.5 bg-white/80 px-3 py-1.5 rounded-xl self-start border border-slate-200/50">
                            <MessageSquare color={isAccepted ? '#16A34A' : '#2563EB'} size={14} className="mr-1.5" />
                            <Text className={`text-xs font-bold ${isAccepted ? 'text-[#16A34A]' : 'text-[#2563EB]'}`}>
                              Entrar no chat agora
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View className="items-center justify-center py-20">
                <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
                  <Bell color="#94A3B8" size={28} />
                </View>
                <Text className="text-base font-extrabold text-[#1E293B] mb-1">
                  Sem notificações recentes
                </Text>
                <Text className="text-xs text-[#64748B] text-center max-w-[260px] leading-relaxed">
                  Quando um contratante aceitar, negociar ou analisar suas propostas, você receberá avisos aqui.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
