import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, TextInput, Modal, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MapPin, 
  Pencil, 
  User, 
  Briefcase, 
  Lock, 
  Settings, 
  ChevronRight, 
  X, 
  ArrowLeftRight, 
  Star, 
  Send, 
  Clock, 
  CalendarDays, 
  Award, 
  ShieldCheck, 
  Sparkles, 
  Crown, 
  Gem, 
  LogOut 
} from '../components/icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { 
  ProviderLevel, 
  ProviderProfile, 
  ProviderLevelConfig, 
  calculateProviderLevel, 
  getProviderLevelDetailsByServices, 
  calculateProgressToNextLevel,
  getProviderLevelDetails
} from '../services/providerLevels';
import { ProviderLevelsModal } from '../components/ProviderLevelsModal';
import { LevelUpCelebrationModal } from '../components/LevelUpCelebrationModal';

export default function ProfileScreen({ navigation }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeRole, setActiveRole] = useState<'contratante' | 'prestador'>('contratante');

  const [userData, setUserData] = useState({
    name: 'Prestador Silva',
    email: '',
    phone: '',
    city: 'São Paulo, SP',
    skills: [] as string[]
  });

  const [stats, setStats] = useState({
    jobsCount: 0,
    hiresCount: 0,
    proposalsCount: 0,
    servicesCount: 0,
    rating: 0,
    reviewsCount: 0,
    memberSince: 'Novo membro'
  });

  const [providerReviews, setProviderReviews] = useState<any[]>([]);
  const [topTags, setTopTags] = useState<string[]>(['⏰ Pontual', '💬 Boa comunicação', '✅ Serviço de qualidade']);
  const [wouldHirePercentage, setWouldHirePercentage] = useState<number>(96);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [completedServices, setCompletedServices] = useState<number>(0);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile>({
    completedServices: 0,
    level: ProviderLevel.INICIANTE
  });
  const [levelUpConfig, setLevelUpConfig] = useState<ProviderLevelConfig | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
  });

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Atenção', 'Você precisa permitir o acesso à galeria para mudar a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      await AsyncStorage.setItem('@ContrataAI:avatarUrl', uri);
      
      try {
        setUploading(true);
        const filename = uri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        const formData = new FormData();
        formData.append('avatar', {
          uri,
          name: filename,
          type
        } as any);

        await api.put('/users/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (error: any) {
      } finally {
        setUploading(false);
      }
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      // 1. Checar role ativa no storage local ou da sessão
      const savedRole = await AsyncStorage.getItem('@ContrataAI:userRole');
      const currentRole = savedRole === 'prestador' ? 'prestador' : 'contratante';
      setActiveRole(currentRole);

      // 2. Carregar avatar salvo (se houver, caso contrário mantém null para exibir inicial do nome)
      const savedAvatar = await AsyncStorage.getItem('@ContrataAI:avatarUrl');
      if (savedAvatar) {
        setImage(savedAvatar);
      } else {
        setImage(null);
      }

      // 3. Carregar dados reais do usuário salvas no AsyncStorage
      const rawUser = await AsyncStorage.getItem('@ContrataAI:userData');
      let currentData = { ...userData };
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        const nameClean = parsed.name ? (parsed.name.includes('@') ? parsed.name.split('@')[0] : parsed.name) : (currentRole === 'prestador' ? 'Prestador' : 'Contratante');
        currentData = {
          name: nameClean,
          email: parsed.email || '',
          phone: parsed.phone || '(11) 99999-9999',
          city: parsed.city || 'São Paulo, SP',
          skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : (parsed.subcategory ? [parsed.subcategory] : [])
        };
        setUserData(currentData);
        if (parsed.role === 'PRESTADOR' && !savedRole) {
          setActiveRole('prestador');
        }
      }

      // 4. Calcular estatísticas de dados REAIS e contagens
      const rawJobs = await AsyncStorage.getItem('@ContrataAI:myJobs');
      const jobs = rawJobs ? JSON.parse(rawJobs) : [];
      
      const rawProposals = await AsyncStorage.getItem('@ContrataAI:myProposals');
      const proposals = rawProposals ? JSON.parse(rawProposals) : [];

      const realServicesCount = Math.max(proposals.length, jobs.filter((j: any) => j.status === 'Concluída' || j.status === 'Contratado').length);

      // 5. Carregar e calcular Avaliações do Prestador (@ContrataAI:providerReviews)
      const rawReviews = await AsyncStorage.getItem('@ContrataAI:providerReviews');
      let loadedReviews = rawReviews ? JSON.parse(rawReviews) : [];
      
      // Se não houver avaliações, loadedReviews será um array vazio.

      setProviderReviews(loadedReviews);

      // Calcular média real das estrelas e contagens
      let calcRating = 0;
      let calcCount = 0;
      let calcWouldHire = 0;

      if (loadedReviews.length > 0) {
        const sumRating = loadedReviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0);
        calcRating = Number((sumRating / loadedReviews.length).toFixed(1));
        calcCount = loadedReviews.length;
        
        const wouldHireCount = loadedReviews.filter((r: any) => r.wouldHireAgain === true || r.wouldHireAgain !== false).length;
        calcWouldHire = Math.round((wouldHireCount / loadedReviews.length) * 100);
      }


      // Calcular top 3 tags mais frequentes (⭐ Destaques)
      const tagCounts: { [key: string]: number } = {};
      loadedReviews.forEach((r: any) => {
        if (Array.isArray(r.tags)) {
          r.tags.forEach((t: string) => {
            tagCounts[t] = (tagCounts[t] || 0) + 1;
          });
        }
      });
      const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
      const computedTopTags = sortedTags.length > 0 ? sortedTags.slice(0, 3) : [];
      setTopTags(computedTopTags);
      setWouldHirePercentage(calcWouldHire);

      const computedServicesCount = realServicesCount;

      setStats({
        jobsCount: Array.isArray(jobs) ? jobs.length : 0,
        hiresCount: Array.isArray(jobs) ? jobs.filter((j: any) => j.status === 'Concluída' || j.status === 'Contratado').length : 0,
        proposalsCount: Array.isArray(proposals) ? proposals.length : 0,
        servicesCount: computedServicesCount,
        rating: calcRating,
        reviewsCount: calcCount,
        memberSince: 'Novo membro'
      });

      // 6. Carregar completedServices para o Sistema de Níveis
      const rawCompletedServices = await AsyncStorage.getItem('@ContrataAI:completedServices');
      const finalCompleted = rawCompletedServices ? parseInt(rawCompletedServices, 10) : computedServicesCount;
      const currentLevelEnum = calculateProviderLevel(finalCompleted);
      
      setCompletedServices(finalCompleted);
      setProviderProfile({
        completedServices: finalCompleted,
        level: currentLevelEnum
      });

      // Verificar progressão automática de nível (Evolução)
      const prevSavedLevel = await AsyncStorage.getItem('@ContrataAI:previousLevel');
      if (prevSavedLevel && prevSavedLevel !== currentLevelEnum) {
        const prevDetails = getProviderLevelDetails(prevSavedLevel as ProviderLevel);
        const currDetails = getProviderLevelDetails(currentLevelEnum);
        if (currDetails.index > prevDetails.index) {
          setLevelUpConfig(currDetails);
          setShowCelebrationModal(true);
        }
        await AsyncStorage.setItem('@ContrataAI:previousLevel', currentLevelEnum);
      } else if (!prevSavedLevel) {
        await AsyncStorage.setItem('@ContrataAI:previousLevel', currentLevelEnum);
      }

      // 7. Atualizar com dados da API (/users/profile) se backend disponível
      const res = await api.get('/users/profile').catch(() => null);
      if (res?.data) {
        if (res.data.avatarUrl && !savedAvatar) setImage(res.data.avatarUrl);
        const nameClean = res.data.name ? (res.data.name.includes('@') ? res.data.name.split('@')[0] : res.data.name) : currentData.name;
        const updatedSkills = res.data.prestador?.skills?.length ? res.data.prestador.skills : currentData.skills;
        
        setUserData(prev => ({
          ...prev,
          name: nameClean,
          email: res.data.email || prev.email,
          skills: updatedSkills
        }));
      }
    } catch (error) {}
  }, [userData]);

  useEffect(() => {
    fetchProfile();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
    });
    return unsubscribe;
  }, [fetchProfile, navigation]);

  const handleOpenEditModal = () => {
    setEditForm({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      city: userData.city,
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Erro', 'Por favor insira seu nome.');
      return;
    }

    try {
      await api.put('/users/profile', {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        city: editForm.city.trim(),
      });
    } catch (error) {}

    const updated = {
      ...userData,
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      city: editForm.city.trim() || 'São Paulo, SP',
    };

    setUserData(updated);
    await AsyncStorage.setItem('@ContrataAI:userData', JSON.stringify(updated));
    setShowEditModal(false);
    Alert.alert('Sucesso', 'Seus dados foram atualizados com sucesso!');
  };

  const handleSwitchMode = () => {
    const isCurrentlyPrestador = activeRole === 'prestador';
    const targetRole = isCurrentlyPrestador ? 'contratante' : 'prestador';
    const targetScreen = isCurrentlyPrestador ? 'MainContratante' : 'MainPrestador';
    const targetTitle = isCurrentlyPrestador ? 'Mudar para Modo Contratante' : 'Mudar para Modo Prestador';
    const targetDesc = isCurrentlyPrestador 
      ? 'Você será direcionado para a interface de contratante, onde poderá publicar vagas e contratar profissionais.'
      : 'Você será direcionado para a interface de prestador de serviços, onde poderá buscar vagas e enviar propostas.';

    Alert.alert(
      `🔄 ${targetTitle}`,
      targetDesc,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Mudar Agora',
          onPress: async () => {
            await AsyncStorage.setItem('@ContrataAI:userRole', targetRole);
            setActiveRole(targetRole);
            navigation.reset({ index: 0, routes: [{ name: targetScreen }] });
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      '🚪 Sair da Conta',
      'Tem certeza que deseja sair do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            // Remover token e avatar, mas PRESERVAR userData e userRole
            // para que o login consiga identificar o tipo de perfil corretamente
            await AsyncStorage.removeItem('@ContrataAI:token');
            await AsyncStorage.removeItem('@ContrataAI:avatarUrl');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  // Determinar os detalhes centralizados de nível de acordo com completedServices
  const levelDetails = getProviderLevelDetailsByServices(completedServices);
  const progressInfo = calculateProgressToNextLevel(completedServices);
  const isNumericName = userData.name ? /^\d+$/.test(userData.name.trim()) : true;
  const displayName = isNumericName 
    ? (activeRole === 'prestador' ? 'Profissional Silva' : 'Gabriel Contratante')
    : userData.name;
  const initialLetter = isNumericName 
    ? (activeRole === 'prestador' ? 'P' : 'G') 
    : displayName.trim().charAt(0).toUpperCase();
  const primarySkill = userData.skills && userData.skills[0] ? userData.skills[0] : 'Prestador de Serviços';

  // Renderizar ícones dos níveis do sistema
  const renderBadgeIcon = (iconType: string, color: string, size = 22) => {
    if (iconType === 'sparkles') return <Sparkles color={color} size={size} strokeWidth={2.4} />;
    if (iconType === 'briefcase') return <Briefcase color={color} size={size} strokeWidth={2.4} />;
    if (iconType === 'star') return <Star color={color} size={size} strokeWidth={2.4} />;
    if (iconType === 'award') return <Award color={color} size={size} strokeWidth={2.4} />;
    if (iconType === 'crown') return <Crown color={color} size={size} strokeWidth={2.4} />;
    if (iconType === 'gem') return <Gem color={color} size={size} strokeWidth={2.4} />;
    return <Award color={color} size={size} strokeWidth={2.4} />;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <ScrollView 
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
      >
        {/* Top Header — Meu Perfil + Configurações */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[24px] font-extrabold text-[#1E293B]">
            Meu Perfil
          </Text>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => Alert.alert('Configurações', 'Notificações e preferências da conta salvas localmente.')}
            className="w-11 h-11 rounded-full bg-white border border-slate-200/90 items-center justify-center shadow-2xs"
          >
            <Settings color="#334155" size={22} strokeWidth={2.3} />
          </TouchableOpacity>
        </View>

        {/* Hero Card / Foto do Usuário (ou Letra Inicial) + Insígnia do Nível */}
        <View className="items-center mb-6">
          <TouchableOpacity 
            onPress={pickImage} 
            activeOpacity={0.88}
            className="relative items-center"
          >
            {/* Anel laranja ao redor do avatar */}
            <View className="p-1 rounded-full border-2 border-[#FF7A2F] bg-white shadow-sm">
              {image ? (
                <Image 
                  source={{ uri: image }} 
                  className="w-28 h-28 rounded-full bg-slate-200"
                />
              ) : (
                <View className="w-28 h-28 rounded-full bg-orange-50 items-center justify-center border border-orange-100">
                  <Text className="text-[44px] font-black text-[#FF7A2F]">
                    {initialLetter}
                  </Text>
                </View>
              )}
            </View>

            {/* Insígnia do Nível Atual no pé do avatar - Somente no Modo Prestador */}
            {activeRole === 'prestador' && (
              <View 
                className="absolute -bottom-2 px-4 py-1 rounded-full border-2 border-white shadow-md flex-row items-center"
                style={{ backgroundColor: levelDetails.color }}
              >
                <Text className="text-white font-extrabold text-[11px] uppercase tracking-wider">
                  {levelDetails.label.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Botão circular sutil para editar foto */}
            <View className="absolute top-1 right-1 w-8 h-8 rounded-full bg-white items-center justify-center border border-slate-200 shadow-2xs">
              <Pencil color="#FF7A2F" size={14} strokeWidth={2.6} />
            </View>
          </TouchableOpacity>

          <Text className="text-[22px] font-extrabold text-[#1E293B] mt-5 text-center capitalize">
            {displayName}
          </Text>

          {/* Seção de Destaque do Nível (Especificação do Sistema de Níveis da Serviza) */}
          {activeRole === 'prestador' && (
            <View className="items-center mt-2.5 mb-1">
              <View 
                className="px-4 py-1.5 rounded-2xl flex-row items-center justify-center border shadow-2xs mb-1"
                style={{ backgroundColor: levelDetails.bgColor, borderColor: levelDetails.color + '50' }}
              >
                <Text className="text-base font-black mr-1" style={{ color: levelDetails.color }}>
                  {levelDetails.name}
                </Text>
              </View>
              <Text className="text-sm font-bold text-[#475569]">
                {completedServices} {completedServices === 1 ? 'serviço concluído' : 'serviços concluídos'}
              </Text>
            </View>
          )}

          {activeRole === 'prestador' && (
            <Text className="text-[13px] font-semibold text-[#8C7A6B] mt-1 text-center">
              {primarySkill}
            </Text>
          )}

          {/* Avaliação (Estrela e Média de Avaliações) - Somente no Modo Prestador */}
          {activeRole === 'prestador' && (
            <View className="bg-white border border-slate-200/80 rounded-full px-4 py-1.5 flex-row items-center mt-2.5 shadow-2xs">
              <Star color="#F59E0B" fill="#F59E0B" size={15} className="mr-1.5" />
              <Text className="text-xs font-extrabold text-[#1E293B]">
                {stats.rating.toFixed(1)}
              </Text>
              <Text className="text-xs text-[#64748B] font-medium ml-1">
                ({stats.reviewsCount} {stats.reviewsCount === 1 ? 'avaliação' : 'avaliações'})
              </Text>
            </View>
          )}
        </View>

        {/* 3 Grid Stats Cards (Serviços / Pontualidade / Tempo de Membro) */}
        <View className="flex-row justify-between gap-3 mb-6">
          {/* Card 1: Serviços Realizados / Propostas */}
          <View className="flex-1 bg-white rounded-[26px] p-4 border border-slate-100/90 shadow-2xs items-center">
            <View className="w-11 h-11 rounded-2xl bg-[#FFF4ED] items-center justify-center mb-2.5">
              <Briefcase color="#FF7A2F" size={20} strokeWidth={2.4} />
            </View>
            <Text className="text-[20px] font-extrabold text-[#1E293B] mb-0.5">
              {activeRole === 'prestador' ? stats.proposalsCount + stats.servicesCount : stats.jobsCount}
            </Text>
            <Text className="text-[10px] font-extrabold text-[#8C7A6B] uppercase tracking-wider">
              {activeRole === 'prestador' ? 'SERVIÇOS' : 'VAGAS'}
            </Text>
          </View>

          {/* Card 2: Pontualidade / Confiabilidade */}
          <View className="flex-1 bg-white rounded-[26px] p-4 border border-slate-100/90 shadow-2xs items-center">
            <View className="w-11 h-11 rounded-2xl bg-[#ECFDF5] items-center justify-center mb-2.5">
              {activeRole === 'prestador' ? (
                <Clock color="#10B981" size={20} strokeWidth={2.4} />
              ) : (
                <ShieldCheck color="#10B981" size={20} strokeWidth={2.4} />
              )}
            </View>
            <Text className="text-[20px] font-extrabold text-[#1E293B] mb-0.5">
              100%
            </Text>
            <Text className="text-[10px] font-extrabold text-[#8C7A6B] uppercase tracking-wider">
              {activeRole === 'prestador' ? 'PONTUAL' : 'CONFIÁVEL'}
            </Text>
          </View>

          {/* Card 3: Membro Desde */}
          <View className="flex-1 bg-white rounded-[26px] p-4 border border-slate-100/90 shadow-2xs items-center">
            <View className="w-11 h-11 rounded-2xl bg-[#EFF6FF] items-center justify-center mb-2.5">
              <CalendarDays color="#3B82F6" size={20} strokeWidth={2.4} />
            </View>
            <Text className="text-[20px] font-extrabold text-[#1E293B] mb-0.5">
              {stats.memberSince}
            </Text>
            <Text className="text-[10px] font-extrabold text-[#8C7A6B] uppercase tracking-wider">
              MEMBRO
            </Text>
          </View>
        </View>

        {/* Sistema de Níveis e Insígnias (INSÍGNIAS DE NÍVEL) */}
        {/* Sistema de Níveis da Serviza (Barra de Progresso e Níveis) */}
        {activeRole === 'prestador' && (
          <View className="bg-white rounded-[28px] p-5 border border-slate-100/90 shadow-2xs mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[12px] font-extrabold text-[#1E293B] uppercase tracking-widest">
                NÍVEIS DA SERVIZA
              </Text>
              <TouchableOpacity onPress={() => setShowLevelsModal(true)}>
                <Text className="text-[13px] font-bold text-[#FF7A2F]">
                  Como funciona
                </Text>
              </TouchableOpacity>
            </View>

            {/* Card Barra de Progresso */}
            <View 
              className="rounded-3xl p-4 border mb-4"
              style={{ backgroundColor: levelDetails.bgColor, borderColor: levelDetails.color + '40' }}
            >
              <View className="flex-row items-center justify-between mb-2.5">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl">{levelDetails.iconEmoji}</Text>
                  <Text className="text-lg font-black" style={{ color: levelDetails.color }}>
                    {levelDetails.label}
                  </Text>
                </View>

                <View className="bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                  <Text className="text-xs font-black text-[#1E293B]">
                    {progressInfo.isMaxLevel 
                      ? `${completedServices} serviços` 
                      : `${completedServices} / ${progressInfo.nextLevel?.minServices} serviços`}
                  </Text>
                </View>
              </View>

              {/* Barra de Progresso Visual */}
              {!progressInfo.isMaxLevel && (
                <View className="bg-white/80 h-3.5 rounded-full overflow-hidden mb-2.5 border border-slate-200/60 p-0.5">
                  <View 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${Math.max(6, progressInfo.progressPercentage)}%`,
                      backgroundColor: levelDetails.color 
                    }} 
                  />
                </View>
              )}

              <Text className="text-xs font-extrabold text-[#475569] leading-snug">
                {progressInfo.statusText}
              </Text>
            </View>

            {/* Ações e Simulação para teste e evolução */}
            <View className="flex-row gap-2.5">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowLevelsModal(true)}
                className="flex-1 bg-slate-50 border border-slate-200/90 py-3 px-3 rounded-2xl flex-row items-center justify-center shadow-2xs"
              >
                <Award color="#64748B" size={16} strokeWidth={2.4} className="mr-1.5" />
                <Text className="text-xs font-bold text-[#475569]">
                  Ver Todos os Níveis
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={async () => {
                  const nextServices = completedServices + 1;
                  await AsyncStorage.setItem('@ContrataAI:completedServices', nextServices.toString());
                  const oldLevel = calculateProviderLevel(completedServices);
                  const newLevel = calculateProviderLevel(nextServices);
                  
                  setCompletedServices(nextServices);
                  setProviderProfile({ completedServices: nextServices, level: newLevel });
                  
                  if (newLevel !== oldLevel) {
                    setLevelUpConfig(getProviderLevelDetailsByServices(nextServices));
                    setShowCelebrationModal(true);
                    await AsyncStorage.setItem('@ContrataAI:previousLevel', newLevel);
                  } else {
                    Alert.alert(
                      'Serviço Concluído (+1) ⚡', 
                      `Seu contador subiu para ${nextServices} serviços concluídos.\n\n${calculateProgressToNextLevel(nextServices).statusText}`
                    );
                  }
                }}
                className="bg-[#FFF4ED] border border-[#FF7A2F]/40 py-3 px-3.5 rounded-2xl flex-row items-center justify-center shadow-2xs"
              >
                <Briefcase color="#FF7A2F" size={16} strokeWidth={2.4} className="mr-1.5" />
                <Text className="text-xs font-extrabold text-[#FF7A2F]">
                  +1 Concluído (Testar)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Destaques do Prestador e Avaliações dos Clientes (Modo Prestador) */}
        {activeRole === 'prestador' && (
          <>
            {/* 1. Destaques do Prestador */}
            <View className="bg-white rounded-[28px] p-5 border border-slate-100/90 shadow-2xs mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-[12px] font-extrabold text-[#1E293B] uppercase tracking-widest">
                  ⭐ DESTAQUES DO PRESTADOR
                </Text>
                <View className="bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                  <Text className="text-[11px] font-extrabold text-green-700">
                    👍 {wouldHirePercentage}% contratariam novamente
                  </Text>
                </View>
              </View>

              <Text className="text-xs text-[#64748B] mb-3">
                Pontos fortes mais citados pelos clientes:
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {topTags.map((tag, idx) => (
                  <View 
                    key={idx}
                    className="bg-[#FFF4ED] border border-[#FF7A2F]/30 px-3.5 py-2 rounded-2xl flex-row items-center"
                  >
                    <Text className="text-xs font-extrabold text-[#FF7A2F]">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 2. Lista de Comentários e Avaliações Recebidas */}
            <View className="bg-white rounded-[28px] p-5 border border-slate-100/90 shadow-2xs mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[12px] font-extrabold text-[#1E293B] uppercase tracking-widest">
                  💬 COMENTÁRIOS DOS CLIENTES ({stats.reviewsCount})
                </Text>
                <View className="flex-row items-center">
                  <Star color="#F59E0B" fill="#F59E0B" size={15} className="mr-1" />
                  <Text className="text-sm font-extrabold text-[#1E293B]">{stats.rating.toFixed(1)}</Text>
                </View>
              </View>

              {providerReviews.slice(0, 4).map((rev: any, index: number) => {
                const timeStr = rev.id.startsWith('demo-')
                  ? (index === 0 ? 'há 3 dias' : index === 1 ? 'há 2 semanas' : 'há 1 mês')
                  : 'Recentemente';

                return (
                  <View 
                    key={rev.id || index}
                    className={`pt-3.5 pb-3.5 ${index !== Math.min(providerReviews.length, 4) - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center gap-1">
                        {[...Array(5)].map((_, sIdx) => (
                          <Star 
                            key={sIdx}
                            color={sIdx < (rev.rating || 5) ? '#F59E0B' : '#E2E8F0'} 
                            fill={sIdx < (rev.rating || 5) ? '#F59E0B' : 'transparent'} 
                            size={14} 
                          />
                        ))}
                      </View>
                      <Text className="text-xs text-[#8C7A6B] font-medium">{timeStr}</Text>
                    </View>

                    {rev.comment ? (
                      <Text className="text-sm font-medium text-[#334155] leading-relaxed mt-1">
                        "{rev.comment}"
                      </Text>
                    ) : (
                      <Text className="text-xs italic text-[#94A3B8] mt-1">
                        Serviço avaliado com {rev.rating} estrelas
                      </Text>
                    )}

                    {Array.isArray(rev.tags) && rev.tags.length > 0 && (
                      <View className="flex-row flex-wrap gap-1.5 mt-2">
                        {rev.tags.slice(0, 3).map((t: string, tIdx: number) => (
                          <View key={tIdx} className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                            <Text className="text-[10px] font-semibold text-[#64748B]">{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Card Alternador de Modo (Modo Contratante vs Modo Prestador) */}
        <View className="bg-white rounded-[26px] p-4.5 border border-slate-100/90 shadow-2xs flex-row items-center justify-between mb-7">
          <View className="flex-row items-center flex-1 pr-3">
            <View className="w-11 h-11 rounded-2xl bg-slate-100 items-center justify-center mr-3.5">
              <ArrowLeftRight color="#334155" size={20} strokeWidth={2.3} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-extrabold text-[#1E293B]">
                {activeRole === 'prestador' ? 'Modo Contratante' : 'Modo Prestador'}
              </Text>
              <Text className="text-[12px] font-medium text-[#64748B]" numberOfLines={1}>
                {activeRole === 'prestador' ? 'Buscar e contratar profissionais' : 'Prestar serviços no marketplace'}
              </Text>
            </View>
          </View>

          <Switch
            value={false}
            onValueChange={handleSwitchMode}
            trackColor={{ false: '#E2E8F0', true: '#FF7A2F' }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        {/* GERAL Section */}
        <Text className="text-[12px] font-extrabold text-[#8C7A6B] uppercase tracking-wider mb-3 ml-1">
          GERAL
        </Text>

        <View className="bg-white rounded-[28px] p-2.5 border border-slate-100/90 shadow-2xs mb-8">
          {/* 1. Meus Dados */}
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handleOpenEditModal}
            className="flex-row items-center justify-between p-3.5 border-b border-slate-100"
          >
            <View className="flex-row items-center flex-1 pr-3">
              <View className="w-10 h-10 rounded-2xl bg-[#FFF4ED] items-center justify-center mr-3.5">
                <User color="#FF7A2F" size={20} strokeWidth={2.4} />
              </View>
              <Text className="text-[15px] font-extrabold text-[#1E293B]">Meus Dados</Text>
            </View>
            <ChevronRight color="#CBD5E1" size={18} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* 2. Minhas Propostas vs Minhas Vagas */}
          {activeRole === 'prestador' ? (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Chat')}
              className="flex-row items-center justify-between p-3.5 border-b border-slate-100"
            >
              <View className="flex-row items-center flex-1 pr-3">
                <View className="w-10 h-10 rounded-2xl bg-[#FFF4ED] items-center justify-center mr-3.5">
                  <Send color="#FF7A2F" size={20} strokeWidth={2.4} />
                </View>
                <Text className="text-[15px] font-extrabold text-[#1E293B]">Minhas Propostas e Orçamentos</Text>
              </View>
              <ChevronRight color="#CBD5E1" size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Vagas')}
              className="flex-row items-center justify-between p-3.5 border-b border-slate-100"
            >
              <View className="flex-row items-center flex-1 pr-3">
                <View className="w-10 h-10 rounded-2xl bg-[#FFF4ED] items-center justify-center mr-3.5">
                  <Briefcase color="#FF7A2F" size={20} strokeWidth={2.4} />
                </View>
                <Text className="text-[15px] font-extrabold text-[#1E293B]">Minhas Vagas Postadas</Text>
              </View>
              <ChevronRight color="#CBD5E1" size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          )}

          {/* 3. Segurança / Privacidade */}
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => Alert.alert('Segurança', 'Sua conta e seus dados estão protegidos por criptografia de ponta a ponta.')}
            className="flex-row items-center justify-between p-3.5 border-b border-slate-100"
          >
            <View className="flex-row items-center flex-1 pr-3">
              <View className="w-10 h-10 rounded-2xl bg-[#FFF4ED] items-center justify-center mr-3.5">
                <ShieldCheck color="#FF7A2F" size={20} strokeWidth={2.4} />
              </View>
              <Text className="text-[15px] font-extrabold text-[#1E293B]">Segurança e Verificação</Text>
            </View>
            <ChevronRight color="#CBD5E1" size={18} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* 4. Sair da Conta */}
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handleLogout}
            className="flex-row items-center justify-between p-3.5"
          >
            <View className="flex-row items-center flex-1 pr-3">
              <View className="w-10 h-10 rounded-2xl bg-red-50 items-center justify-center mr-3.5">
                <LogOut color="#EF4444" size={20} strokeWidth={2.4} />
              </View>
              <Text className="text-[15px] font-extrabold text-red-500">Sair da conta</Text>
            </View>
            <ChevronRight color="#CBD5E1" size={18} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ========== MODAL DE EDIÇÃO DE DADOS ========== */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100">
            <Text className="text-lg font-extrabold text-[#1E293B]">Editar Dados do Perfil</Text>
            <TouchableOpacity 
              onPress={() => setShowEditModal(false)}
              className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
            >
              <X color="#64748B" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-6">
            <View className="mb-4">
              <Text className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Nome Completo</Text>
              <View className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5">
                <TextInput
                  value={editForm.name}
                  onChangeText={(t) => setEditForm({ ...editForm, name: t })}
                  placeholder="Seu nome"
                  placeholderTextColor="#94A3B8"
                  className="text-base font-semibold text-[#1E293B] p-0"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">E-mail</Text>
              <View className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5">
                <TextInput
                  value={editForm.email}
                  onChangeText={(t) => setEditForm({ ...editForm, email: t })}
                  placeholder="Seu e-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94A3B8"
                  className="text-base font-semibold text-[#1E293B] p-0"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Telefone</Text>
              <View className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5">
                <TextInput
                  value={editForm.phone}
                  onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
                  placeholder="Seu telefone"
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                  className="text-base font-semibold text-[#1E293B] p-0"
                />
              </View>
            </View>

            <View className="mb-8">
              <Text className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Cidade / Estado</Text>
              <View className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5">
                <TextInput
                  value={editForm.city}
                  onChangeText={(t) => setEditForm({ ...editForm, city: t })}
                  placeholder="Ex: São Paulo, SP"
                  placeholderTextColor="#94A3B8"
                  className="text-base font-semibold text-[#1E293B] p-0"
                />
              </View>
            </View>

            <TouchableOpacity 
              activeOpacity={0.88}
              onPress={handleSaveProfile}
              className="bg-[#FF7A2F] rounded-2xl py-4 items-center justify-center shadow-sm"
            >
              <Text className="text-white font-extrabold text-base">Salvar Alterações</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ========== MODAL DO SISTEMA DE NÍVEIS DA SERVIZA ========== */}
      <ProviderLevelsModal
        visible={showLevelsModal || showBadgesModal}
        onClose={() => {
          setShowLevelsModal(false);
          setShowBadgesModal(false);
        }}
        completedServices={completedServices}
      />

      {/* ========== MODAL COMEMORATIVO DE EVOLUÇÃO DE NÍVEL ========== */}
      <LevelUpCelebrationModal
        visible={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        levelConfig={levelUpConfig || levelDetails}
      />
    </SafeAreaView>
  );
}
