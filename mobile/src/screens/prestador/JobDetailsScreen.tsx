import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image, Platform, StatusBar } from 'react-native';
import { ArrowLeft, MapPin, DollarSign, Clock, ShieldCheck, CheckCircle2, Send, X, Star, Briefcase, Award, Heart, Share2, ArrowRight, User, Calendar, Navigation, Users } from '../../components/icons';
import Bookmark from 'lucide-react-native/dist/esm/icons/bookmark.mjs';
import MapView, { Marker, Circle } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryIcon, getCategoryIconAndColors } from '../../components/CategoryIcon';
import { api } from '../../services/api';
import { getProviderLevelDetailsByServices } from '../../services/providerLevels';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDateShort(dateString: string | null): string {
  if (!dateString) return 'Data não definida';
  let date: Date;
  try {
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else {
      const [y, m, d] = dateString.split('-').map(Number);
      date = new Date(y, m - 1, d);
    }
    const weekday = WEEKDAYS[date.getDay()];
    const month = MONTHS[date.getMonth()];
    return `${weekday}, ${date.getDate()} ${month}`;
  } catch(e) {
    return 'Data inválida';
  }
}

function formatTimeShort(isoString: string | null): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}h${m !== '00' ? m : ''}`;
  } catch(e) {
    return '';
  }
}

function getJobTimeRange(job: any): string {
  if (job.selectedDates && job.selectedDates.length > 1) {
    return 'Vários horários';
  }
  
  if (job.scheduleType === 'same' && job.startTime && job.endTime) {
    return `${formatTimeShort(job.startTime)} - ${formatTimeShort(job.endTime)}`;
  }
  
  if (job.selectedDates && job.selectedDates.length === 1) {
    const dKey = job.selectedDates[0];
    const sched = job.dateSchedules?.[dKey];
    if (sched && sched.startTime && sched.endTime) {
      return `${formatTimeShort(sched.startTime)} - ${formatTimeShort(sched.endTime)}`;
    }
    if (job.startTime && job.endTime) {
      return `${formatTimeShort(job.startTime)} - ${formatTimeShort(job.endTime)}`;
    }
  }
  
  if (job.startTime && job.endTime) {
    return `${formatTimeShort(job.startTime)} - ${formatTimeShort(job.endTime)}`;
  }
  return 'Horário a combinar';
}

export default function JobDetailsScreen({ route, navigation }: any) {
  const job = route?.params?.job || {
    id: 'job-1',
    title: 'Eletricista Residencial',
    categoryLabel: 'Elétrica',
    location: 'Centro, São Paulo - SP',
    price: 150,
    priceLabel: 'R$ 150/h',
    timeAgo: 'Há 2h',
    description: 'Necessito de um profissional experiente para realizar reparos na fiação elétrica da sala e cozinha. O disjuntor tem desarmado com frequência ao ligar o chuveiro.\n\nÉ necessário trazer ferramentas próprias. O material de reposição (fios e disjuntores novos) já foi comprado e está no local.',
    date: new Date().toISOString(),
    clientName: 'Ricardo Mendes',
    clientRating: 4.9,
    clientJobsCount: 24
  };

  const [isFavorite, setIsFavorite] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalPrice, setProposalPrice] = useState(job.price ? job.price.toString() : '150');
  const [proposalMessage, setProposalMessage] = useState('Olá! Sou especialista na área com ampla experiência e tenho total disponibilidade para realizar esse serviço com excelência, pontualidade e segurança.');
  const [isSending, setIsSending] = useState(false);
  const [existingProposal, setExistingProposal] = useState<any>(null);

  React.useEffect(() => {
    const checkProposal = async () => {
      try {
        const rawMyProps = await AsyncStorage.getItem('@ContrataAI:myProposals');
        if (rawMyProps) {
          const myPropsList = JSON.parse(rawMyProps);
          const found = myPropsList.find((p: any) => p.jobId === job.id);
          if (found && found.status !== 'REJECTED' && found.status !== 'CANCELLED') {
            setExistingProposal(found);
          }
        }
      } catch (e) {}
    };
    checkProposal();
  }, [job.id]);

  // Selecionar imagem de capa de alta resolução com base na categoria ou título do serviço presencial
  const getCoverImage = () => {
    const text = `${job.title} ${job.categoryLabel || ''}`.toLowerCase();
    if (text.includes('elétric') || text.includes('fiação') || text.includes('disjuntor')) {
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80';
    }
    if (text.includes('pint') || text.includes('reforma') || text.includes('pedreiro')) {
      return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80';
    }
    if (text.includes('limpez') || text.includes('faxina') || text.includes('diarista')) {
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80';
    }
    if (text.includes('monta') || text.includes('móve') || text.includes('marcen')) {
      return 'https://images.unsplash.com/photo-1540518614846-7ede433c1347?w=800&auto=format&fit=crop&q=80';
    }
    if (text.includes('evento') || text.includes('garçom') || text.includes('churras')) {
      return 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80';
    }
    if (text.includes('frete') || text.includes('mudanç') || text.includes('transpor')) {
      return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80';
  };

  const handlePriceChange = (text: string) => {
    // Remove qualquer caractere que não seja número, vírgula ou ponto
    const cleaned = text.replace(/[^0-9.,]/g, '');
    setProposalPrice(cleaned);
  };

  const handleCancelProposal = () => {
    Alert.alert(
      'Cancelar Candidatura',
      'Tem certeza que deseja cancelar sua proposta para esta vaga?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const rawMyProps = await AsyncStorage.getItem('@ContrataAI:myProposals');
              if (rawMyProps) {
                const list = JSON.parse(rawMyProps);
                const updated = list.filter((p: any) => p.jobId !== job.id);
                await AsyncStorage.setItem('@ContrataAI:myProposals', JSON.stringify(updated));
              }

              const rawAllProps = await AsyncStorage.getItem('@ContrataAI:allProposals');
              if (rawAllProps && existingProposal) {
                const list = JSON.parse(rawAllProps);
                const updated = list.filter((p: any) => p.id !== existingProposal.id);
                await AsyncStorage.setItem('@ContrataAI:allProposals', JSON.stringify(updated));
              }

              setExistingProposal(null);
              Alert.alert('✅ Cancelada', 'Sua proposta foi removida.');
            } catch (e) {}
          }
        }
      ]
    );
  };

  const handleSendProposal = async () => {
    if (!proposalPrice.trim()) {
      Alert.alert('Atenção', 'Informe o valor cobrado pela sua proposta.');
      return;
    }
    
    // Validação estrita do preço digitado
    const parsedStr = proposalPrice.replace('R$', '').replace(',', '.').trim();
    const numericPrice = parseFloat(parsedStr);

    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('Valor Inválido', 'Por favor, informe um valor numérico válido e maior que zero para sua proposta.');
      return;
    }

    setIsSending(true);
    setTimeout(async () => {
      setIsSending(false);
      setShowProposalModal(false);

      try {
        // Obter dados reais do Prestador do perfil
        const rawProfile = await AsyncStorage.getItem('@ContrataAI:userProfile');
        const rawUserData = await AsyncStorage.getItem('@ContrataAI:userData');
        const profile = rawProfile ? JSON.parse(rawProfile) : {};
        const user = rawUserData ? JSON.parse(rawUserData) : {};

        const completedCount = profile.completedServicesCount || profile.completedServices || profile.completedJobs || user.completedJobs || 1;
        const levelConfig = getProviderLevelDetailsByServices(completedCount);
        const providerName = profile.name || user.name || 'Roberto Silva';
        const providerAvatar = profile.profileImage || profile.avatarUrl || user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

        const newProposal = {
          id: `prop-${Date.now()}`,
          jobId: job.id,
          jobTitle: job.title,
          jobCategory: job.categoryLabel || job.category || '',
          jobProfession: job.profession || job.title || '',
          providerId: profile.id || user.id || `prov-${Date.now()}`,
          providerName: providerName,
          avatarUrl: providerAvatar,
          level: levelConfig.label.toUpperCase(),
          rating: profile.rating || user.rating || 5.0,
          reviewsCount: profile.reviewsCount || user.reviewsCount || 4,
          price: numericPrice,
          priceLabel: `R$ ${numericPrice}`,
          verifiedBadge: 'check',
          message: proposalMessage.trim() || 'Olá! Tenho total disponibilidade e experiência para realizar este serviço com capricho e agilidade.',
          fullBio: profile.bio || user.bio || 'Profissional qualificado e verificado na plataforma Serviza.',
          skills: profile.skills || user.skills || [job.categoryLabel || job.profession || 'Especialista'],
          completedJobsCount: completedCount,
          status: 'Enviada',
          createdAt: new Date().toISOString()
        };

        // 1. Salvar no histórico de propostas do prestador (@ContrataAI:myProposals)
        const rawMyProps = await AsyncStorage.getItem('@ContrataAI:myProposals');
        const myPropsList = rawMyProps ? JSON.parse(rawMyProps) : [];
        myPropsList.push(newProposal);
        await AsyncStorage.setItem('@ContrataAI:myProposals', JSON.stringify(myPropsList));

        // 2. Salvar na lista global de propostas das vagas (@ContrataAI:allProposals) para o Contratante ver
        const rawAllProps = await AsyncStorage.getItem('@ContrataAI:allProposals');
        const allPropsList = rawAllProps ? JSON.parse(rawAllProps) : [];
        allPropsList.push(newProposal);
        await AsyncStorage.setItem('@ContrataAI:allProposals', JSON.stringify(allPropsList));

        // 3. Atualizar a vaga correspondente no storage do contratante (@ContrataAI:myJobs)
        const rawMyJobs = await AsyncStorage.getItem('@ContrataAI:myJobs');
        if (rawMyJobs) {
          const myJobsList = JSON.parse(rawMyJobs);
          const updatedMyJobs = myJobsList.map((j: any) => {
            if (j.id === job.id || (j.title === job.title && j.categoryLabel === job.categoryLabel)) {
              const existingApps = j.applications || [];
              const updatedApps = [newProposal, ...existingApps];
              return {
                ...j,
                applications: updatedApps,
                proposalsCount: updatedApps.length
              };
            }
            return j;
          });
          await AsyncStorage.setItem('@ContrataAI:myJobs', JSON.stringify(updatedMyJobs));
        }

        // 4. Atualizar também na lista geral de vagas (@ContrataAI:jobs)
        const rawAllJobs = await AsyncStorage.getItem('@ContrataAI:jobs');
        if (rawAllJobs) {
          const allJobsList = JSON.parse(rawAllJobs);
          const updatedAllJobs = allJobsList.map((j: any) => {
            if (j.id === job.id || (j.title === job.title && j.categoryLabel === job.categoryLabel)) {
              const existingApps = j.applications || [];
              const updatedApps = [newProposal, ...existingApps];
              return {
                ...j,
                applications: updatedApps,
                proposalsCount: updatedApps.length
              };
            }
            return j;
          });
          await AsyncStorage.setItem('@ContrataAI:jobs', JSON.stringify(updatedAllJobs));
        }

        // 5. Enviar para a API caso esteja rodando
        try {
          await api.post(`/jobs/${job.id}/applications`, newProposal);
        } catch (apiErr) {}

      } catch (e) {
        console.error('Erro ao salvar proposta real:', e);
      }

      Alert.alert(
        '🎉 Candidatura Enviada com Sucesso!',
        `Sua proposta de R$ ${proposalPrice} foi entregue para ${job.clientName || 'o contratante'}. O contratante já pode visualizá-la no painel dele.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 800);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ===== HEADER ===== */}
      <View 
        className="flex-row items-center justify-between px-5 bg-[#FAFAFA] z-30 pb-3"
        style={{ paddingTop: Platform.OS === 'ios' ? 52 : 44 }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-start justify-center"
        >
          <ArrowLeft color="#1E293B" size={24} strokeWidth={2.5} />
        </TouchableOpacity>

        <Text className="text-[17px] font-extrabold text-[#1E293B]">
          Detalhes da vaga
        </Text>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity activeOpacity={0.8} onPress={() => setIsFavorite(!isFavorite)}>
            <Bookmark 
              color={isFavorite ? '#EA580C' : '#1E293B'} 
              fill={isFavorite ? '#EA580C' : 'transparent'} 
              size={22} 
              strokeWidth={2.2} 
            />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => Alert.alert('Compartilhar', `Compartilhar a vaga de ${job.title}`)}>
            <Share2 color="#1E293B" size={22} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        
        {/* ===== TOP BANNER ===== */}
        <View className="mx-5 mt-2 bg-[#FFF6F0] rounded-[24px] p-5 shadow-sm border border-[#FFE5D3]">
          <View className="flex-row items-center justify-between mb-3">
            <View className="bg-[#FFE5D3] px-3 py-1 rounded-full">
              <Text className="text-[10px] font-extrabold text-[#EA580C] uppercase tracking-wider">
                {job.categoryLabel || job.profession || 'GERAL'}
              </Text>
            </View>
          </View>

          <Text className="text-[24px] font-extrabold text-[#1E293B] leading-[28px] mb-4 pr-4">
            {job.title}
          </Text>

          <View className="flex-row flex-wrap items-end justify-between border-t border-[#FFE5D3]/60 pt-4">
            <View>
              <Text className="text-[24px] font-extrabold text-[#EA580C]">
                {job.priceLabel || `R$ ${job.price || '150,00'}`}
              </Text>
              <Text className="text-[11px] font-semibold text-[#64748B] ml-0.5">Valor total</Text>
            </View>
            <View className="bg-[#DCFCE7] px-3 py-1.5 rounded-full flex-row items-center mt-2">
              <View className="w-2 h-2 rounded-full bg-[#16A34A] mr-1.5" />
              <Text className="text-[11px] font-bold text-[#16A34A]">Vaga disponível</Text>
            </View>
          </View>
        </View>

        {/* ===== 3 CARDS RESUMO ===== */}
        <View className="flex-row justify-between px-5 mt-5 gap-2.5">
          {/* Card Data */}
          <View className="bg-white rounded-[20px] p-3 flex-1 border border-slate-100 shadow-sm flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-[#FFF6F0] items-center justify-center mr-2">
              <Calendar color="#EA580C" size={18} strokeWidth={2.5} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-extrabold text-[#1E293B] mb-0.5" numberOfLines={1}>
                {job.selectedDates && job.selectedDates.length > 1 ? 'Múltiplos dias' : formatDateShort(job.selectedDates?.[0] || job.date)}
              </Text>
              <Text className="text-[10px] font-medium text-[#64748B]" numberOfLines={1}>
                {getJobTimeRange(job)}
              </Text>
            </View>
          </View>

          {/* Card Distância */}
          <View className="bg-white rounded-[20px] p-3 flex-1 border border-slate-100 shadow-sm flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-[#FFF6F0] items-center justify-center mr-2">
              <Navigation color="#EA580C" size={18} strokeWidth={2.5} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-extrabold text-[#1E293B] mb-0.5" numberOfLines={1}>2.5 km</Text>
              <Text className="text-[10px] font-medium text-[#64748B]" numberOfLines={1}>de você</Text>
            </View>
          </View>

          {/* Card Local */}
          <View className="bg-white rounded-[20px] p-3 flex-1 border border-slate-100 shadow-sm flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-[#FFF6F0] items-center justify-center mr-2">
              <MapPin color="#EA580C" size={18} strokeWidth={2.5} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-extrabold text-[#1E293B] leading-tight" numberOfLines={2}>
                {job.address?.cidade || 'São José do Rio Preto'}
              </Text>
            </View>
          </View>
        </View>

        {/* Lista Detalhada de Múltiplos Dias (Caso aplicável) */}
        {job.selectedDates && job.selectedDates.length > 1 && (
          <View className="px-5 mt-4">
            <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <Text className="text-[14px] font-extrabold text-[#1E293B] mb-2">Cronograma de Atendimento</Text>
              {job.selectedDates.map((dateKey: string, index: number) => {
                const sched = job.dateSchedules?.[dateKey];
                const timeStr = sched && sched.startTime && sched.endTime 
                  ? `${formatTimeShort(sched.startTime)} - ${formatTimeShort(sched.endTime)}` 
                  : (job.scheduleType === 'same' && job.startTime && job.endTime ? `${formatTimeShort(job.startTime)} - ${formatTimeShort(job.endTime)}` : 'Horário a combinar');
                
                return (
                  <View key={dateKey} className="flex-row items-center py-2 border-b border-slate-50 last:border-0">
                    <View className="w-1.5 h-1.5 rounded-full bg-[#EA580C] mr-2.5" />
                    <Text className="text-[13px] font-semibold text-[#334155] flex-1">
                      {formatDateShort(dateKey)}
                    </Text>
                    <Text className="text-[13px] font-bold text-[#EA580C]">
                      {timeStr}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ===== SOBRE O SERVIÇO ===== */}
        <View className="px-5 mt-8">
          <Text className="text-[18px] font-extrabold text-[#1E293B] mb-3">
            Sobre o serviço
          </Text>
          <Text className="text-[#475569] text-[15px] leading-relaxed mb-4">
            {job.description}
          </Text>

          {/* Galeria de Fotos (Se houver) */}
          {job.photos && job.photos.length > 0 && (
            <View className="mt-2 mb-4">
              <Text className="text-[14px] font-extrabold text-[#1E293B] mb-3">Fotos do local / referência</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
                {job.photos.map((photoUri: string, index: number) => (
                  <Image 
                    key={index} 
                    source={{ uri: photoUri }} 
                    className="w-28 h-28 rounded-2xl mr-3 bg-slate-200"
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ===== REQUISITOS ===== */}
        <View className="px-5 mt-6">
          <Text className="text-[18px] font-extrabold text-[#1E293B] mb-4">
            O que você precisa ter
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="bg-[#FFF6F0] px-4 py-2.5 rounded-full flex-row items-center">
              <Star color="#EA580C" fill="#EA580C" size={14} className="mr-2" />
              <Text className="text-[13px] font-bold text-[#1E293B]">Experiência na área</Text>
            </View>
            <View className="bg-[#FFF6F0] px-4 py-2.5 rounded-full flex-row items-center">
              <Clock color="#EA580C" size={14} className="mr-2" />
              <Text className="text-[13px] font-bold text-[#1E293B]">Pontualidade</Text>
            </View>
            <View className="bg-[#FFF6F0] px-4 py-2.5 rounded-full flex-row items-center">
              <Users color="#EA580C" size={14} className="mr-2" />
              <Text className="text-[13px] font-bold text-[#1E293B]">Atendimento presencial</Text>
            </View>
          </View>
        </View>

        {/* ===== LOCALIZAÇÃO ===== */}
        <View className="px-5 mt-8 mb-6">
          <Text className="text-[18px] font-extrabold text-[#1E293B] mb-4">
            Localização {job.hideExactLocationUntilHired !== false ? 'aproximada' : 'exata'}
          </Text>
          
          <View className="bg-[#E2E8F0] h-[160px] rounded-[24px] overflow-hidden relative border border-slate-200 items-center justify-center shadow-xs">
            {job.coordinates ? (
              <MapView
                style={{ width: '100%', height: '100%' }}
                initialRegion={{
                  latitude: job.coordinates.latitude,
                  longitude: job.coordinates.longitude,
                  latitudeDelta: job.hideExactLocationUntilHired !== false ? 0.015 : 0.005,
                  longitudeDelta: job.hideExactLocationUntilHired !== false ? 0.015 : 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                {job.hideExactLocationUntilHired !== false ? (
                  <Circle
                    center={job.coordinates}
                    radius={500}
                    fillColor="rgba(234, 88, 12, 0.2)"
                    strokeColor="rgba(234, 88, 12, 0.6)"
                    strokeWidth={2}
                  />
                ) : (
                  <Marker coordinate={job.coordinates}>
                    <View className="w-10 h-10 rounded-full bg-white shadow-md items-center justify-center">
                      <MapPin color="#EA580C" size={20} strokeWidth={2.6} fill="#EA580C" />
                    </View>
                  </Marker>
                )}
              </MapView>
            ) : (
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80' }}
                className="w-full h-full resize-cover opacity-80"
              />
            )}
            
            {/* Overlay if there's no coordinates or just as styling */}
            {!job.coordinates && (
              <View className="absolute inset-0 bg-white/40 items-center justify-center">
                <View className="w-12 h-12 rounded-full bg-white shadow-md items-center justify-center">
                  <MapPin color="#EA580C" size={24} strokeWidth={2.6} fill="#EA580C" />
                </View>
                <View className="bg-white/90 px-3 py-1 rounded-full mt-2 shadow-sm">
                  <Text className="text-[11px] font-bold text-[#1E293B]">{job.address?.cidade || 'São José do Rio Preto'}</Text>
                </View>
              </View>
            )}
          </View>

          <View className="flex-row items-center mt-3 ml-1">
            <View className="w-4 h-4 rounded-full bg-[#EA580C] items-center justify-center mr-2">
              <Text className="text-white text-[9px] font-extrabold">i</Text>
            </View>
            <Text className="text-[12px] font-medium text-[#64748B] flex-1">
              {job.hideExactLocationUntilHired !== false 
                ? '📍 A localização é nessa região. O endereço exato será revelado após a confirmação.' 
                : '📍 Endereço exato divulgado pelo contratante.'}
            </Text>
          </View>
        </View>

        {/* ===== PERFIL DO CONTRATANTE ===== */}
        <View className="px-5 mb-6">
          <View className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-3">
              <View className="w-12 h-12 rounded-full bg-[#FFF6F0] items-center justify-center mr-3 border border-[#FFE5D3]">
                <Text className="text-[#EA580C] font-extrabold text-lg">
                  {(job.clientName || 'Mariana S.')[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <View className="flex-row items-center">
                  <Text className="text-[15px] font-extrabold text-[#1E293B] mr-1.5">
                    {job.clientName || 'Mariana S.'}
                  </Text>
                  <View className="w-3.5 h-3.5 bg-blue-500 rounded-full items-center justify-center">
                    <CheckCircle2 color="#FFF" size={10} strokeWidth={3} />
                  </View>
                </View>
                <View className="flex-row items-center mt-0.5">
                  <Text className="text-[12px] font-extrabold text-[#1E293B] mr-1">
                    {job.clientRating || '4,9'}
                  </Text>
                  <Star color="#EA580C" fill="#EA580C" size={11} className="mr-1.5" />
                  <Text className="text-[12px] text-[#64748B] font-medium">
                    • {job.clientJobsCount || '12'} contratações
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={() => Alert.alert('Perfil Verificado', `O contratante ${job.clientName || 'Mariana S.'} possui identidade verificada na plataforma.`)}>
              <Text className="text-[13px] font-extrabold text-[#EA580C]">Ver perfil {'>'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ===== BARRA INFERIOR (FOOTER) ===== */}
      <View 
        className="px-6 py-4 bg-white border-t border-slate-100 flex-row items-center justify-between absolute bottom-0 left-0 right-0 z-30 shadow-2xl"
        style={{
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.04, shadowRadius: 12 },
            android: { elevation: 20 }
          })
        }}
      >
        <View className="flex-1">
          <Text className="text-[11px] font-semibold text-[#64748B] mb-0.5">Pagamento</Text>
          <Text className="text-[20px] font-extrabold text-[#1E293B]">
            {job.priceLabel || `R$ ${job.price || '150,00'}`}
          </Text>
        </View>

        {existingProposal ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleCancelProposal}
            className="bg-red-500 rounded-2xl px-6 py-4 flex-row items-center justify-center flex-[1.4] shadow-sm"
          >
            <Text className="text-white font-extrabold text-[15px] mr-2">Cancelar Proposta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setShowProposalModal(true)}
            className="bg-[#EA580C] rounded-2xl px-6 py-4 flex-row items-center justify-center flex-[1.4] shadow-sm"
          >
            <Text className="text-white font-extrabold text-[15px] mr-1.5">Quero me candidatar</Text>
            <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.8} />
          </TouchableOpacity>
        )}
      </View>

      {/* ========== MODAL DE ENVIO DE PROPOSTA ========== */}
      <Modal
        visible={showProposalModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProposalModal(false)}
      >
        <SafeAreaView className="flex-1 bg-[#FAFAFA]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-3 pb-4 bg-[#FAFAFA]">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowProposalModal(false)}
              className="w-10 h-10 items-start justify-center"
            >
              <ArrowLeft color="#1E293B" size={22} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text className="text-[18px] font-extrabold text-[#1E293B]">Enviar Proposta</Text>
            <View className="w-10" />
          </View>

          <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
            {/* Card VAGA SELECIONADA */}
            <View className="bg-white rounded-[26px] p-4 border border-slate-100/90 shadow-2xs flex-row items-center mb-6">
              <View className="w-14 h-14 rounded-2xl bg-[#F5EFE6] items-center justify-center mr-4">
                <Briefcase color="#A38E78" size={26} strokeWidth={2.2} />
              </View>
              <View className="flex-1 pr-1">
                <Text className="text-[10.5px] font-extrabold text-[#F59E0B] uppercase tracking-wider mb-0.5">
                  VAGA SELECIONADA
                </Text>
                <Text className="text-[17px] font-extrabold text-[#1E293B] mb-1" numberOfLines={1}>
                  {job.title}
                </Text>
                <View className="flex-row items-center">
                  <View className="w-3.5 h-3.5 rounded-full bg-[#F5EFE6] mr-1.5 items-center justify-center">
                    <User color="#A38E78" size={10} strokeWidth={2.6} />
                  </View>
                  <Text className="text-[13px] font-semibold text-[#8C7A6B]" numberOfLines={1}>
                    Cliente: {job.clientName || 'Contratante'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Valor da sua Proposta */}
            <Text className="text-[16px] font-extrabold text-[#1E293B] mb-3 ml-1">
              Valor da sua Proposta
            </Text>
            <View className="bg-white rounded-[26px] px-6 py-5 border border-slate-100/90 shadow-2xs flex-row items-center mb-6">
              <Text className="text-[26px] font-extrabold text-[#A38E78] mr-3">R$</Text>
              <TextInput
                value={proposalPrice}
                onChangeText={handlePriceChange}
                placeholder="500,00"
                keyboardType="numeric"
                placeholderTextColor="#D4C8BC"
                className="flex-1 text-[28px] font-extrabold text-[#1E293B] p-0"
              />
            </View>

            {/* Sua Proposta (Recado/Carta de Apresentação) */}
            <Text className="text-[16px] font-extrabold text-[#1E293B] mb-3 ml-1">
              Sua Proposta
            </Text>
            <View className="bg-white rounded-[26px] p-5 border border-slate-100/90 shadow-2xs min-h-[170px] mb-8">
              <TextInput
                value={proposalMessage}
                onChangeText={setProposalMessage}
                multiline
                numberOfLines={6}
                placeholder={`Olá ${job.clientName ? job.clientName.split(' ')[0] : 'Contratante'}, tenho ampla experiência e total disponibilidade para realizar esse serviço com excelência...`}
                placeholderTextColor="#B0A89F"
                style={{ textAlignVertical: 'top', minHeight: 130 }}
                className="text-[15px] font-medium text-[#334155] leading-relaxed p-0"
              />
            </View>

            {/* Botão de Ação Laranja com ícone de envio */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSendProposal}
              disabled={isSending}
              className="bg-[#FF7A2F] rounded-[28px] py-4.5 flex-row items-center justify-center shadow-md mb-12"
            >
              <Text className="text-white font-extrabold text-[17px] mr-2.5">
                {isSending ? 'Enviando Proposta...' : 'Enviar Proposta'}
              </Text>
              <Send color="#FFFFFF" size={19} strokeWidth={2.6} />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
