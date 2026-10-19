import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckCircle2 } from '../components/icons';

// Tipagem base para cada item da lista de chat
interface ChatListItem {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  jobId: string;
  jobTitle: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isOnline: boolean;
}

type FilterType = 'all' | 'unread' | 'read';

export default function ChatListScreen({ navigation }: any) {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  // Carrega os chats
  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        // Mock inicial de conversas. Em uma implementação real com backend, 
        // nós leríamos de uma API ou do AsyncStorage varrendo chaves "chat_v2_...".
        const mockedChats: ChatListItem[] = [
          {
            id: 'c1',
            recipientId: 'prov-1',
            recipientName: 'Carlos Roberto',
            recipientAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop',
            jobId: 'job-1',
            jobTitle: 'Eletricista Predial',
            lastMessage: 'Perfeito, estarei aí às 14h amanhã!',
            lastMessageTimestamp: '10:45',
            unreadCount: 2,
            isOnline: true,
          },
          {
            id: 'c2',
            recipientId: 'prov-2',
            recipientName: 'Ana Silva',
            recipientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
            jobId: 'job-2',
            jobTitle: 'Limpeza Pós-Obra',
            lastMessage: 'Tudo bem. Pode me mandar o endereço exato?',
            lastMessageTimestamp: 'Ontem',
            unreadCount: 0,
            isOnline: false,
          },
          {
            id: 'c3',
            recipientId: 'prov-3',
            recipientName: 'Marcos Almeida',
            recipientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
            jobId: 'job-3',
            jobTitle: 'Garçom para evento',
            lastMessage: 'Já enviei a proposta atualizada.',
            lastMessageTimestamp: 'Segunda',
            unreadCount: 1,
            isOnline: true,
          }
        ];

        // Simulando delay de rede
        setTimeout(() => {
          setChats(mockedChats);
          setLoading(false);
        }, 600);

      } catch (error) {
        console.error("Erro ao carregar lista de chats:", error);
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const getFilteredChats = () => {
    switch (filter) {
      case 'unread':
        return chats.filter(c => c.unreadCount > 0);
      case 'read':
        return chats.filter(c => c.unreadCount === 0);
      default:
        return chats;
    }
  };

  const filteredChats = getFilteredChats();

  const renderFilterPill = (label: string, value: FilterType) => {
    const isActive = filter === value;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setFilter(value)}
        className={`px-4 py-2 rounded-full mr-3 ${isActive ? 'bg-[#FF7A2F]' : 'bg-[#F1F5F9]'}`}
      >
        <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-[#64748B]'}`}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderChatItem = ({ item }: { item: ChatListItem }) => {
    const isUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          // Navega para o chat repassando os parâmetros básicos
          navigation.navigate('ChatScreen', {
            recipientId: item.recipientId,
            recipientName: item.recipientName,
            recipientAvatar: item.recipientAvatar,
            jobId: item.jobId,
            jobTitle: item.jobTitle,
          });
        }}
        className="flex-row items-center px-5 py-4 border-b border-slate-100 bg-white"
      >
        {/* Avatar */}
        <View className="relative mr-4">
          {item.recipientAvatar ? (
            <Image 
              source={{ uri: item.recipientAvatar }} 
              className="w-14 h-14 rounded-full bg-slate-200" 
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-[#F3F4F6] items-center justify-center border border-slate-200">
              <Text className="text-slate-700 font-extrabold text-[22px]">
                {item.recipientName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {item.isOnline && (
            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#22C55E] border-2 border-white" />
          )}
        </View>

        {/* Content */}
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[#1E293B] font-extrabold text-[16px]" numberOfLines={1}>
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
              className={`flex-1 text-[13px] ${isUnread ? 'text-[#1E293B] font-bold' : 'text-[#64748B] font-medium'}`} 
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            
            {isUnread && (
              <View className="bg-[#FF7A2F] w-5 h-5 rounded-full items-center justify-center ml-2">
                <Text className="text-white text-[10px] font-extrabold">
                  {item.unreadCount}
                </Text>
              </View>
            )}
            
            {!isUnread && (
              <View className="ml-2">
                <CheckCircle2 color="#4ADE80" size={14} strokeWidth={3} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-white">
      {/* Cabeçalho */}
      <View className="px-5 pt-4 pb-4">
        <Text className="text-[26px] font-extrabold text-[#1E293B]">
          Mensagens
        </Text>
      </View>

      {/* Filtros */}
      <View className="px-5 mb-3 flex-row border-b border-slate-100 pb-4">
        {renderFilterPill('Todas', 'all')}
        {renderFilterPill('Não lidas', 'unread')}
        {renderFilterPill('Lidas', 'read')}
      </View>

      {/* Lista */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF7A2F" />
        </View>
      ) : filteredChats.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
            <Text className="text-[32px]">💬</Text>
          </View>
          <Text className="text-[#1E293B] font-bold text-lg mb-2">
            Nenhuma mensagem
          </Text>
          <Text className="text-[#64748B] text-center text-sm">
            Quando você iniciar negociações, suas conversas aparecerão aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}
