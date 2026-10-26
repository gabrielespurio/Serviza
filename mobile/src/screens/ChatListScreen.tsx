import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  ActivityIndicator, 
  Modal, 
  ScrollView, 
  TouchableWithoutFeedback 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Check, 
  Filter, 
  MessageSquare,
  Sparkles
} from '../components/icons';
import { CategoryIcon, getCategoryIconAndColors } from '../components/CategoryIcon';
import { 
  ChatListItem, 
  UserJobOption, 
  getRealChats, 
  getUserJobsForFilter, 
  markChatAsRead 
} from '../services/chatService';

type FilterType = 'all' | 'unread' | 'read';

export default function ChatListScreen({ navigation }: any) {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [jobs, setJobs] = useState<UserJobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'contratante' | 'prestador'>('contratante');
  
  // Filtros de estado
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string | null>(null);
  const [isJobModalVisible, setIsJobModalVisible] = useState(false);

  // Carregar dados reais ao focar na tela
  const fetchChats = useCallback(async () => {
    try {
      const savedRole = await AsyncStorage.getItem('@ContrataAI:userRole');
      let currentRole: 'contratante' | 'prestador' = savedRole === 'prestador' ? 'prestador' : 'contratante';

      const rawUserData = await AsyncStorage.getItem('@ContrataAI:userData');
      if (rawUserData) {
        try {
          const parsed = JSON.parse(rawUserData);
          if (parsed.role && String(parsed.role).toLowerCase() === 'prestador') {
            currentRole = 'prestador';
          } else if (parsed.role && String(parsed.role).toLowerCase() === 'contratante') {
            currentRole = 'contratante';
          }
        } catch (e) {}
      }

      setUserRole(currentRole);

      // Carrega exclusivamente conversas reais e limpa mensagens fictícias
      const realChats = await getRealChats(currentRole);
      setChats(realChats);

      // Somente contratante possui vagas próprias para filtrar
      if (currentRole === 'contratante') {
        const availableJobs = await getUserJobsForFilter(realChats);
        setJobs(availableJobs);
      } else {
        setJobs([]);
        setSelectedJobId(null);
        setSelectedJobTitle(null);
      }
    } catch (error) {
      console.error("Erro ao carregar lista de chats reais:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  // Aplicação dos filtros (Leitura + Vaga selecionada para contratante)
  const getFilteredChats = () => {
    let result = chats;

    // 1. Filtrar por vaga se selecionada e for contratante
    if (userRole === 'contratante' && selectedJobId) {
      result = result.filter(c => {
        if (c.jobId && String(c.jobId) === String(selectedJobId)) return true;
        if (selectedJobTitle && c.jobTitle && c.jobTitle.toLowerCase().trim() === selectedJobTitle.toLowerCase().trim()) return true;
        return false;
      });
    }

    // 2. Filtrar por status de leitura
    if (filter === 'unread') {
      result = result.filter(c => c.unreadCount > 0);
    } else if (filter === 'read') {
      result = result.filter(c => c.unreadCount === 0);
    }

    return result;
  };

  const filteredChats = getFilteredChats();

  const handleSelectJob = (job: UserJobOption | null) => {
    if (!job) {
      setSelectedJobId(null);
      setSelectedJobTitle(null);
    } else {
      setSelectedJobId(job.id);
      setSelectedJobTitle(job.title);
    }
    setIsJobModalVisible(false);
  };

  const handleOpenChat = async (item: ChatListItem) => {
    await markChatAsRead(item.storageKey);
    // Atualiza estado local imediatamente para feedback ágil
    setChats(prev => prev.map(c => c.id === item.id ? { ...c, unreadCount: 0 } : c));

    navigation.navigate('ChatScreen', {
      recipientId: item.recipientId,
      recipientName: item.recipientName,
      recipientAvatar: item.recipientAvatar,
      jobId: item.jobId,
      jobTitle: item.jobTitle,
      proposalId: item.proposalId || item.recipientId,
      status: item.status || 'NEGOTIATING'
    });
  };

  const renderFilterPill = (label: string, value: FilterType) => {
    const isActive = filter === value;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setFilter(value)}
        className={`px-4 py-2 rounded-full mr-2.5 ${isActive ? 'bg-[#FF7A2F]' : 'bg-[#F1F5F9]'}`}
      >
        <Text className={`text-xs font-extrabold ${isActive ? 'text-white' : 'text-[#64748B]'}`}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderChatItem = ({ item }: { item: ChatListItem }) => {
    const isUnread = item.unreadCount > 0;
    const initial = (item.recipientName ? item.recipientName.trim().charAt(0) : 'P').toUpperCase();

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleOpenChat(item)}
        className="flex-row items-center px-5 py-4 border-b border-slate-100 bg-white"
      >
        {/* Avatar */}
        <View className="relative mr-4">
          {item.recipientAvatar && !item.recipientAvatar.includes('dummy') ? (
            <Image 
              source={{ uri: item.recipientAvatar }} 
              className="w-14 h-14 rounded-full bg-slate-200" 
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-[#FFF4ED] items-center justify-center border border-[#FED7AA]">
              <Text className="text-[#EA580C] font-extrabold text-[20px]">
                {initial}
              </Text>
            </View>
          )}
          {item.isOnline && (
            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#22C55E] border-2 border-white" />
          )}
        </View>

        {/* Informações da conversa */}
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[#1E293B] font-extrabold text-[16px] flex-1 mr-2" numberOfLines={1}>
              {item.recipientName}
            </Text>
            <Text className={`text-[11px] font-bold ${isUnread ? 'text-[#FF7A2F]' : 'text-[#94A3B8]'}`}>
              {item.lastMessageTimestamp}
            </Text>
          </View>
          
          <Text className="text-[#64748B] text-[11px] font-semibold mb-1" numberOfLines={1}>
            Serviço: {item.jobTitle}
          </Text>

          <View className="flex-row items-center justify-between">
            <Text 
              className={`flex-1 text-[13px] ${isUnread ? 'text-[#1E293B] font-extrabold' : 'text-[#64748B] font-medium'}`} 
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            
            {isUnread && (
              <View className="bg-[#FF7A2F] min-w-[20px] h-5 px-1.5 rounded-full items-center justify-center ml-2">
                <Text className="text-white text-[10px] font-extrabold">
                  {item.unreadCount}
                </Text>
              </View>
            )}
            
            {!isUnread && (
              <View className="ml-2">
                <CheckCircle2 color="#4ADE80" size={14} strokeWidth={2.8} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      {/* Cabeçalho */}
      <View className="px-5 pt-3 pb-3 bg-white">
        <Text className="text-[28px] font-black text-[#1E293B] tracking-tight">
          Mensagens
        </Text>
      </View>

      {/* Barra de Filtros */}
      <View className="px-5 py-3 bg-white border-b border-slate-100">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {renderFilterPill('Todas', 'all')}
          {renderFilterPill('Não lidas', 'unread')}
          {renderFilterPill('Lidas', 'read')}

          {/* O Botão de Filtrar por Vaga é exibido EXCLUSIVAMENTE para CONTRATANTE sem o ícone de maleta */}
          {userRole === 'contratante' && (
            <>
              {/* Divisor vertical */}
              <View className="w-[1px] h-5 bg-slate-200 mx-1 mr-3" />

              {/* Botão de Filtrar por Vaga (sem a maletinha na parte superior) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsJobModalVisible(true)}
                className={`flex-row items-center px-4 py-2 rounded-full border ${
                  selectedJobId 
                    ? 'bg-[#FFF4ED] border-[#FF7A2F]' 
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <Text 
                  numberOfLines={1}
                  className={`text-xs font-extrabold ${selectedJobId ? 'text-[#FF7A2F]' : 'text-[#475569]'}`}
                  style={{ maxWidth: 140 }}
                >
                  {selectedJobTitle ? `Vaga: ${selectedJobTitle}` : 'Filtrar por vaga'}
                </Text>

                {selectedJobId ? (
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => {
                      setSelectedJobId(null);
                      setSelectedJobTitle(null);
                    }}
                    className="ml-2 w-4 h-4 rounded-full bg-[#FF7A2F]/20 items-center justify-center"
                  >
                    <X color="#FF7A2F" size={10} strokeWidth={3} />
                  </TouchableOpacity>
                ) : (
                  <ChevronRight 
                    color="#94A3B8" 
                    size={13} 
                    strokeWidth={2.6} 
                    style={{ marginLeft: 5, transform: [{ rotate: '90deg' }] }} 
                  />
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      {/* Indicador de Filtro Ativo por Vaga (com ícone da categoria selecionada) */}
      {userRole === 'contratante' && selectedJobId && (
        <View className="px-5 py-2.5 bg-[#FFF7ED] flex-row items-center justify-between border-b border-[#FFEDD5]">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-6 h-6 rounded-lg overflow-hidden mr-2 items-center justify-center bg-white/80 border border-[#FED7AA]">
              <CategoryIcon category={selectedJobTitle || ''} size={15} />
            </View>
            <Text className="text-xs font-bold text-[#9A3412]" numberOfLines={1}>
              Vaga: <Text className="font-black text-[#C2410C]">{selectedJobTitle}</Text>
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              setSelectedJobId(null);
              setSelectedJobTitle(null);
            }}
            className="px-2.5 py-1 rounded-full bg-white border border-[#FDBA74] shadow-2xs"
          >
            <Text className="text-[10px] font-black text-[#C2410C]">Limpar filtro</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de Conversas ou Estado Vazio */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF7A2F" />
        </View>
      ) : filteredChats.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 bg-[#FFF4ED] rounded-full items-center justify-center mb-4 overflow-hidden border border-[#FED7AA]">
            {selectedJobId ? (
              <View className="w-12 h-12 rounded-2xl overflow-hidden items-center justify-center">
                <CategoryIcon category={selectedJobTitle || ''} size={30} />
              </View>
            ) : filter === 'unread' ? (
              <Sparkles color="#FF7A2F" size={32} strokeWidth={2.2} />
            ) : (
              <MessageSquare color="#FF7A2F" size={32} strokeWidth={2.2} />
            )}
          </View>

          <Text className="text-[#1E293B] font-extrabold text-lg mb-2 text-center">
            {selectedJobId 
              ? 'Nenhuma conversa nesta vaga'
              : filter === 'unread'
              ? 'Nenhuma mensagem não lida'
              : 'Nenhuma mensagem'}
          </Text>

          <Text className="text-[#64748B] text-center text-sm leading-relaxed mb-6">
            {selectedJobId 
              ? `Não encontramos conversas iniciadas para a vaga "${selectedJobTitle}".`
              : filter === 'unread'
              ? 'Todas as suas conversas estão em dia!'
              : userRole === 'contratante'
              ? 'Quando você iniciar negociações com profissionais em suas vagas, as conversas aparecerão aqui.'
              : 'Quando você enviar propostas e negociar com contratantes, suas conversas aparecerão aqui.'}
          </Text>

          {selectedJobId ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedJobId(null);
                setSelectedJobTitle(null);
              }}
              className="bg-[#FF7A2F] px-5 py-3 rounded-2xl"
            >
              <Text className="text-white font-extrabold text-sm">
                Ver todas as conversas
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (userRole === 'contratante') {
                  navigation.navigate('Vagas');
                } else {
                  navigation.navigate('Busca');
                }
              }}
              className="bg-[#FFF4ED] border border-[#FED7AA] px-5 py-3 rounded-2xl"
            >
              <Text className="text-[#FF7A2F] font-extrabold text-sm">
                {userRole === 'contratante' ? 'Ver minhas vagas' : 'Buscar vagas disponíveis'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={item => item.id}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* MODAL / POPUP DE SELEÇÃO DE VAGA (SOMENTE PARA CONTRATANTE) */}
      {userRole === 'contratante' && (
        <Modal
          visible={isJobModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsJobModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsJobModalVisible(false)}>
            <View className="flex-1 bg-black/50 justify-end">
              <TouchableWithoutFeedback>
                <View className="bg-white rounded-t-[32px] px-6 pt-5 pb-9 max-h-[80%] shadow-2xl">
                  {/* Barra de arraste visual */}
                  <View className="w-10 h-1 bg-slate-200 rounded-full self-center mb-4" />

                  {/* Cabeçalho do Popup (Design limpo, sem o ícone de maletinha na parte superior) */}
                  <View className="flex-row items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
                    <View className="flex-1 mr-3">
                      <Text className="text-[19px] font-black text-[#1E293B]">
                        Filtrar por Vaga
                      </Text>
                      <Text className="text-xs text-[#64748B] font-medium mt-0.5">
                        Selecione uma vaga para ver as conversas vinculadas
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setIsJobModalVisible(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                    >
                      <X color="#64748B" size={16} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>

                  {/* Lista de Vagas para Seleção */}
                  <ScrollView showsVerticalScrollIndicator={false} className="mt-2 mb-2">
                    {/* Opção 1: Todas as Vagas (Limpar Filtro) */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSelectJob(null)}
                      className={`flex-row items-center justify-between p-3.5 rounded-2xl mb-2.5 border ${
                        selectedJobId === null
                          ? 'bg-[#FFF7ED] border-[#FF7A2F]'
                          : 'bg-white border-slate-100 shadow-2xs'
                      }`}
                    >
                      <View className="flex-row items-center flex-1 pr-3">
                        <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-3.5 ${
                          selectedJobId === null ? 'bg-[#FF7A2F]' : 'bg-slate-100'
                        }`}>
                          <Filter color={selectedJobId === null ? '#FFFFFF' : '#64748B'} size={18} strokeWidth={2.4} />
                        </View>
                        <View className="flex-1">
                          <Text className={`text-[15px] font-extrabold ${
                            selectedJobId === null ? 'text-[#FF7A2F]' : 'text-[#1E293B]'
                          }`}>
                            Todas as vagas
                          </Text>
                          <Text className="text-[11px] text-[#94A3B8] font-medium mt-0.5">
                            Exibir mensagens de todas as vagas ({chats.length})
                          </Text>
                        </View>
                      </View>
                      {selectedJobId === null && (
                        <View className="w-6 h-6 rounded-full bg-[#FF7A2F] items-center justify-center">
                          <Check color="#FFFFFF" size={14} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Vagas Cadastradas com o ÍCONE DA CATEGORIA da própria vaga */}
                    {jobs.length === 0 ? (
                      <View className="py-8 items-center justify-center">
                        <Text className="text-sm font-bold text-[#64748B] text-center">
                          Nenhuma vaga encontrada no momento.
                        </Text>
                        <Text className="text-xs text-[#94A3B8] text-center mt-1">
                          Crie uma vaga ou receba propostas para gerenciar conversas.
                        </Text>
                      </View>
                    ) : (
                      jobs.map((job) => {
                        const isSelected = selectedJobId === job.id || (selectedJobTitle === job.title && !selectedJobId);
                        const relatedChatsCount = chats.filter(c => c.jobId === job.id || c.jobTitle === job.title).length;
                        const catDetails = getCategoryIconAndColors(job.category || job.title);

                        return (
                          <TouchableOpacity
                            key={job.id}
                            activeOpacity={0.7}
                            onPress={() => handleSelectJob(job)}
                            className={`flex-row items-center justify-between p-3.5 rounded-2xl mb-2.5 border ${
                              isSelected
                                ? 'bg-[#FFF7ED] border-[#FF7A2F]'
                                : 'bg-white border-slate-100 shadow-2xs'
                            }`}
                          >
                            <View className="flex-row items-center flex-1 pr-3">
                              {/* Ícone ilustrado ou vetorial oficial da CATEGORIA da vaga */}
                              <View 
                                className="w-12 h-12 rounded-2xl items-center justify-center mr-3.5 overflow-hidden border border-slate-100"
                                style={{ backgroundColor: catDetails.bgColor || '#F8FAFC' }}
                              >
                                <CategoryIcon 
                                  category={job.category || job.title} 
                                  profession={job.profession || job.title} 
                                  size={22} 
                                />
                              </View>
                              <View className="flex-1">
                                <Text 
                                  className={`text-[15px] font-extrabold ${
                                    isSelected ? 'text-[#FF7A2F]' : 'text-[#1E293B]'
                                  }`}
                                  numberOfLines={1}
                                >
                                  {job.title}
                                </Text>
                                <View className="flex-row items-center mt-1">
                                  <View className="px-2 py-0.5 rounded-md bg-slate-100 mr-2">
                                    <Text className="text-[10px] font-bold text-[#64748B]">
                                      {job.category || 'Serviço'}
                                    </Text>
                                  </View>
                                  <Text className={`text-[11px] font-bold ${
                                    relatedChatsCount > 0 ? 'text-[#FF7A2F]' : 'text-[#94A3B8]'
                                  }`}>
                                    • {relatedChatsCount} {relatedChatsCount === 1 ? 'conversa' : 'conversas'}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            {isSelected && (
                              <View className="w-6 h-6 rounded-full bg-[#FF7A2F] items-center justify-center">
                                <Check color="#FFFFFF" size={14} strokeWidth={3} />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </SafeAreaView>
  );
}
