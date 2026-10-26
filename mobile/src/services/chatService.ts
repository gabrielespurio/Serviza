import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatListItem {
  id: string; // chave do storage: @ContrataAI:chat_v2_${jobId}_${uniqueId}
  storageKey: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  jobId: string;
  jobTitle: string;
  proposalId?: string;
  status?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  lastMessageTime: number;
  unreadCount: number;
  isOnline: boolean;
}

export interface UserJobOption {
  id: string;
  title: string;
  category?: string;
  profession?: string;
  status?: string;
  chatsCount?: number;
}

/**
 * Identifica se uma mensagem é um mock / texto fictício gerado pelo sistema
 */
export function isFictitiousMessage(text?: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('vi que você tem interesse na minha proposta') ||
    lower.includes('você consegue trazer a escada') ||
    lower.includes('perfeito, estarei aí às 14h') ||
    lower.includes('tudo bem. pode me mandar o endereço exato') ||
    lower.includes('já enviei a proposta atualizada')
  );
}

/**
 * Identifica se uma entrada de conversa é fictícia / simulação
 */
export function isFictitiousChat(item: Partial<ChatListItem>): boolean {
  if (!item) return true;
  const id = item.id || '';
  const storageKey = item.storageKey || '';
  const name = item.recipientName || '';
  const title = item.jobTitle || '';
  const lastMsg = item.lastMessage || '';

  // IDs e nomes de mocks antigos
  if (['c1', 'c2', 'c3'].includes(id)) return true;
  if (['Carlos Roberto', 'Ana Silva', 'Marcos Almeida'].includes(name)) return true;

  // Mensagens pré-programadas do mock
  if (isFictitiousMessage(lastMsg)) return true;

  // Chat padrão genérico criado automaticamente em testes anteriores
  if ((name === 'Profissional' || name === '') && (title === 'Serviço' || title === '')) {
    return true;
  }

  // Chaves de teste antigas
  if (storageKey === '@ContrataAI:chat_v2_1_1' || storageKey === '@ContrataAI:chat_v2_1_default') {
    if (isFictitiousMessage(lastMsg) || name === 'Profissional') {
      return true;
    }
  }

  return false;
}

/**
 * Salva ou atualiza a entrada de uma conversa no índice @ContrataAI:chatList
 */
export async function updateChatIndex(params: {
  storageKey: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string | null;
  jobId: string;
  jobTitle: string;
  proposalId?: string;
  status?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  senderRole?: 'contratante' | 'prestador';
  myRole?: 'contratante' | 'prestador';
}): Promise<void> {
  try {
    // Se a mensagem for fictícia, não deve entrar no índice
    if (isFictitiousMessage(params.lastMessage)) {
      return;
    }

    const rawList = await AsyncStorage.getItem('@ContrataAI:chatList');
    let list: ChatListItem[] = rawList ? JSON.parse(rawList) : [];

    // Limpa quaisquer mocks residuais
    list = list.filter(item => !isFictitiousChat(item));

    const existingIndex = list.findIndex(
      c => c.storageKey === params.storageKey || (c.jobId === params.jobId && c.recipientId === params.recipientId)
    );

    const isIncoming = params.senderRole && params.myRole && params.senderRole !== params.myRole;

    const chatEntry: ChatListItem = {
      id: params.storageKey,
      storageKey: params.storageKey,
      recipientId: params.recipientId,
      recipientName: params.recipientName,
      recipientAvatar: params.recipientAvatar || undefined,
      jobId: params.jobId,
      jobTitle: params.jobTitle,
      proposalId: params.proposalId,
      status: params.status,
      lastMessage: params.lastMessage,
      lastMessageTimestamp: params.lastMessageTimestamp,
      lastMessageTime: Date.now(),
      unreadCount: isIncoming 
        ? ((existingIndex >= 0 ? list[existingIndex].unreadCount : 0) + 1)
        : (existingIndex >= 0 ? list[existingIndex].unreadCount : 0),
      isOnline: true
    };

    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...chatEntry,
        unreadCount: isIncoming ? list[existingIndex].unreadCount + 1 : list[existingIndex].unreadCount
      };
    } else {
      list.unshift(chatEntry);
    }

    list.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
    await AsyncStorage.setItem('@ContrataAI:chatList', JSON.stringify(list));
  } catch (error) {
    console.error('Erro ao salvar índice de chat:', error);
  }
}

/**
 * Marca uma conversa como lida zerando unreadCount
 */
export async function markChatAsRead(storageKey: string): Promise<void> {
  try {
    const rawList = await AsyncStorage.getItem('@ContrataAI:chatList');
    if (!rawList) return;

    let list: ChatListItem[] = JSON.parse(rawList);
    let changed = false;

    list = list.map(item => {
      if (item.storageKey === storageKey || item.id === storageKey) {
        if (item.unreadCount > 0) {
          changed = true;
          return { ...item, unreadCount: 0 };
        }
      }
      return item;
    });

    if (changed) {
      await AsyncStorage.setItem('@ContrataAI:chatList', JSON.stringify(list));
    }
  } catch (e) {
    console.error('Erro ao marcar chat como lido:', e);
  }
}

/**
 * Carrega todas as conversas REAIS do usuário, varrendo chaves existentes no storage
 * e eliminando quaisquer mensagens ou registros fictícios que possam ter sido salvos.
 */
export async function getRealChats(currentRole: 'contratante' | 'prestador'): Promise<ChatListItem[]> {
  try {
    const rawList = await AsyncStorage.getItem('@ContrataAI:chatList');
    let list: ChatListItem[] = rawList ? JSON.parse(rawList) : [];

    // Limpa itens fictícios do índice
    list = list.filter(item => !isFictitiousChat(item));

    // Carregar vagas para enriquecer títulos de vagas que venham vazios
    const rawJobs = await AsyncStorage.getItem('@ContrataAI:myJobs');
    const userJobs: any[] = rawJobs ? JSON.parse(rawJobs) : [];
    const jobsMap: { [id: string]: string } = {};
    userJobs.forEach(j => {
      if (j.id && j.title) jobsMap[String(j.id)] = j.title;
    });

    // Varrer todas as chaves de chats v2 reais no AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    const chatKeys = allKeys.filter(k => k.startsWith('@ContrataAI:chat_v2_'));

    for (const key of chatKeys) {
      const rawMessages = await AsyncStorage.getItem(key);
      if (!rawMessages) {
        await AsyncStorage.removeItem(key);
        continue;
      }

      try {
        const messages: any[] = JSON.parse(rawMessages);
        if (!Array.isArray(messages)) {
          await AsyncStorage.removeItem(key);
          continue;
        }

        // Filtra mensagens fictícias / geradas automaticamente
        const validMessages = messages.filter(m => 
          !m.id?.startsWith('msg_init_') && 
          !isFictitiousMessage(m.text)
        );

        // Se só existiam mensagens fictícias, remove a chave do storage
        if (validMessages.length === 0) {
          await AsyncStorage.removeItem(key);
          continue;
        }

        // Se limpamos mensagens falsas, atualiza o storage com as reais
        if (validMessages.length !== messages.length) {
          await AsyncStorage.setItem(key, JSON.stringify(validMessages));
        }

        const lastMsg = validMessages[validMessages.length - 1];

        // Chave esperada: @ContrataAI:chat_v2_${jobId}_${uniqueId}
        const keyParts = key.replace('@ContrataAI:chat_v2_', '').split('_');
        const jobId = keyParts[0] || '';
        const uniqueId = keyParts.slice(1).join('_') || '';

        const existingIndex = list.findIndex(c => c.storageKey === key || c.id === key);

        // Contar não lidas recebidas do outro usuário
        let unread = 0;
        for (let i = validMessages.length - 1; i >= 0; i--) {
          if (validMessages[i].senderRole && validMessages[i].senderRole !== currentRole) {
            unread++;
          } else {
            break;
          }
        }

        const resolvedTitle = jobsMap[String(jobId)] || (existingIndex >= 0 ? list[existingIndex].jobTitle : 'Serviço');

        if (existingIndex >= 0) {
          list[existingIndex] = {
            ...list[existingIndex],
            storageKey: key,
            lastMessage: lastMsg.text || list[existingIndex].lastMessage,
            lastMessageTimestamp: lastMsg.timestamp || list[existingIndex].lastMessageTimestamp,
            jobTitle: list[existingIndex].jobTitle && list[existingIndex].jobTitle !== 'Serviço' 
              ? list[existingIndex].jobTitle 
              : resolvedTitle,
            unreadCount: list[existingIndex].unreadCount > 0 ? list[existingIndex].unreadCount : unread,
          };
        } else {
          // Criar novo registro para conversa real encontrada no storage
          const recipientName = lastMsg.senderRole === currentRole ? 'Profissional' : (lastMsg.senderName || 'Profissional');
          
          // Se for nome e vaga genéricos sem contexto real, descarta
          if (recipientName === 'Profissional' && resolvedTitle === 'Serviço' && isFictitiousMessage(lastMsg.text)) {
            continue;
          }

          list.push({
            id: key,
            storageKey: key,
            recipientId: uniqueId || 'chat',
            recipientName,
            recipientAvatar: undefined,
            jobId,
            jobTitle: resolvedTitle,
            proposalId: uniqueId,
            lastMessage: lastMsg.text,
            lastMessageTimestamp: lastMsg.timestamp || 'Hoje',
            lastMessageTime: Date.now(),
            unreadCount: unread,
            isOnline: true
          });
        }
      } catch (err) {
        // Ignora JSON corrompido
      }
    }

    // Filtra novamente qualquer resíduo fictício que possa ter sobrado
    list = list.filter(item => !isFictitiousChat(item));

    // Ordenar por horário mais recente
    list.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

    // Persistir lista limpa e real
    await AsyncStorage.setItem('@ContrataAI:chatList', JSON.stringify(list));

    return list;
  } catch (error) {
    console.error('Erro ao carregar chats reais:', error);
    return [];
  }
}

/**
 * Carrega a lista de vagas reais disponíveis para o usuário filtrar
 */
export async function getUserJobsForFilter(chats: ChatListItem[]): Promise<UserJobOption[]> {
  try {
    const rawJobs = await AsyncStorage.getItem('@ContrataAI:myJobs');
    const myJobs: any[] = rawJobs ? JSON.parse(rawJobs) : [];

    const jobsMap = new Map<string, UserJobOption>();

    // 1. Adiciona vagas do @ContrataAI:myJobs
    myJobs.forEach(j => {
      if (j && j.id && j.title && j.title !== 'Serviço') {
        jobsMap.set(String(j.id), {
          id: String(j.id),
          title: j.title,
          category: j.categoryLabel || j.category || j.profession,
          profession: j.profession || j.title,
          status: j.status || 'Ativa',
          chatsCount: 0
        });
      }
    });

    // 2. Adiciona vagas que estejam presentes em conversas ativas reais
    chats.forEach(c => {
      if (c.jobId && c.jobTitle && c.jobTitle !== 'Serviço') {
        const key = String(c.jobId);
        if (jobsMap.has(key)) {
          const item = jobsMap.get(key)!;
          item.chatsCount = (item.chatsCount || 0) + 1;
        } else {
          jobsMap.set(key, {
            id: key,
            title: c.jobTitle,
            category: 'Serviço',
            status: 'Negociação',
            chatsCount: 1
          });
        }
      }
    });

    return Array.from(jobsMap.values());
  } catch (error) {
    console.error('Erro ao carregar vagas para filtro:', error);
    return [];
  }
}
