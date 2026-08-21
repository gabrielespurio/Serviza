import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image, Platform, StatusBar } from 'react-native';
import { ArrowLeft, MapPin, DollarSign, Clock, ShieldCheck, CheckCircle2, Send, X, Star, Briefcase, Award, Heart, Share2, ArrowRight, User } from '../../components/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryIcon, getCategoryIconAndColors } from '../../components/CategoryIcon';
import { api } from '../../services/api';
import { getProviderLevelDetailsByServices } from '../../services/providerLevels';

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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Botões Flutuantes Superiores sobre a Imagem */}
      <View 
        className="flex-row items-center justify-between px-5 absolute left-0 right-0 z-30"
        style={{ top: Platform.OS === 'ios' ? 52 : 44 }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-black/45 items-center justify-center backdrop-blur-md"
        >
          <ArrowLeft color="#FFFFFF" size={20} strokeWidth={2.6} />
        </TouchableOpacity>

        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsFavorite(!isFavorite)}
            className="w-10 h-10 rounded-full bg-black/45 items-center justify-center backdrop-blur-md"
          >
            <Heart 
              color={isFavorite ? '#FF7A2F' : '#FFFFFF'} 
              fill={isFavorite ? '#FF7A2F' : 'transparent'} 
              size={19} 
              strokeWidth={2.4} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Alert.alert('Compartilhar', `Compartilhar a vaga de ${job.title} com outros colegas profissionais.`)}
            className="w-10 h-10 rounded-full bg-black/45 items-center justify-center backdrop-blur-md"
          >
            <Share2 color="#FFFFFF" size={19} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Hero Cover Image (Inspiração idêntica à Imagem 2) */}
        <View className="w-full h-64 relative bg-slate-800">
          <Image
            source={{ uri: getCoverImage() }}
            className="w-full h-full resize-cover"
          />
          <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </View>

        {/* Card Principal Arredondado Sobrepondo a Imagem */}
        <View className="bg-[#FAFAFA] -mt-6 rounded-t-[32px] px-6 pt-6 flex-1 shadow-lg">
          {/* Top Tag & Preço */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-extrabold text-[#FF7A2F] uppercase tracking-wider">
              {job.categoryLabel || job.profession || 'URGENTE'}
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-2xl font-extrabold text-[#FF7A2F]">
                {job.priceLabel || `R$ ${job.price || '150'}`}
              </Text>
              {!job.priceLabel?.includes('/') && (
                <Text className="text-xs font-semibold text-[#64748B] ml-1">/total</Text>
              )}
            </View>
          </View>

          {/* Título Principal */}
          <Text className="text-[26px] font-extrabold text-[#1E293B] leading-tight mb-2">
            {job.title}
          </Text>

          {/* Horário & Localização */}
          <View className="flex-row items-center mb-6">
            <Clock color="#64748B" size={14} className="mr-1.5" />
            <Text className="text-xs font-semibold text-[#64748B]">
              Publicado {job.timeAgo || 'há 2h'} • {job.location || 'Centro, São Paulo'}
            </Text>
          </View>

          {/* 3 Grid Destaques: Distância / Avaliação / Nível */}
          <View className="flex-row justify-between gap-3 mb-6">
            <View className="bg-white rounded-2xl p-3.5 flex-1 items-center justify-center border border-slate-100 shadow-2xs">
              <View className="w-9 h-9 rounded-full bg-[#FFF4ED] items-center justify-center mb-1.5">
                <MapPin color="#FF7A2F" size={18} strokeWidth={2.4} />
              </View>
              <Text className="text-[11px] font-semibold text-[#64748B]">Distância</Text>
              <Text className="text-xs font-extrabold text-[#1E293B] mt-0.5">2.5 km</Text>
            </View>

            <View className="bg-white rounded-2xl p-3.5 flex-1 items-center justify-center border border-slate-100 shadow-2xs">
              <View className="w-9 h-9 rounded-full bg-[#FFF4ED] items-center justify-center mb-1.5">
                <Star color="#FF7A2F" fill="#FF7A2F" size={18} />
              </View>
              <Text className="text-[11px] font-semibold text-[#64748B]">Avaliação</Text>
              <Text className="text-xs font-extrabold text-[#1E293B] mt-0.5">
                {job.clientRating || '4.9'} ({job.clientJobsCount || '24'})
              </Text>
            </View>

            <View className="bg-white rounded-2xl p-3.5 flex-1 items-center justify-center border border-slate-100 shadow-2xs">
              <View className="w-9 h-9 rounded-full bg-[#FFF4ED] items-center justify-center mb-1.5">
                <CategoryIcon category={job.categoryLabel || job.categoryId} profession={job.profession || job.title} color="#FF7A2F" size={18} strokeWidth={2.4} />
              </View>
              <Text className="text-[11px] font-semibold text-[#64748B]">Categoria</Text>
              <Text className="text-xs font-extrabold text-[#1E293B] mt-0.5" numberOfLines={1}>
                {job.categoryLabel || 'Especializado'}
              </Text>
            </View>
          </View>

          {/* Descrição do Serviço */}
          <View className="mb-6">
            <Text className="text-[18px] font-extrabold text-[#1E293B] mb-2.5">
              Descrição do Serviço
            </Text>
            <Text className="text-[#475569] text-[15px] leading-relaxed mb-3">
              {job.description}
            </Text>

            <View className="gap-2 pt-1">
              <View className="flex-row items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-[#FF7A2F] mr-2.5" />
                <Text className="text-[14px] text-[#475569] font-medium">Verificação detalhada e diagnóstico presencial</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-[#FF7A2F] mr-2.5" />
                <Text className="text-[14px] text-[#475569] font-medium">Troca e manutenção de componentes no local</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-[#FF7A2F] mr-2.5" />
                <Text className="text-[14px] text-[#475569] font-medium">Revisão completa e teste final de segurança</Text>
              </View>
            </View>
          </View>

          {/* Requisitos Pills */}
          <View className="mb-6">
            <Text className="text-[18px] font-extrabold text-[#1E293B] mb-3">
              Requisitos
            </Text>
            <View className="flex-row flex-wrap gap-2.5">
              <View className="bg-white border border-slate-200/90 px-4 py-2 rounded-full shadow-2xs">
                <Text className="text-xs font-bold text-[#334155]">
                  {job.categoryLabel || job.profession || 'Serviço Presencial'}
                </Text>
              </View>
              <View className="bg-white border border-slate-200/90 px-4 py-2 rounded-full shadow-2xs">
                <Text className="text-xs font-bold text-[#334155]">Ferramentas Próprias</Text>
              </View>
              <View className="bg-white border border-slate-200/90 px-4 py-2 rounded-full shadow-2xs">
                <Text className="text-xs font-bold text-[#334155]">Pontualidade</Text>
              </View>
              <View className="bg-white border border-slate-200/90 px-4 py-2 rounded-full shadow-2xs">
                <Text className="text-xs font-bold text-[#334155]">Atendimento Presencial</Text>
              </View>
            </View>
          </View>

          {/* Localização Aproximada Mapa Mockup */}
          <View className="mb-6">
            <Text className="text-[18px] font-extrabold text-[#1E293B] mb-3">
              Localização Aproximada
            </Text>
            
            <View className="bg-[#E2E8F0] h-40 rounded-[28px] overflow-hidden relative border border-slate-200 items-center justify-center shadow-xs">
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80' }}
                className="w-full h-full resize-cover opacity-80"
              />
              <View className="absolute inset-0 bg-slate-900/10 items-center justify-center">
                <View className="w-13 h-13 rounded-full bg-white shadow-lg items-center justify-center border border-orange-100">
                  <MapPin color="#FF7A2F" size={26} strokeWidth={2.6} />
                </View>
              </View>
            </View>

            <Text className="text-xs font-semibold text-[#64748B] text-center mt-2.5">
              📍 O endereço exato será revelado após a confirmação.
            </Text>
          </View>

          {/* Perfil do Contratante */}
          <View className="bg-white rounded-[24px] p-4.5 border border-slate-100 shadow-sm flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1 pr-3">
              <View className="w-13 h-13 rounded-full bg-[#1E293B] items-center justify-center mr-3.5 shadow-xs">
                <Text className="text-white font-extrabold text-lg">
                  {(job.clientName || 'Ricardo Mendes')[0]}
                </Text>
              </View>
              <View>
                <Text className="text-base font-extrabold text-[#1E293B]">
                  {job.clientName || 'Ricardo Mendes'}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Star color="#FF7A2F" fill="#FF7A2F" size={14} className="mr-1" />
                  <Text className="text-xs font-extrabold text-[#1E293B]">
                    {job.clientRating || '4.9'}
                  </Text>
                  <Text className="text-xs text-[#64748B] font-medium ml-1">
                    • {job.clientJobsCount || '24'} contratações
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => Alert.alert('Perfil Verificado', `O contratante ${job.clientName || 'Ricardo Mendes'} possui identidade verificada e histórico de excelentes avaliações na plataforma.`)}
            >
              <Text className="text-xs font-extrabold text-[#FF7A2F]">Ver perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Barra de Ação Fixa Inferior (TOTAL ESTIMADO + Candidatar-se) */}
      <View 
        className="px-6 py-4 bg-white border-t border-slate-100 flex-row items-center justify-between absolute bottom-0 left-0 right-0 z-30 shadow-lg"
        style={{
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 10 },
            android: { elevation: 16 }
          })
        }}
      >
        <View>
          <Text className="text-[10px] font-extrabold text-[#8C7A6B] uppercase tracking-wider">
            TOTAL ESTIMADO
          </Text>
          <Text className="text-[22px] font-extrabold text-[#1E293B] mt-0.5">
            {job.priceLabel || `R$ ${job.price || '300,00'}`}
          </Text>
          <Text className="text-[10.5px] font-semibold text-[#94A3B8]">
            Baseado na demanda
          </Text>
        </View>

        {existingProposal ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleCancelProposal}
            className="bg-red-500 rounded-2xl px-6 py-4 flex-row items-center justify-center shadow-md"
          >
            <Text className="text-white font-extrabold text-[14px] mr-2">Cancelar Proposta</Text>
            <X color="#FFFFFF" size={17} strokeWidth={2.8} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setShowProposalModal(true)}
            className="bg-[#16A34A] rounded-2xl px-7 py-4 flex-row items-center justify-center shadow-md"
          >
            <Text className="text-white font-extrabold text-base mr-2">Candidatar-se</Text>
            <ArrowRight color="#FFFFFF" size={19} strokeWidth={2.8} />
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
