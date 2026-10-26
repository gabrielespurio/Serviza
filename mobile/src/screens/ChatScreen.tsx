import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  FlatList,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, CheckCircle2, Briefcase, MoreVertical, MessageSquare } from '../components/icons';
import { Paperclip, Mic } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { updateChatIndex, markChatAsRead } from '../services/chatService';

export interface ChatMessage {
  id: string;
  senderRole?: 'contratante' | 'prestador';
  sender?: 'me' | 'other';
  senderName: string;
  text: string;
  timestamp: string;
}

export default function ChatScreen({ route, navigation }: any) {
  const {
    recipientId = 'prov-1',
    recipientName = 'Profissional',
    recipientAvatar = null,
    jobId = 'job-1',
    jobTitle = 'Serviço Contratado',
    proposalPrice = 30,
    proposalId = '',
    status = 'NEGOTIATING'
  } = route?.params || {};

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<'contratante' | 'prestador'>('contratante');
  const [myName, setMyName] = useState<string>('Usuário');
  const flatListRef = useRef<FlatList>(null);

  // V2: Alterando a chave para forçar um chat completamente limpo e testar a sincronização bidirecional por papel
  const uniqueId = proposalId || recipientId || 'default';
  const storageKey = `@ContrataAI:chat_v2_${jobId}_${uniqueId}`;

  const isStockOrDummyAvatar = !recipientAvatar || typeof recipientAvatar !== 'string' || recipientAvatar.includes('unsplash.com') || recipientAvatar.includes('dummy');
  const initialLetter = (recipientName ? recipientName.trim().charAt(0) : 'P').toUpperCase();

  useEffect(() => {
    const initChat = async () => {
      try {
        const savedRole = await AsyncStorage.getItem('@ContrataAI:userRole');
        const currentRole = savedRole === 'prestador' ? 'prestador' : 'contratante';
        setMyRole(currentRole);

        const rawUser = await AsyncStorage.getItem('@ContrataAI:userData');
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          const cleanName = parsed.name ? (/^\d+$/.test(parsed.name.trim()) ? (currentRole === 'prestador' ? 'Prestador Silva' : 'Gabriel Contratante') : parsed.name.trim()) : 'Usuário';
          setMyName(cleanName);
        } else {
          setMyName(currentRole === 'prestador' ? 'Prestador Silva' : 'Gabriel Contratante');
        }

        const rawHistory = await AsyncStorage.getItem(storageKey);
        if (rawHistory) {
          try {
            const loaded: ChatMessage[] = JSON.parse(rawHistory);
            const valid = Array.isArray(loaded) ? loaded.filter(m => 
              !m.id?.startsWith('msg_init_') &&
              !m.text?.toLowerCase().includes('vi que você tem interesse na minha proposta') &&
              !m.text?.toLowerCase().includes('você consegue trazer a escada')
            ) : [];
            setMessages(valid);
            if (valid.length > 0) {
              await markChatAsRead(storageKey);
            }
          } catch {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.log('Erro ao carregar mensagens do chat', error);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [storageKey, status, jobTitle, proposalPrice, recipientName]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      senderRole: myRole,
      senderName: myName,
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    if (!customText) setInputText('');

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      await updateChatIndex({
        storageKey,
        recipientId,
        recipientName,
        recipientAvatar,
        jobId,
        jobTitle,
        proposalId,
        status,
        lastMessage: newMsg.text,
        lastMessageTimestamp: newMsg.timestamp,
        senderRole: myRole,
        myRole
      });
    } catch (error) {
      console.log('Erro ao salvar mensagem', error);
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    // Sincronização 100% perfeita baseada no papel
    const isMe = item.senderRole === myRole;
    const showDate = index === 0; // Simulando separador de data na primeira mensagem

    return (
      <View className="mb-2.5">
        {showDate && (
          <View className="self-center bg-[#F1F5F9] px-4 py-1.5 rounded-full my-4 shadow-2xs">
            <Text className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-widest">
              Hoje
            </Text>
          </View>
        )}

        <View
          className="max-w-[82%] px-4 py-3 shadow-xs"
          style={{
            alignSelf: isMe ? 'flex-end' : 'flex-start',
            backgroundColor: isMe ? 'transparent' : '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: isMe ? 20 : 4,
            borderBottomRightRadius: isMe ? 4 : 20,
            ...( !isMe && {
              borderWidth: 1,
              borderColor: '#F1F5F9'
            })
          }}
        >
          {isMe && (
            <LinearGradient
              colors={['#FB923C', '#FB7185']} // Laranja para Rosa/Salmão vibrante
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, {
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 4,
              }]}
            />
          )}

          <Text
            className="text-[15px] leading-relaxed relative z-10"
            style={{ color: isMe ? '#FFFFFF' : '#334155', fontWeight: '500' }}
          >
            {item.text}
          </Text>
          
          <View className="flex-row items-center justify-end mt-1.5 relative z-10 gap-1.5">
            <Text className="text-[10px] font-bold" style={{ color: isMe ? 'rgba(255,255,255,0.9)' : '#94A3B8' }}>
              {item.timestamp}
            </Text>
            {isMe && <CheckCircle2 color="#4ADE80" size={13} strokeWidth={3} />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      
      {/* 1. Header (Design Inspiração colado no teto) */}
      <View className="flex-row items-center justify-between px-3 py-3 bg-white z-10">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-2">
            <ArrowLeft color="#334155" size={22} strokeWidth={2.5} />
          </TouchableOpacity>

          <View className="relative mr-3.5">
            {!isStockOrDummyAvatar ? (
              <Image source={{ uri: recipientAvatar }} className="w-11 h-11 rounded-full bg-slate-200" />
            ) : (
              <View className="w-11 h-11 rounded-full bg-[#F3F4F6] items-center justify-center border border-slate-200">
                <Text className="text-slate-700 font-extrabold text-[20px]">{initialLetter}</Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-white" />
          </View>

          <View className="flex-1">
            <Text className="text-[17px] font-extrabold text-[#1E293B]" numberOfLines={1}>
              {recipientName}
            </Text>
            <Text className="text-[12px] text-[#64748B] font-bold mt-0.5">
              Online agora
            </Text>
          </View>
        </View>

        <TouchableOpacity className="p-2">
          <MoreVertical color="#64748B" size={22} />
        </TouchableOpacity>
      </View>

      {/* 2. Banner Job (Design Inspiração) */}
      <View className="bg-[#FCFCFD] px-5 py-3 border-b border-[#F1F5F9] flex-row items-center justify-between shadow-2xs z-0">
        <View className="flex-row items-center flex-1 pr-4">
          <Briefcase color="#B45309" size={15} strokeWidth={2.5} style={{ marginRight: 8 }} />
          <Text className="text-[13px] font-bold text-[#475569]" numberOfLines={1}>
            Serviço: {jobTitle}
          </Text>
        </View>
        <TouchableOpacity>
          <Text className="text-[12px] font-extrabold text-[#B45309]">Ver detalhes</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Área de Mensagens */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-[#FAFAFA]"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FB923C" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20 px-8">
                <View className="w-16 h-16 bg-[#FFF4ED] rounded-full items-center justify-center mb-3">
                  <MessageSquare color="#FF7A2F" size={28} strokeWidth={2} />
                </View>
                <Text className="text-[#1E293B] font-extrabold text-[15px] mb-1.5 text-center">
                  Inicie a conversa
                </Text>
                <Text className="text-[#64748B] text-center text-xs leading-relaxed max-w-[240px]">
                  Envie uma mensagem abaixo para alinhar os detalhes e fechar o serviço.
                </Text>
              </View>
            }
          />
        )}

        {/* 4. Barra de Input (Pílula Flutuante) */}
        <View className="flex-row items-end px-4 py-3 bg-[#FAFAFA] gap-3 pb-6 pt-1">
          <View className="flex-1 flex-row items-center bg-[#FFFFFF] border border-slate-200/80 rounded-full px-4 py-1.5 shadow-sm">
            <TouchableOpacity className="mr-3 p-1">
              <Paperclip color="#64748B" size={20} strokeWidth={2.2} />
            </TouchableOpacity>
            
            <TextInput
              className="flex-1 text-[15px] text-[#1E293B] max-h-24 min-h-[44px] pt-3 pb-3"
              placeholder={myRole === 'contratante' ? "Digite sua mensagem..." : "Digite sua resposta..."}
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            
            <TouchableOpacity className="ml-3 p-1">
              <Mic color="#64748B" size={20} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
          >
            <LinearGradient
              colors={inputText.trim() ? ['#34D399', '#10B981'] : ['#E2E8F0', '#CBD5E1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="items-center justify-center shadow-md mb-0.5"
              style={{ width: 50, height: 50, borderRadius: 25 }}
            >
              <Send color="#FFFFFF" size={18} strokeWidth={2.5} style={{ marginLeft: inputText.trim() ? -2 : 0 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
