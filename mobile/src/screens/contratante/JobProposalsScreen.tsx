import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Platform, 
  Modal, 
  Alert,
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  MoreVertical, 
  TrendingDown, 
  Star, 
  Clock, 
  Check, 
  Wrench, 
  ArrowRight, 
  ShieldCheck, 
  MessageSquare, 
  X, 
  Award, 
  MapPin, 
  Calendar,
  CheckCircle2,
  Briefcase
} from '../../components/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { ProviderReviewModal } from '../../components/ProviderReviewModal';

export interface ProposalItem {
  id: string;
  providerId?: string;
  providerName: string;
  avatarUrl: string;
  level: 'OURO' | 'PRATA' | 'BRONZE' | 'NOVO';
  rating: number;
  reviewsCount: number;
  price: number;
  priceLabel: string;
  isLowestPrice?: boolean;
  message: string;
  fullBio?: string;
  verifiedBadge?: 'check' | 'tools' | 'none';
  photosPreview?: string[];
  skills?: string[];
  completedJobsCount?: number;
  status?: 'ACTIVE' | 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED';
  rejectReason?: string;
}

const DEMO_PROPOSALS: ProposalItem[] = [
  {
    id: 'p1',
    providerName: 'Ana Silva',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    level: 'OURO',
    rating: 5.0,
    reviewsCount: 120,
    price: 200,
    priceLabel: 'Orçamento',
    verifiedBadge: 'check',
    message: 'Olá! Tenho experiência de 5 anos em limpeza corporativa e trago meus próprios produtos ecológicos e equipamentos de alta performance...',
    fullBio: 'Profissional dedicada com 5 anos no mercado de higienização corporativa e pós-obra. Trabalho exclusivamente com produtos biodegradáveis de padrão hospitalar, garantindo um ambiente impecável e livre de odores fortes. Pontualidade e descrição são minhas maiores marcas.',
    photosPreview: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=150&auto=format&fit=crop&q=80'
    ],
    skills: ['Limpeza Comercial', 'Pós-Obra', 'Produtos Ecológicos', 'Higienização de Estofados'],
    completedJobsCount: 148
  },
  {
    id: 'p2',
    providerName: 'Carlos Mendes',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    level: 'PRATA',
    rating: 4.8,
    reviewsCount: 45,
    price: 180,
    priceLabel: 'Orçamento',
    verifiedBadge: 'tools',
    message: 'Bom dia. Sou especialista em limpeza pós-obra e manutenção regular. Posso começar amanhã mesmo no horário comercial...',
    fullBio: 'Atuo no segmento de serviços gerais e manutenção há mais de 4 anos. Possuo todos os equipamentos de proteção e maquinário pesado caso necessário. Garanto rapidez na execução sem deixar passar nenhum detalhe.',
    skills: ['Manutenção Regular', 'Manuseio de Maquinário', 'Limpeza de Pisos', 'Desinfecção'],
    completedJobsCount: 62
  },
  {
    id: 'p3',
    providerName: 'Mariana Costa',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    level: 'BRONZE',
    rating: 4.5,
    reviewsCount: 12,
    price: 150,
    priceLabel: 'Menor Preço',
    isLowestPrice: true,
    verifiedBadge: 'none',
    message: 'Olá, tenho disponibilidade imediata para as terças e quintas. Trabalho com agilidade e grande capricho em cada detalhe...',
    fullBio: 'Trabalho há 2 anos como diarista e especialista em organização de escritórios e consultórios. Foco em otimizar o tempo e manter tudo no seu devido lugar.',
    skills: ['Organização de Escritórios', 'Limpeza Detalhada', 'Rapidez', 'Flexibilidade'],
    completedJobsCount: 19
  },
  {
    id: 'p4',
    providerName: 'Pedro Alves',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    level: 'NOVO',
    rating: 0,
    reviewsCount: 0,
    price: 190,
    priceLabel: 'Orçamento',
    verifiedBadge: 'none',
    message: 'Começando agora na plataforma mas com 10 anos de experiência em higienização profissional e referências comprovadas...',
    fullBio: 'Sou novo aqui no app, mas acumulo 10 anos de trajetória prestando serviços para grandes empresas deFacilities. Tenho carta de recomendação de clientes anteriores e compromisso total com o resultado.',
    skills: ['Facilities', 'Limpeza Pesada', 'Referências Comprovadas', 'Pontualidade'],
    completedJobsCount: 0
  }
];

export default function JobProposalsScreen({ route, navigation }: any) {
  const job = route?.params?.job || {
    id: 'demo-1',
    title: 'Limpeza de Escritório',
    categoryLabel: 'Limpeza',
    status: 'Ativa',
    date: new Date().toISOString(),
  };

  const [sortBy, setSortBy] = useState<'menor_preco' | 'melhor_avaliacao' | 'mais_rapido'>('menor_preco');
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);

  const loadProposals = useCallback(async () => {
    let loaded: ProposalItem[] = [];

    // 1. Tentar pegar propostas vindas nas propriedades da vaga (job.applications)
    if (job.applications && Array.isArray(job.applications) && job.applications.length > 0) {
      loaded = [...job.applications];
    }

    // 2. Carregar de todos os locais de storage (@ContrataAI:allProposals e @ContrataAI:myProposals)
    try {
      const rawAll = await AsyncStorage.getItem('@ContrataAI:allProposals');
      const rawMy = await AsyncStorage.getItem('@ContrataAI:myProposals');
      const allList = rawAll ? JSON.parse(rawAll) : [];
      const myList = rawMy ? JSON.parse(rawMy) : [];
      
      const combined = [...allList];
      myList.forEach((mp: any) => {
        if (!combined.some((c: any) => c.id === mp.id)) {
          combined.push(mp);
        }
      });

      const matched = combined.filter((p: any) => {
        if (p.jobId && job.id && String(p.jobId) === String(job.id)) {
          return true;
        }
        if (p.jobTitle && job.title && String(p.jobTitle).toLowerCase().trim() === String(job.title).toLowerCase().trim()) {
          const pCat = (p.jobCategory || p.jobProfession || p.categoryLabel || p.skills?.[0] || '').toLowerCase().trim();
          const jCat = (job.categoryLabel || job.profession || job.category || '').toLowerCase().trim();
          if (pCat && jCat && (pCat.includes(jCat) || jCat.includes(pCat) || pCat === jCat)) {
            return true;
          }
        }
        return false;
      });

      matched.forEach((mp: any) => {
        if (!loaded.some(l => l.id === mp.id)) {
          loaded.push(mp);
        }
      });
    } catch (e) {}

    // 3. Tentar carregar via API /jobs/${job.id}/applications
    try {
      const res = await api.get(`/jobs/${job.id}/applications`);
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach((sp: any) => {
          if (!loaded.some(l => l.id === sp.id)) {
            loaded.push(sp);
          }
        });
      }
    } catch (e) {}

    // 4. Apenas se a vaga for o exemplo 'demo-1' e não tiver nenhuma candidatura real, usar propostas de demonstração.
    if (loaded.length === 0 && job.id === 'demo-1') {
      loaded = [...DEMO_PROPOSALS];
    }

    setProposals(loaded);
  }, [job.id, job.title, job.applications]);

  useEffect(() => {
    loadProposals();
    if (!navigation || typeof navigation.addListener !== 'function') return;
    const unsubscribe = navigation.addListener('focus', () => {
      loadProposals();
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        try { unsubscribe(); } catch (e) {}
      }
    };
  }, [loadProposals, navigation]);

  // Modais dos novos fluxos estratégicos de proposta
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ProposalItem | null>(null);
  const [rejectReasonChip, setRejectReasonChip] = useState<string>('');
  const [rejectReasonText, setRejectReasonText] = useState<string>('');

  const [hireConfirmModalVisible, setHireConfirmModalVisible] = useState(false);
  const [hireTarget, setHireTarget] = useState<ProposalItem | null>(null);

  // Ordenação inteligente de propostas (escondendo as reprovadas)
  const sortedProposals = useMemo(() => {
    const list = [...proposals].filter(p => p.status !== 'REJECTED');
    if (sortBy === 'menor_preco') {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'melhor_avaliacao') {
      return list.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
    }
    return list;
  }, [proposals, sortBy]);

  // Enviar notificação real ao prestador no AsyncStorage com prevenção de duplicatas
  const sendProviderNotification = async (proposal: ProposalItem, title: string, message: string, type: string) => {
    try {
      const raw = await AsyncStorage.getItem('@ContrataAI:notifications');
      let notifs = raw ? JSON.parse(raw) : [];

      // Se for notificação de negociação, remover duplicatas existentes para a mesma vaga/proposta
      if (type === 'PROPOSAL_NEGOTIATING') {
        notifs = notifs.filter((n: any) => !(n.jobId === job.id && (n.proposalId === proposal.id || n.recipientId === (proposal.providerId || proposal.id)) && n.type === 'PROPOSAL_NEGOTIATING'));
      }

      const rawUser = await AsyncStorage.getItem('@ContrataAI:userData');
      const parsedUser = rawUser ? JSON.parse(rawUser) : {};
      const contratanteCleanName = parsedUser.name ? (/^\d+$/.test(parsedUser.name.trim()) ? 'Gabriel Contratante' : parsedUser.name.trim()) : 'Gabriel Contratante';

      notifs.unshift({
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        recipientId: proposal.providerId || proposal.id,
        recipientRole: 'PRESTADOR',
        title,
        message,
        type,
        jobId: job.id,
        jobTitle: job.title || 'Serviço',
        proposalId: proposal.id,
        proposalPrice: proposal.price,
        contratanteName: contratanteCleanName,
        contratanteId: parsedUser.id || 'contratante-atual',
        contratanteAvatar: null,
        createdAt: new Date().toISOString(),
        read: false
      });
      await AsyncStorage.setItem('@ContrataAI:notifications', JSON.stringify(notifs));
    } catch (e) {
      console.log('Erro ao salvar notificação para o prestador', e);
    }
  };

  // 1. AÇÃO: NEGOCIAR (Abre chat e notifica prestador)
  const handleNegotiate = async (proposal: ProposalItem) => {
    // Atualizar status no estado e storage
    const updated = proposals.map(p => p.id === proposal.id ? { ...p, status: 'NEGOTIATING' as const } : p);
    setProposals(updated);
    try {
      await AsyncStorage.setItem('@ContrataAI:allProposals', JSON.stringify(updated));
    } catch (e) {}

    // Enviar notificação real para o prestador
    await sendProviderNotification(
      proposal,
      '💬 Proposta em Negociação!',
      `O contratante da vaga "${job.title}" abriu uma negociação sobre sua proposta de R$ ${proposal.price}. Envie uma mensagem no chat para combinarem entre si!`,
      'PROPOSAL_NEGOTIATING'
    );

    setSelectedProposal(null);
    navigation.navigate('ChatScreen', {
      recipientId: proposal.providerId || proposal.id,
      recipientName: proposal.providerName,
      recipientAvatar: proposal.avatarUrl,
      jobId: job.id || 'job-atual',
      jobTitle: job.title || 'Serviço',
      proposalPrice: proposal.price,
      proposalId: proposal.id,
      status: 'NEGOTIATING'
    });
  };

  // 2. AÇÃO: REPROVAR PROPOSTA (Abre modal de motivo)
  const handleOpenRejectModal = (proposal: ProposalItem) => {
    setRejectTarget(proposal);
    setRejectReasonChip('');
    setRejectReasonText('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;

    const updated = proposals.map(p => p.id === rejectTarget.id ? { ...p, status: 'REJECTED' as const, rejectReason: rejectReasonChip || rejectReasonText || 'Não informado' } : p);
    setProposals(updated);
    try {
      await AsyncStorage.setItem('@ContrataAI:allProposals', JSON.stringify(updated));
      
      // Sincronizar o status 'REJECTED' na lista do Prestador (@ContrataAI:myProposals)
      const rawMy = await AsyncStorage.getItem('@ContrataAI:myProposals');
      if (rawMy) {
        const myPropsList = JSON.parse(rawMy);
        const updatedMy = myPropsList.map((mp: any) => mp.id === rejectTarget.id ? { ...mp, status: 'REJECTED', rejectReason: rejectReasonChip || rejectReasonText || 'Não informado' } : mp);
        await AsyncStorage.setItem('@ContrataAI:myProposals', JSON.stringify(updatedMy));
      }
    } catch (e) {}

    // Enviar notificação ao prestador informando que a proposta não foi aceita
    await sendProviderNotification(
      rejectTarget,
      'Proposta não selecionada',
      `Sua proposta para a vaga "${job.title}" não foi selecionada pelo contratante desta vez. Continue enviando propostas para outras vagas em destaque!`,
      'PROPOSAL_REJECTED'
    );

    setRejectModalVisible(false);
    setSelectedProposal(null);
    setRejectTarget(null);
    Alert.alert('✅ Proposta Descartada', 'A proposta foi removida da sua lista e o prestador foi notificado.');
  };

  // 3. AÇÃO: CONTRATAR PRESTADOR (Abre confirmação e pergunta sobre interagir no chat)
  const handleOpenHireConfirmModal = (proposal: ProposalItem) => {
    setHireTarget(proposal);
    setHireConfirmModalVisible(true);
  };

  const handleConfirmHireAndProceed = async (proposal: ProposalItem, goToChat: boolean) => {
    // Atualizar status da proposta e da vaga no storage
    const updated = proposals.map(p => p.id === proposal.id ? { ...p, status: 'ACCEPTED' as const } : p);
    setProposals(updated);

    try {
      await AsyncStorage.setItem('@ContrataAI:allProposals', JSON.stringify(updated));
      
      // Atualizar status da vaga para Em Andamento no myJobs se existir
      const rawJobs = await AsyncStorage.getItem('@ContrataAI:myJobs');
      if (rawJobs) {
        const jobsList = JSON.parse(rawJobs);
        const updatedJobs = jobsList.map((j: any) => 
          j.id === job.id ? { 
            ...j, 
            status: 'IN_PROGRESS', 
            statusLabel: 'Em Andamento',
            hiredProviderId: proposal.providerId || proposal.id,
            hiredProviderName: proposal.providerName,
            hiredPrice: proposal.price
          } : j
        );
        await AsyncStorage.setItem('@ContrataAI:myJobs', JSON.stringify(updatedJobs));
      }
    } catch (e) {}

    // Enviar notificação real ao prestador informando que foi aprovado
    await sendProviderNotification(
      proposal,
      '🎉 Sua proposta foi APROVADA!',
      `Parabéns! O contratante aprovou sua proposta para "${job.title}" por R$ ${proposal.price}. Você já pode enviar mensagens no chat para combinar todos os detalhes e iniciar!`,
      'PROPOSAL_ACCEPTED'
    );

    setHireConfirmModalVisible(false);
    setSelectedProposal(null);
    setHireTarget(null);

    if (goToChat) {
      navigation.navigate('ChatScreen', {
        recipientId: proposal.providerId || proposal.id,
        recipientName: proposal.providerName,
        recipientAvatar: proposal.avatarUrl,
        jobId: job.id || 'job-atual',
        jobTitle: job.title || 'Serviço',
        proposalPrice: proposal.price,
        proposalId: proposal.id,
        status: 'ACCEPTED'
      });
    } else {
      Alert.alert('🎉 Contratação Concluída!', `Você contratou ${proposal.providerName}. O serviço agora está em andamento.`);
    }
  };

  const handleHire = (proposal: ProposalItem) => {
    handleOpenHireConfirmModal(proposal);
  };

  // NOVA FUNÇÃO: CANCELAR/EXCLUIR VAGA
  const handleDeleteJob = () => {
    Alert.alert(
      'Cancelar Vaga',
      'Tem certeza que deseja cancelar e excluir permanentemente esta vaga?',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim, Cancelar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const rawMyJobs = await AsyncStorage.getItem('@ContrataAI:myJobs');
              if (rawMyJobs) {
                const myJobs = JSON.parse(rawMyJobs);
                const updatedMyJobs = myJobs.filter((j: any) => j.id !== job.id);
                await AsyncStorage.setItem('@ContrataAI:myJobs', JSON.stringify(updatedMyJobs));
              }

              const rawJobs = await AsyncStorage.getItem('@ContrataAI:jobs');
              if (rawJobs) {
                const jobsList = JSON.parse(rawJobs);
                const updatedJobs = jobsList.filter((j: any) => j.id !== job.id);
                await AsyncStorage.setItem('@ContrataAI:jobs', JSON.stringify(updatedJobs));
              }

              Alert.alert('✅ Vaga Removida', 'A vaga foi cancelada e excluída com sucesso.');
              navigation.goBack();
            } catch (error) {
              console.error('Erro ao excluir vaga:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      {/* Header — VAGA PUBLICADA / Voltar / Título */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-4 bg-[#FAFAFA] border-b border-slate-100">
        <View className="flex-row items-center flex-1 pr-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-slate-200/60 items-center justify-center mr-3"
          >
            <ArrowLeft color="#1E293B" size={20} strokeWidth={2.4} />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF7A2F]">
              VAGA PUBLICADA
            </Text>
            <Text className="text-[19px] font-extrabold text-[#1E293B] leading-tight" numberOfLines={1}>
              {job.title}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleDeleteJob}
          className="w-10 h-10 rounded-full items-center justify-center bg-red-50"
        >
          <Text className="text-red-500 font-bold text-[10px] mt-1 mb-1 px-2">Excluir</Text>
        </TouchableOpacity>
      </View>

      {/* Banner de Ação Rápida — Serviço Concluído e Avaliação (< 30s) */}
      <View className="px-5 pt-3">
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => {
            const firstOrSelected = selectedProposal || sortedProposals[0] || DEMO_PROPOSALS[0];
            setReviewTarget({
              id: firstOrSelected.id,
              name: firstOrSelected.providerName,
              avatar: firstOrSelected.avatarUrl
            });
            setReviewModalVisible(true);
          }}
          className="bg-[#ECFDF5] border border-green-200/90 rounded-2xl p-3.5 flex-row items-center justify-between shadow-2xs"
        >
          <View className="flex-row items-center flex-1 pr-2">
            <View className="w-10 h-10 rounded-xl bg-green-500 items-center justify-center mr-3">
              <CheckCircle2 color="#FFFFFF" size={22} strokeWidth={2.4} />
            </View>
            <View className="flex-1">
              <Text className="text-[13.5px] font-extrabold text-green-900">
                Serviço Concluído?
              </Text>
              <Text className="text-[11.5px] font-medium text-green-700" numberOfLines={1}>
                Toque para avaliar o prestador em menos de 30s
              </Text>
            </View>
          </View>
          <Text className="text-xs font-extrabold text-green-700 bg-white px-3 py-1.5 rounded-xl border border-green-200">
            Avaliar ★
          </Text>
        </TouchableOpacity>
      </View>

      {/* Subheader — Contagem de Propostas e Ordenação */}
      <View className="px-5 pt-4 pb-2 bg-[#FAFAFA] flex-row items-center justify-between">
        <Text className="text-[18px] font-extrabold text-[#1E293B]">
          {sortedProposals.length} Propostas Recebidas
        </Text>
        <Text className="text-xs text-[#8C7A6B] font-medium">
          Ordenar por
        </Text>
      </View>

      {/* Chips Horizontal Scroll de Ordenação */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 14, paddingTop: 4 }}
        >
          {/* Chip 1 — Menor Preço */}
          <TouchableOpacity
            onPress={() => setSortBy('menor_preco')}
            activeOpacity={0.8}
            className={`flex-row items-center px-4 py-2.5 rounded-full mr-2.5 border ${
              sortBy === 'menor_preco'
                ? 'bg-[#1E293B] border-[#1E293B] shadow-sm'
                : 'bg-white border-slate-200/90'
            }`}
          >
            <TrendingDown 
              color={sortBy === 'menor_preco' ? '#FFFFFF' : '#64748B'} 
              size={15} 
              strokeWidth={2.5} 
              className="mr-1.5" 
            />
            <Text className={`text-[13px] font-bold ${sortBy === 'menor_preco' ? 'text-white' : 'text-[#1E293B]'}`}>
              Menor Preço
            </Text>
          </TouchableOpacity>

          {/* Chip 2 — Melhor Avaliação */}
          <TouchableOpacity
            onPress={() => setSortBy('melhor_avaliacao')}
            activeOpacity={0.8}
            className={`flex-row items-center px-4 py-2.5 rounded-full mr-2.5 border ${
              sortBy === 'melhor_avaliacao'
                ? 'bg-[#1E293B] border-[#1E293B] shadow-sm'
                : 'bg-white border-slate-200/90'
            }`}
          >
            <Star 
              color={sortBy === 'melhor_avaliacao' ? '#FFFFFF' : '#F59E0B'} 
              size={15} 
              fill={sortBy === 'melhor_avaliacao' ? '#FFFFFF' : '#F59E0B'} 
              className="mr-1.5" 
            />
            <Text className={`text-[13px] font-bold ${sortBy === 'melhor_avaliacao' ? 'text-white' : 'text-[#1E293B]'}`}>
              Melhor Avaliação
            </Text>
          </TouchableOpacity>

          {/* Chip 3 — Mais Rápido */}
          <TouchableOpacity
            onPress={() => setSortBy('mais_rapido')}
            activeOpacity={0.8}
            className={`flex-row items-center px-4 py-2.5 rounded-full border ${
              sortBy === 'mais_rapido'
                ? 'bg-[#1E293B] border-[#1E293B] shadow-sm'
                : 'bg-white border-slate-200/90'
            }`}
          >
            <Clock 
              color={sortBy === 'mais_rapido' ? '#FFFFFF' : '#64748B'} 
              size={15} 
              strokeWidth={2.4} 
              className="mr-1.5" 
            />
            <Text className={`text-[13px] font-bold ${sortBy === 'mais_rapido' ? 'text-white' : 'text-[#1E293B]'}`}>
              Mais Rápido
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Lista de Cards de Propostas */}
      <ScrollView
        className="flex-1 px-5 pt-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        {sortedProposals.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 border border-slate-100 items-center justify-center my-6 shadow-2xs">
            <View className="w-16 h-16 rounded-2xl bg-[#FFF4ED] items-center justify-center mb-4">
              <Briefcase color="#FF7A2F" size={28} />
            </View>
            <Text className="text-[17px] font-extrabold text-[#1E293B] text-center mb-1.5">
              Nenhuma proposta recebida
            </Text>
            <Text className="text-[13.5px] text-[#64748B] text-center leading-relaxed mb-4">
              Assim que os profissionais freelancers se candidatarem para a sua vaga "{job.title}", as propostas reais aparecerão aqui com preço, nota e nível de experiência.
            </Text>
          </View>
        ) : (
          sortedProposals.map((proposal, index) => {
            const isLowest = proposal.isLowestPrice || (sortBy === 'menor_preco' && index === 0);
            
            // Cores das badges de Nível baseadas no sistema centralizado
            let levelBg = '#FEF3C7';
            let levelColor = '#D97706';
            const lvlUpper = (proposal.level || '').toUpperCase();
            if (lvlUpper === 'NOVO' || lvlUpper.includes('NOVO')) {
              levelBg = '#ECFDF5';
              levelColor = '#10B981';
            } else if (lvlUpper === 'INICIANTE' || lvlUpper.includes('INICIANTE')) {
              levelBg = '#EFF6FF';
              levelColor = '#3B82F6';
            } else if (lvlUpper === 'QUALIFICADO' || lvlUpper.includes('QUALIFICADO')) {
              levelBg = '#DBEAFE';
              levelColor = '#2563EB';
            } else if (lvlUpper === 'EXPERIENTE' || lvlUpper.includes('EXPERIENTE')) {
              levelBg = '#F3E8FF';
              levelColor = '#9333EA';
            } else if (lvlUpper === 'REFERÊNCIA' || lvlUpper.includes('REFERÊNCIA') || lvlUpper === 'OURO') {
              levelBg = '#FEF3C7';
              levelColor = '#D97706';
            } else if (lvlUpper === 'ESPECIALISTA' || lvlUpper.includes('ESPECIALISTA')) {
              levelBg = '#FFF4ED';
              levelColor = '#FF7A2F';
            } else if (lvlUpper === 'PRATA') {
              levelBg = '#F1F5F9';
              levelColor = '#475569';
            } else if (lvlUpper === 'BRONZE') {
              levelBg = '#FFEDD5';
              levelColor = '#C2410C';
            }

            return (
            <View
              key={proposal.id}
              className="bg-white rounded-[28px] p-5 mb-4 shadow-sm border border-slate-100/90"
            >
              {/* Top Section — Avatar, Nome, Nível, Rating, Preço */}
              <View className="flex-row items-start justify-between mb-3.5">
                {/* Esquerda — Avatar + Info */}
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="relative mr-3.5">
                    <Image
                      source={{ uri: proposal.avatarUrl }}
                      className="w-14 h-14 rounded-full bg-slate-100"
                    />
                    {/* Badge circular no canto do avatar */}
                    {proposal.verifiedBadge === 'check' && (
                      <View className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#F59E0B] border-2 border-white items-center justify-center shadow-xs">
                        <Check color="#fff" size={12} strokeWidth={3} />
                      </View>
                    )}
                    {proposal.verifiedBadge === 'tools' && (
                      <View className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#64748B] border-2 border-white items-center justify-center shadow-xs">
                        <Wrench color="#fff" size={12} strokeWidth={2.6} />
                      </View>
                    )}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center flex-wrap gap-1.5 mb-0.5">
                      <Text className="text-[17px] font-extrabold text-[#1E293B]" numberOfLines={1}>
                        {proposal.providerName}
                      </Text>
                      {proposal.level !== 'NOVO' && (
                        <View className="px-2 py-0.5 rounded" style={{ backgroundColor: levelBg }}>
                          <Text className="text-[10px] font-extrabold tracking-wider uppercase" style={{ color: levelColor }}>
                            {proposal.level}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Avaliação ou status Novo */}
                    {proposal.rating > 0 ? (
                      <View className="flex-row items-center">
                        <Star color="#F59E0B" size={14} fill="#F59E0B" className="mr-1" />
                        <Text className="text-[13px] font-bold text-[#1E293B]">
                          {proposal.rating.toFixed(1)}
                        </Text>
                        <Text className="text-[12px] text-[#8C7A6B] ml-1">
                          ({proposal.reviewsCount} avaliações)
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-[12px] text-[#8C7A6B] font-medium">
                        Novo na plataforma (0 avaliações)
                      </Text>
                    )}
                  </View>
                </View>

                {/* Direita — Preço e Orçamento */}
                <View className="items-end">
                  <Text className={`text-[11px] font-semibold ${isLowest ? 'text-[#16A34A]' : 'text-[#8C7A6B]'}`}>
                    {isLowest ? 'Menor Preço' : 'Orçamento'}
                  </Text>
                  <Text className={`text-[20px] font-extrabold ${isLowest ? 'text-[#16A34A]' : 'text-[#1E293B]'}`}>
                    R$ {proposal.price}
                  </Text>
                </View>
              </View>

              {/* Box da Mensagem Inicial (Bio / Proposta) */}
              <View className="bg-slate-50/90 rounded-2xl p-3.5 mb-4 border border-slate-100/80">
                <Text className="text-[13.5px] text-[#475569] leading-[20px]" numberOfLines={3}>
                  {proposal.message}
                </Text>
              </View>

              {/* Rodapé — Fotos (se houver em destaque) + Botão Ver Detalhes */}
              <View className="flex-row items-center justify-between">
                {proposal.photosPreview && proposal.photosPreview.length > 0 ? (
                  <View className="flex-row items-center mr-3">
                    <View className="flex-row -space-x-2 mr-2">
                      {proposal.photosPreview.map((url, i) => (
                        <Image
                          key={i}
                          source={{ uri: url }}
                          className="w-9 h-9 rounded-full border-2 border-white bg-slate-200"
                        />
                      ))}
                    </View>
                    <View className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white items-center justify-center">
                      <Text className="text-[11px] font-bold text-[#475569]">+4</Text>
                    </View>
                  </View>
                ) : null}

                {/* Botão Ver Detalhes (Destaque Laranja se tiver fotos/ouro, ou Branco outline) */}
                {proposal.level === 'OURO' || (proposal.photosPreview && proposal.photosPreview.length > 0) ? (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => setSelectedProposal(proposal)}
                    className="flex-1 bg-[#FF7A2F] py-3.5 px-5 rounded-2xl flex-row items-center justify-center shadow-xs"
                  >
                    <Text className="text-white font-bold text-[15px] mr-1.5">
                      Ver Detalhes
                    </Text>
                    <ArrowRight color="#FFFFFF" size={17} strokeWidth={2.6} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => setSelectedProposal(proposal)}
                    className="flex-1 bg-white border border-slate-200/90 py-3 px-5 rounded-2xl flex-row items-center justify-center"
                  >
                    <Text className="text-[#1E293B] font-bold text-[15px] mr-1.5">
                      Ver Detalhes
                    </Text>
                    <ArrowRight color="#1E293B" size={17} strokeWidth={2.4} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }))}
      </ScrollView>

      {/* ========== MODAL / BOTTOM SHEET DE DETALHES DA PROPOSTA ========== */}
      <Modal
        visible={!!selectedProposal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedProposal(null)}
      >
        {selectedProposal && (
          <View className="flex-1 bg-[#FAFAFA]">
            {/* Header do Modal */}
            <View className="flex-row items-center justify-between px-6 pt-5 pb-4 bg-white border-b border-slate-100">
              <View>
                <Text className="text-xs font-bold text-[#FF7A2F] uppercase tracking-wider">
                  Detalhes da Proposta
                </Text>
                <Text className="text-xl font-extrabold text-[#1E293B]">
                  {selectedProposal.providerName}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedProposal(null)}
                className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
              >
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>

            {/* Conteúdo do Modal */}
            <ScrollView 
              className="flex-1 px-6 pt-5"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Card Resumo do Profissional */}
              <View className="bg-white rounded-3xl p-5 mb-5 border border-slate-100 shadow-sm flex-row items-center">
                <Image
                  source={{ uri: selectedProposal.avatarUrl }}
                  className="w-20 h-20 rounded-full bg-slate-100 mr-4"
                />
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-xl font-extrabold text-[#1E293B]">
                      {selectedProposal.providerName}
                    </Text>
                    {selectedProposal.level !== 'NOVO' && (
                      <View className="bg-[#FEF3C7] px-2 py-0.5 rounded">
                        <Text className="text-[10px] font-extrabold text-[#D97706]">
                          {selectedProposal.level}
                        </Text>
                      </View>
                    )}
                  </View>

                  {selectedProposal.rating > 0 ? (
                    <View className="flex-row items-center mb-1.5">
                      <Star color="#F59E0B" size={15} fill="#F59E0B" className="mr-1" />
                      <Text className="text-sm font-bold text-[#1E293B]">
                        {selectedProposal.rating.toFixed(1)}
                      </Text>
                      <Text className="text-xs text-[#8C7A6B] ml-1">
                        ({selectedProposal.reviewsCount} avaliações)
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-xs text-[#8C7A6B] font-medium mb-1.5">
                      Profissional Novo • 100% Verificado
                    </Text>
                  )}

                  <View className="flex-row items-center">
                    <ShieldCheck color="#16A34A" size={15} className="mr-1" />
                    <Text className="text-xs font-semibold text-[#16A34A]">
                      Identidade e Documentos Verificados
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card Orçamento Proposto */}
              <View className="bg-[#FFF4ED] border border-[#FF7A2F]/30 rounded-3xl p-5 mb-5 flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-[#8C7A6B] font-semibold uppercase tracking-wider mb-0.5">
                    Valor Cobrado pelo Serviço
                  </Text>
                  <Text className="text-3xl font-extrabold text-[#FF7A2F]">
                    R$ {selectedProposal.price}
                  </Text>
                </View>
                <View className="bg-white px-4 py-2 rounded-2xl border border-orange-200 shadow-xs">
                  <Text className="text-xs font-bold text-[#1E293B]">Pagamento Seguro</Text>
                  <Text className="text-[11px] text-[#64748B]">Liberado após conclusão</Text>
                </View>
              </View>

              {/* Apresentação e Carta Proposta */}
              <View className="bg-white rounded-3xl p-5 mb-5 border border-slate-100 shadow-sm">
                <Text className="text-base font-extrabold text-[#1E293B] mb-2.5">
                  Proposta e Apresentação
                </Text>
                <Text className="text-sm text-[#475569] leading-relaxed font-normal">
                  {selectedProposal.fullBio || selectedProposal.message}
                </Text>
              </View>

              {/* Especialidades e Competências */}
              {selectedProposal.skills && (
                <View className="bg-white rounded-3xl p-5 mb-5 border border-slate-100 shadow-sm">
                  <Text className="text-base font-extrabold text-[#1E293B] mb-3">
                    Especialidades e Habilidades
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {selectedProposal.skills.map((skill, idx) => (
                      <View key={idx} className="bg-slate-100 px-3.5 py-2 rounded-xl">
                        <Text className="text-xs font-bold text-[#334155]">{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Estatísticas de Confiança */}
              <View className="flex-row gap-3 mb-6">
                <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm items-center">
                  <Award color="#FF7A2F" size={24} className="mb-1" />
                  <Text className="text-lg font-extrabold text-[#1E293B]">
                    {selectedProposal.completedJobsCount || 10}+
                  </Text>
                  <Text className="text-xs text-[#64748B] font-medium text-center">
                    Serviços Concluídos
                  </Text>
                </View>

                <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm items-center">
                  <Check color="#16A34A" size={24} className="mb-1" />
                  <Text className="text-lg font-extrabold text-[#1E293B]">100%</Text>
                  <Text className="text-xs text-[#64748B] font-medium text-center">
                    Taxa de Resposta
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Ações Inferiores do Modal — 3 Botões Estratégicos (Contratar, Negociar e Reprovar) */}
            <View className="px-6 pt-4 pb-6 bg-white border-t border-slate-100 shadow-sm">
              {/* Botão Primário em Destaque — Contratar Prestador */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => handleOpenHireConfirmModal(selectedProposal)}
                className="bg-[#16A34A] rounded-2xl py-4 items-center justify-center flex-row shadow-sm mb-3"
              >
                <Check color="#FFFFFF" size={20} strokeWidth={3} className="mr-2" />
                <Text className="text-white font-extrabold text-base tracking-wide">
                  Contratar prestador • R$ {selectedProposal.price}
                </Text>
              </TouchableOpacity>

              {/* Linha Inferior — Botão Negociar e Botão Reprovar */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleNegotiate(selectedProposal)}
                  className="flex-1 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl py-3.5 items-center justify-center flex-row"
                >
                  <MessageSquare color="#2563EB" size={18} className="mr-2" />
                  <Text className="text-[#2563EB] font-extrabold text-sm">
                    Negociar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleOpenRejectModal(selectedProposal)}
                  className="flex-1 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl py-3.5 items-center justify-center flex-row"
                >
                  <X color="#EF4444" size={18} className="mr-1.5" />
                  <Text className="text-[#EF4444] font-extrabold text-sm">
                    Reprovar proposta
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* Modal / Popup de Reprovação de Proposta */}
      <Modal
        transparent
        visible={rejectModalVisible}
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-black/60 justify-center px-6"
        >
          <View className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xl font-extrabold text-[#1E293B]">
                Motivo da Reprovação
              </Text>
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              >
                <X color="#64748B" size={18} />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-[#64748B] font-medium leading-relaxed mb-4">
              Por que a proposta de <Text className="font-bold text-[#1E293B]">{rejectTarget?.providerName}</Text> não foi a ideal? Este feedback nos ajuda mas é <Text className="font-bold text-[#FF7A2F]">opcional</Text>.
            </Text>

            <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2.5">
                Selecione um motivo (opcional):
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {[
                  '💰 Valor acima do meu orçamento',
                  '📅 Prazo ou data incompatível',
                  '⭐ Poucas avaliações ou experiência',
                  '🛠️ Especialidade diferente do esperado',
                  'Outro motivo'
                ].map((chip, idx) => {
                  const isSelected = rejectReasonChip === chip;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => setRejectReasonChip(isSelected ? '' : chip)}
                      className={`px-3.5 py-2.5 rounded-xl border ${
                        isSelected
                          ? 'bg-[#FF7A2F] border-[#FF7A2F]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#334155]'}`}>
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2 mt-1">
                Ou digite uma justificativa (opcional):
              </Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-[#1E293B]"
                placeholder="Ex: Achei outra pessoa mais próxima..."
                placeholderTextColor="#94A3B8"
                value={rejectReasonText}
                onChangeText={setRejectReasonText}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View className="flex-row gap-3 pt-2 border-t border-slate-100">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setRejectModalVisible(false)}
                className="flex-1 bg-slate-100 rounded-2xl py-3.5 items-center justify-center"
              >
                <Text className="text-[#64748B] font-bold text-sm">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleConfirmReject}
                className="flex-1 bg-[#EF4444] rounded-2xl py-3.5 items-center justify-center shadow-sm"
              >
                <Text className="text-white font-extrabold text-sm">Enviar Reprovação</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal / Popup de Celebração e Interação com o Prestador (Contratar) */}
      <Modal
        transparent
        visible={hireConfirmModalVisible}
        animationType="fade"
        onRequestClose={() => setHireConfirmModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 items-center text-center">
            <View className="w-16 h-16 rounded-full bg-[#DCFCE7] items-center justify-center mb-4 border-2 border-[#86EFAC]">
              <CheckCircle2 color="#16A34A" size={36} />
            </View>

            <Text className="text-2xl font-extrabold text-[#1E293B] mb-2 text-center">
              Parabéns pela escolha!
            </Text>

            <Text className="text-sm text-[#475569] text-center leading-relaxed mb-6">
              Você aprovou a proposta de <Text className="font-extrabold text-[#1E293B]">{hireTarget?.providerName}</Text> no valor de <Text className="font-extrabold text-[#16A34A]">R$ {hireTarget?.price}</Text> para a vaga "{job.title}".
            </Text>

            <View className="bg-[#FFF4ED] border border-[#FF7A2F]/30 rounded-2xl p-4 mb-6 w-full flex-row items-center">
              <MessageSquare color="#FF7A2F" size={24} className="mr-3" />
              <Text className="text-xs text-[#8C7A6B] font-medium flex-1 leading-snug">
                Deseja interagir com o prestador no chat agora para combinar o endereço exato, horários e detalhes iniciais?
              </Text>
            </View>

            <View className="w-full gap-3">
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => hireTarget && handleConfirmHireAndProceed(hireTarget, true)}
                className="bg-[#16A34A] rounded-2xl py-4 items-center justify-center flex-row shadow-sm w-full"
              >
                <MessageSquare color="#FFFFFF" size={18} className="mr-2" />
                <Text className="text-white font-extrabold text-base">
                  💬 Sim, conversar agora
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => hireTarget && handleConfirmHireAndProceed(hireTarget, false)}
                className="bg-slate-100 rounded-2xl py-3.5 items-center justify-center w-full"
              >
                <Text className="text-[#64748B] font-bold text-sm">
                  Depois, voltar para vagas
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Avaliação Rápida (<30s) estilo iFood */}
      {reviewTarget && (
        <ProviderReviewModal
          visible={reviewModalVisible}
          onClose={() => {
            setReviewModalVisible(false);
            setReviewTarget(null);
          }}
          providerId={reviewTarget.id}
          providerName={reviewTarget.name}
          providerAvatar={reviewTarget.avatar}
          jobId={job.id || 'job-atual'}
          jobTitle={job.title || 'Serviço Concluído'}
          onReviewSubmitted={(newReview) => {
            setReviewModalVisible(false);
            setReviewTarget(null);
            Alert.alert('🌟 Perfeito!', `A média de ${newReview.providerName} foi atualizada com sua nota ${newReview.rating}★!`);
          }}
        />
      )}
    </SafeAreaView>
  );
}
