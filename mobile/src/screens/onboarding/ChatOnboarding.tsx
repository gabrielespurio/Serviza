import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Keyboard,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Check, Briefcase, User, Search, Sparkles, Wrench, ChevronRight, Camera, ImagePlus } from '../../components/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { TypingIndicator } from '../../components/TypingIndicator';
import { JOB_CATEGORIES, JobCategory } from '../../data/jobCategories';
import { CategoryIcon } from '../../components/CategoryIcon';
import { maskCPF, maskCNPJ, isValidCPF, isValidCNPJ } from '../../utils/validators';

// ====== CONSTANTS ======

const ZURI_AVATAR = require('../../../assets/zuri.png');

const STEPS_CONFIG = [
  { label: 'Dados Pessoais', shortLabel: 'Dados' },
  { label: 'Endereço', shortLabel: 'Endereço' },
  { label: 'Objetivo', shortLabel: 'Objetivo' },
  { label: 'Preferências', shortLabel: 'Prefs' },
];

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  imageUri?: string;
}

// ====== COMPONENT ======

export default function ChatOnboarding({ route, navigation }: any) {
  const { baseData } = route.params || {};
  const insets = useSafeAreaInsets();

  // Messages start EMPTY — Zuri will "type" them in
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Step tracking
  // 1: Nome, 2: Sobrenome, 2.5: PF/PJ, 3: CPF, 3.1: CNPJ, 3.5: Foto
  // 4: CEP, 5: Confirmação CEP, 5.1-5.4: Endereço Manual, 5.5: Seleção de Papel
  // 6: Categorias/Profissões, 7: Bio Prestador
  const [step, setStep] = useState(0); // Start at 0 = initial loading
  const [progressStep, setProgressStep] = useState(0); // 0-3 for the progress bar
  const [inputValue, setInputValue] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState<any>({});
  
  const [selectedRole, setSelectedRole] = useState<'CONTRATANTE' | 'PRESTADOR' | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('todos');
  const [professionSearchQuery, setProfessionSearchQuery] = useState('');
  const [bio, setBio] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [personType, setPersonType] = useState<'PF' | 'PJ' | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ====== INITIAL TYPING SEQUENCE ======
  useEffect(() => {
    // Animate header fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Sequence: typing → msg1 → typing → msg2
    const timer1 = setTimeout(() => setIsTyping(true), 600);
    const timer2 = setTimeout(() => {
      setIsTyping(false);
      setMessages([{ id: '1', sender: 'bot', text: 'Olá! Eu sou a Zuri, assistente virtual da Serviza. 👋' }]);
    }, 2000);
    const timer3 = setTimeout(() => setIsTyping(true), 2400);
    const timer4 = setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: '2', sender: 'bot', text: 'Vou te ajudar a configurar seu perfil em poucos passos. Qual o seu primeiro nome?' }]);
      setStep(1);
    }, 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // ====== SCROLL TO BOTTOM ======
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, step, scrollToBottom]);

  // ====== KEYBOARD LISTENER — force scroll when keyboard appears ======
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    });
    return () => sub.remove();
  }, []);

  // ====== BOT MESSAGE WITH TYPING ======
  const addBotMessage = useCallback((text: string, delay = 1200) => {
    setIsTyping(true);
    scrollToBottom();
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: `bot-${Date.now()}-${Math.random()}`, sender: 'bot', text }]);
      scrollToBottom();
    }, delay);
  }, [scrollToBottom]);

  const addUserMessage = useCallback((text: string, imageUri?: string) => {
    setMessages(prev => [...prev, { id: `user-${Date.now()}-${Math.random()}`, sender: 'user', text, imageUri }]);
    scrollToBottom();
  }, [scrollToBottom]);

  // ====== PROGRESS STEP MAPPING ======
  useEffect(() => {
    if (step >= 1 && step <= 3.5) setProgressStep(0);
    else if (step >= 4 && step <= 5.4) setProgressStep(1);
    else if (step === 5.5) setProgressStep(2);
    else if (step >= 6) setProgressStep(3);
  }, [step]);

  // ====== PROFESSIONS FILTER ======
  const filteredProfessions = useMemo(() => {
    let list: { category: string; profession: string }[] = [];
    
    JOB_CATEGORIES.forEach(cat => {
      if (activeCategoryFilter === 'todos' || activeCategoryFilter === cat.id) {
        cat.professions.forEach(prof => {
          list.push({ category: cat.label, profession: prof });
        });
      }
    });

    if (professionSearchQuery.trim()) {
      const q = professionSearchQuery.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      list = list.filter(item => {
        const norm = item.profession.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return norm.includes(q);
      });
    }

    return list;
  }, [activeCategoryFilter, professionSearchQuery]);

  // ====== FILTERED CATEGORIES FOR CONTRATANTE ======
  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return JOB_CATEGORIES;
    const q = categorySearchQuery.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return JOB_CATEGORIES.filter(cat => {
      const normLabel = cat.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const hasMatchingProf = cat.professions.some(p => 
        p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
      );
      return normLabel.includes(q) || hasMatchingProf;
    });
  }, [categorySearchQuery]);

  // ====== HANDLE USER TEXT INPUT ======
  const handleSendText = async () => {
    if (!inputValue.trim()) return;
    const val = inputValue.trim();
    addUserMessage(val);
    setInputValue('');
    Keyboard.dismiss();

    if (step === 1) {
      setFirstName(val);
      setStep(2);
      addBotMessage('E o seu sobrenome?');
    } else if (step === 2) {
      setLastName(val);
      setStep(2.5);
      addBotMessage(`Prazer, ${firstName} ${val}! 😊 Para manter nossa comunidade segura, você é Pessoa Física ou Jurídica?`);
    } else if (step === 3) {
      // CPF - aplicar validação
      const cleanCpf = val.replace(/\D/g, '');
      if (cleanCpf.length < 11) {
        addBotMessage('O CPF precisa ter 11 dígitos. Por favor, digite novamente:');
        return;
      }
      if (!isValidCPF(cleanCpf)) {
        addBotMessage('Esse CPF não é válido. Verifique e digite novamente:');
        return;
      }
      setCpf(cleanCpf);
      setStep(3.5);
      addBotMessage(`Ótimo, ${firstName}! 📸 Agora, que tal adicionar uma foto de perfil? Usuários com foto têm até 3x mais chances de serem contratados na plataforma!`);
    } else if (step === 3.1) {
      // CNPJ - aplicar validação
      const cleanCnpj = val.replace(/\D/g, '');
      if (cleanCnpj.length < 14) {
        addBotMessage('O CNPJ precisa ter 14 dígitos. Por favor, digite novamente:');
        return;
      }
      if (!isValidCNPJ(cleanCnpj)) {
        addBotMessage('Esse CNPJ não é válido. Verifique e digite novamente:');
        return;
      }
      setCpf(cleanCnpj); // Armazena no mesmo state
      setStep(3.5);
      addBotMessage(`Ótimo, ${firstName}! 📸 Agora, que tal adicionar uma foto de perfil? Usuários com foto têm até 3x mais chances de serem contratados na plataforma!`);
    } else if (step === 4) {
      setCep(val);
      setIsTyping(true);
      try {
        const cleanCep = val.replace(/[^0-9]/g, '');
        const res = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (res.data.erro) throw new Error();
        setAddress({
          rua: res.data.logradouro,
          bairro: res.data.bairro,
          estado: res.data.uf,
          cidade: res.data.localidade
        });
        setIsTyping(false);
        setStep(5);
        addBotMessage(`Encontrei: ${res.data.logradouro}, ${res.data.bairro}, ${res.data.localidade} - ${res.data.uf}. Está correto? 📍`);
      } catch(e) {
        setIsTyping(false);
        setStep(5.1);
        addBotMessage('Não consegui localizar este CEP. Sem problemas! Qual o nome da sua rua?');
      }
    } else if (step === 5.1) {
      setAddress({...address, rua: val});
      setStep(5.2);
      addBotMessage('Qual o nome do seu bairro?');
    } else if (step === 5.2) {
      setAddress({...address, bairro: val});
      setStep(5.3);
      addBotMessage('Qual a sigla do seu Estado? (ex: SP)');
    } else if (step === 5.3) {
      setAddress({...address, estado: val});
      setStep(5.4);
      addBotMessage('E por fim, qual o número da residência?');
    } else if (step === 5.4) {
      setAddress({...address, numero: val});
      setStep(5.5);
      addBotMessage('Endereço salvo com sucesso! 🏠 Agora me conta, qual é o seu objetivo principal na plataforma? Você quer contratar serviços ou deseja trabalhar oferecendo seus serviços?');
    } else if (step === 7) {
      setBio(val);
      finishSetup('PRESTADOR', selectedProfessions, val);
    }
  };

  // ====== PHOTO SELECTION (Step 3.5) ======
  const handlePhotoOption = async (option: 'camera' | 'library' | 'skip') => {
    if (option === 'skip') {
      addUserMessage('Pular esta etapa');
      setStep(4);
      addBotMessage('Tudo bem! Você pode adicionar uma foto depois. Agora os dados de endereço. Qual é o seu CEP? (só números)');
      return;
    }

    try {
      let result: ImagePicker.ImagePickerResult;

      if (option === 'camera') {
        // Solicitar permissão de câmera
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          addBotMessage('Precisamos da permissão da câmera para tirar a foto. Tente novamente ou selecione da galeria.');
          return;
        }
        addUserMessage('📷 Tirar foto');
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.6,
          exif: false,
        });
      } else {
        // Em versões recentes do iOS e Android, o Photo Picker nativo não requer permissão explícita
        // de leitura de disco, pois ele roda isolado. Tentar pedir permissão pode retornar false automaticamente.
        addUserMessage('🖼️ Abrir galeria');
        try {
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
            exif: false,
          });
        } catch (e) {
          addBotMessage('Não foi possível abrir a galeria. Tente novamente ou pule esta etapa.');
          return;
        }
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);
        
        // Enviar a imagem como mensagem no chat
        addUserMessage('Minha foto de perfil', uri);
        
        // Salvar imediatamente no AsyncStorage para disponibilizar no perfil
        await AsyncStorage.setItem('@ContrataAI:avatarUrl', uri);
        
        setStep(4);
        addBotMessage('Ficou ótima a foto! 🎉 Seu perfil já está mais completo. Agora os dados de endereço. Qual é o seu CEP? (só números)');
      } else {
        // Usuário cancelou o picker — manter no step 3.5
        addBotMessage('Você cancelou a seleção. Deseja tentar novamente ou pular esta etapa?');
      }
    } catch (error) {
      addBotMessage('Ocorreu um erro ao processar a foto. Tente novamente ou pule esta etapa.');
    }
  };

  // ====== CEP CONFIRMATION ======
  const handleCepAction = (action: 'sim' | 'nao') => {
    if (action === 'sim') {
      addUserMessage('Sim, está correto ✅');
      setStep(5.4);
      addBotMessage('Ótimo! Qual o número da sua residência?');
    } else {
      addUserMessage('Não, quero digitar manualmente');
      setStep(5.1);
      addBotMessage('Sem problemas. Qual o nome da sua rua?');
    }
  };

  // ====== ROLE SELECTION ======
  const handleRoleSelection = (role: 'CONTRATANTE' | 'PRESTADOR') => {
    setSelectedRole(role);
    if (role === 'CONTRATANTE') {
      addUserMessage('Quero Contratar');
      setStep(6);
      addBotMessage('Excelente! 🎯 Para terminarmos, selecione abaixo as categorias de serviço que você mais tem interesse em contratar:');
    } else {
      addUserMessage('Quero Trabalhar');
      setStep(6);
      addBotMessage('Que incrível ter você conosco! 🌟 No plano gratuito, selecione a profissão principal em que você atua:');
    }
  };

  // ====== CATEGORY / PROFESSION TOGGLES ======
  const toggleCategory = (catLabel: string) => {
    if (selectedCategories.includes(catLabel)) {
      setSelectedCategories(prev => prev.filter(c => c !== catLabel));
    } else if (selectedCategories.length < 3) {
      setSelectedCategories(prev => [...prev, catLabel]);
    }
  };

  const toggleProfession = (prof: string) => {
    if (selectedProfessions.includes(prof)) {
      setSelectedProfessions(prev => prev.filter(p => p !== prof));
    } else if (selectedProfessions.length < 1) {
      // Plano gratuito: limite de 1 profissão
      setSelectedProfessions(prev => [...prev, prof]);
    }
  };

  const handleProceedFromProfessions = () => {
    if (selectedProfessions.length === 0) {
      alert('Selecione pelo menos uma profissão.');
      return;
    }
    addUserMessage(`Atuo como: ${selectedProfessions.join(', ')}`);
    setStep(7);
    addBotMessage(`Ótima escolha! Agora conte um pouco sobre sua experiência em ${selectedProfessions[0]}. Há quanto tempo atua? Tem equipamentos próprios? (Esse texto aparecerá no seu perfil!)`);
  };

  // ====== FINISH SETUP ======
  const finishSetup = async (
    roleOverride?: 'CONTRATANTE' | 'PRESTADOR',
    skillsOverride?: string[],
    bioOverride?: string
  ) => {
    const finalRole = roleOverride || selectedRole || 'CONTRATANTE';

    if (finalRole === 'CONTRATANTE' && selectedCategories.length === 0) {
      alert('Selecione pelo menos uma categoria.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        email: baseData?.email || 'user@email.com',
        password: baseData?.password || '123456',
        name: `${firstName} ${lastName}`,
        role: finalRole,
        skills: finalRole === 'CONTRATANTE' ? selectedCategories : (skillsOverride || selectedProfessions),
        description: bioOverride || bio || '',
      };
      
      try {
        await api.post('/auth/register', payload);
      } catch (err: any) {}

      const profileData = {
        name: payload.name,
        email: payload.email,
        phone: baseData?.phone || '',
        role: finalRole,
        skills: payload.skills,
        description: payload.description,
        city: address.cidade ? `${address.cidade}, ${address.estado}` : 'São Paulo, SP'
      };

      // Salvar dados do perfil atual
      await AsyncStorage.setItem('@ContrataAI:userData', JSON.stringify(profileData));
      
      // CHAVE PERMANENTE: Salvar perfil vinculado ao email — nunca é apagado pelo login/logout
      // Isso garante que ao fazer login novamente, o app saiba qual role o usuário escolheu
      const emailKey = payload.email.toLowerCase().trim();
      await AsyncStorage.setItem(`@ContrataAI:profile:${emailKey}`, JSON.stringify(profileData));

      // Salvar avatar vinculado ao email para restauração futura após logout
      if (avatarUri) {
        await AsyncStorage.setItem(`@ContrataAI:avatar:${emailKey}`, avatarUri);
      }

      if (finalRole === 'PRESTADOR') {
        await AsyncStorage.setItem('@ContrataAI:userRole', 'prestador');
        navigation.replace('MainPrestador');
      } else {
        await AsyncStorage.setItem('@ContrataAI:userRole', 'contratante');
        navigation.replace('MainContratante');
      }
    } catch(e) {
      alert('Erro ao concluir configuração.');
    } finally {
      setLoading(false);
    }
  };

  // ====== RENDER ======
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* ====== HEADER PREMIUM ====== */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={{ 
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
          }}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
            >
              <ArrowLeft color="#1E293B" size={22} />
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5 }}>Serviza</Text>
              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Assistente Virtual Zuri</Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {/* ====== PROGRESS BAR ====== */}
          <View style={{ 
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12,
            backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
          }}>
            {STEPS_CONFIG.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: i < progressStep ? '#22C55E' : i === progressStep ? '#FF7A2F' : '#E2E8F0',
                  justifyContent: 'center', alignItems: 'center'
                }}>
                  {i < progressStep ? (
                    <Check color="#FFF" size={14} strokeWidth={3} />
                  ) : (
                    <Text style={{ 
                      fontSize: 12, fontWeight: '700', 
                      color: i === progressStep ? '#FFFFFF' : '#94A3B8' 
                    }}>{i + 1}</Text>
                  )}
                </View>
                {i < STEPS_CONFIG.length - 1 && (
                  <View style={{ 
                    flex: 1, height: 2, marginHorizontal: 4,
                    backgroundColor: i < progressStep ? '#22C55E' : '#E2E8F0'
                  }} />
                )}
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 6, backgroundColor: '#FFFFFF' }}>
            {STEPS_CONFIG.map((s, i) => (
              <Text key={i} style={{ 
                fontSize: 9, fontWeight: '700', textAlign: 'center',
                color: i === progressStep ? '#FF7A2F' : i < progressStep ? '#22C55E' : '#94A3B8',
                width: `${100 / STEPS_CONFIG.length}%` as any
              }}>{s.shortLabel}</Text>
            ))}
          </View>
        </Animated.View>

        {/* ====== CHAT AREA ====== */}
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom()}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={{ flexDirection: 'row', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: 14, alignItems: 'flex-end' }}>
              {/* Zuri Avatar for bot messages */}
              {msg.sender === 'bot' && (
                <View style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, marginBottom: 2, overflow: 'hidden', borderWidth: 1.5, borderColor: '#FF7A2F' }}>
                  <Image 
                    source={ZURI_AVATAR} 
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                    resizeMode="cover"
                  />
                </View>
              )}
              <View 
                style={{
                  maxWidth: '75%',
                  padding: msg.imageUri ? 4 : 14,
                  borderRadius: 20,
                  ...(msg.sender === 'user' 
                    ? { backgroundColor: msg.imageUri ? 'transparent' : '#FF7A2F', borderBottomRightRadius: msg.imageUri ? 20 : 4 }
                    : { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F1F5F9',
                        ...Platform.select({
                          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
                          android: { elevation: 2 },
                        })
                      }
                  ),
                }}
              >
                {msg.imageUri ? (
                  <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: '#FF7A2F' }}>
                    <Image source={{ uri: msg.imageUri }} style={{ width: 160, height: 160 }} resizeMode="cover" />
                  </View>
                ) : (
                  <Text style={{ 
                    fontSize: 15, lineHeight: 22, fontWeight: '500',
                    color: msg.sender === 'user' ? '#FFFFFF' : '#1E293B' 
                  }}>
                    {msg.text}
                  </Text>
                )}
              </View>

              {/* Avatar do Usuário para mensagens dele */}
              {msg.sender === 'user' && avatarUri && (
                <View style={{ width: 32, height: 32, borderRadius: 16, marginLeft: 8, marginBottom: 2, overflow: 'hidden', borderWidth: 1.5, borderColor: '#FFFFFF', backgroundColor: '#E2E8F0', elevation: 1 }}>
                  <Image 
                    source={{ uri: avatarUri }} 
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <View style={{ flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, marginBottom: 2, overflow: 'hidden', borderWidth: 1.5, borderColor: '#FF7A2F' }}>
                <Image 
                  source={ZURI_AVATAR} 
                  style={{ width: 32, height: 32, borderRadius: 16 }}
                  resizeMode="cover"
                />
              </View>
              <View style={{ 
                backgroundColor: '#FFFFFF', borderRadius: 20, borderBottomLeftRadius: 4, 
                padding: 14, borderWidth: 1, borderColor: '#F1F5F9' 
              }}>
                <TypingIndicator />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ====== BOTTOM ACTION AREA ====== */}
        <View style={{ 
          backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 12),
          borderTopWidth: 1, borderTopColor: '#F1F5F9' 
        }}>
          
          {/* Normal Text Inputs */}
          {(step === 1 || step === 2 || step === 3 || step === 3.1 || step === 4 || step === 5.1 || step === 5.2 || step === 5.3 || step === 5.4 || step === 7) && !isTyping && (
            <View>
              {step === 4 && (
                <TouchableOpacity 
                  style={{ alignSelf: 'center', marginBottom: 10, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' }}
                  onPress={() => {
                    addUserMessage('Não sei meu CEP');
                    setStep(5.1);
                    addBotMessage('Sem problemas! Qual o nome da sua rua?');
                  }}
                >
                  <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500' }}>Não sei meu CEP</Text>
                </TouchableOpacity>
              )}
              
              <View style={{ 
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', 
                borderRadius: 28, paddingHorizontal: 16, paddingVertical: 4,
                borderWidth: 1.5, borderColor: '#E2E8F0' 
              }}>
                <TextInput
                  ref={inputRef}
                  style={{ flex: 1, height: 48, fontSize: 15, color: '#1E293B' }}
                  placeholder={step === 7 ? "Conte sobre sua experiência..." : step === 3 ? "000.000.000-00" : step === 3.1 ? "00.000.000/0000-00" : "Escreva aqui..."}
                  placeholderTextColor="#94A3B8"
                  onSubmitEditing={handleSendText}
                  keyboardType={(step === 3 || step === 3.1 || step === 4) ? "numeric" : "default"}
                  returnKeyType="send"
                  value={inputValue}
                  onChangeText={(text) => {
                    if (step === 3) {
                      setInputValue(maskCPF(text));
                    } else if (step === 3.1) {
                      setInputValue(maskCNPJ(text));
                    } else {
                      setInputValue(text);
                    }
                  }}
                />
                <TouchableOpacity 
                  style={{ 
                    width: 42, height: 42, borderRadius: 21, 
                    backgroundColor: inputValue.trim() ? '#FF7A2F' : '#E2E8F0',
                    justifyContent: 'center', alignItems: 'center', marginLeft: 8 
                  }}
                  onPress={handleSendText}
                  disabled={!inputValue.trim()}
                >
                  <Send color="white" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2.5: PF ou PJ */}
          {step === 2.5 && !isTyping && (
            <View style={{ gap: 10 }}>
              <TouchableOpacity 
                style={{ width: '100%', backgroundColor: '#FF7A2F', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => {
                  addUserMessage('Pessoa Física');
                  setStep(3);
                  addBotMessage('Certo! Qual o seu CPF? (apenas números)');
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Pessoa Física</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ width: '100%', backgroundColor: '#F1F5F9', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}
                onPress={() => {
                  addUserMessage('Pessoa Jurídica');
                  setStep(3.1);
                  addBotMessage('Certo! Qual o seu CNPJ? (apenas números)');
                }}
              >
                <Text style={{ color: '#1E293B', fontWeight: '700', fontSize: 15 }}>Pessoa Jurídica</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3.5: Photo Upload */}
          {step === 3.5 && !isTyping && (
            <View style={{ gap: 10 }}>
              {/* Preview da foto se já selecionou */}
              {avatarUri && (
                <View style={{ alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ 
                    width: 80, height: 80, borderRadius: 40, 
                    borderWidth: 3, borderColor: '#FF7A2F', overflow: 'hidden',
                    ...Platform.select({
                      ios: { shadowColor: '#FF7A2F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 },
                      android: { elevation: 4 },
                    })
                  }}>
                    <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                  <Text style={{ fontSize: 12, color: '#22C55E', fontWeight: '700', marginTop: 6 }}>✓ Foto selecionada!</Text>
                </View>
              )}

              <TouchableOpacity 
                activeOpacity={0.88}
                onPress={() => handlePhotoOption('library')}
                style={{ 
                  width: '100%', backgroundColor: '#FF7A2F', borderRadius: 16, height: 54,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                <ImagePlus color="#FFFFFF" size={20} strokeWidth={2.4} />
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Abrir Biblioteca de Fotos</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.88}
                onPress={() => handlePhotoOption('camera')}
                style={{ 
                  width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, height: 54, borderWidth: 1.5, borderColor: '#E2E8F0',
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                <Camera color="#1E293B" size={20} strokeWidth={2.4} />
                <Text style={{ color: '#1E293B', fontWeight: '700', fontSize: 15 }}>Tirar Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.88}
                onPress={() => handlePhotoOption('skip')}
                style={{ 
                  width: '100%', backgroundColor: '#F8FAFC', borderRadius: 16, height: 48,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <Text style={{ color: '#94A3B8', fontWeight: '600', fontSize: 13 }}>Pular esta etapa</Text>
                <Text style={{ color: '#CBD5E1', fontWeight: '500', fontSize: 11 }}>(Não recomendado)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 5: CEP Confirmation */}
          {step === 5 && !isTyping && (
            <View style={{ gap: 10 }}>
              <TouchableOpacity 
                style={{ width: '100%', backgroundColor: '#22C55E', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => handleCepAction('sim')}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Sim, está correto ✅</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ width: '100%', backgroundColor: '#F1F5F9', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => handleCepAction('nao')}
              >
                <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 15 }}>Não, digitar manualmente</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 5.5: Role Selection */}
          {step === 5.5 && !isTyping && (
            <View style={{ gap: 10 }}>
              <TouchableOpacity 
                activeOpacity={0.88}
                onPress={() => handleRoleSelection('PRESTADOR')}
                style={{ 
                  width: '100%', backgroundColor: '#FF7A2F', borderRadius: 16, 
                  padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' 
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Briefcase color="#FFFFFF" size={22} strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 17 }}>Quero Trabalhar</Text>
                    <Text style={{ color: '#FFE0C2', fontSize: 12, fontWeight: '500' }}>Oferecer meus serviços como profissional</Text>
                  </View>
                </View>
                <Sparkles color="#FFFFFF" size={20} />
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.88}
                onPress={() => handleRoleSelection('CONTRATANTE')}
                style={{ 
                  width: '100%', backgroundColor: '#F1F5F9', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0',
                  padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' 
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <User color="#1E293B" size={22} strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text style={{ color: '#1E293B', fontWeight: '800', fontSize: 17 }}>Quero Contratar</Text>
                    <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500' }}>Encontrar profissionais para minha demanda</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 6 CONTRATANTE — Full Categories */}
          {step === 6 && selectedRole === 'CONTRATANTE' && !isTyping && (
            <View>
              {/* Search bar */}
              <View style={{ 
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', 
                borderRadius: 14, paddingHorizontal: 12, marginBottom: 10,
                borderWidth: 1, borderColor: '#E2E8F0' 
              }}>
                <Search color="#94A3B8" size={18} />
                <TextInput
                  style={{ flex: 1, height: 40, fontSize: 14, color: '#1E293B', marginLeft: 8 }}
                  placeholder="Buscar categoria..."
                  placeholderTextColor="#94A3B8"
                  value={categorySearchQuery}
                  onChangeText={setCategorySearchQuery}
                />
              </View>

              {/* Categories grid */}
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {filteredCategories.map(cat => {
                    const isSelected = selectedCategories.includes(cat.label);
                    return (
                      <TouchableOpacity 
                        key={cat.id}
                        onPress={() => toggleCategory(cat.label)}
                        style={{ 
                          flexDirection: 'row', alignItems: 'center',
                          paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
                          borderWidth: 1.5,
                          backgroundColor: isSelected ? '#FFF4ED' : '#FFFFFF',
                          borderColor: isSelected ? '#FF7A2F' : '#E2E8F0'
                        }}
                      >
                        <View style={{ 
                          width: 28, height: 28, borderRadius: 8, marginRight: 8,
                          backgroundColor: isSelected ? '#FF7A2F' : cat.bgColor,
                          justifyContent: 'center', alignItems: 'center'
                        }}>
                          {isSelected ? (
                            <Check color="#FFF" size={14} strokeWidth={3} />
                          ) : (
                            <CategoryIcon category={cat.id} color={cat.color} size={14} />
                          )}
                        </View>
                        <Text style={{ 
                          fontSize: 13, fontWeight: isSelected ? '700' : '600', 
                          color: isSelected ? '#FF7A2F' : '#334155'
                        }}>{cat.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600', textAlign: 'center', marginTop: 8, marginBottom: 8 }}>
                {selectedCategories.length}/3 categorias selecionadas
              </Text>

              <TouchableOpacity 
                style={{ 
                  width: '100%', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
                  backgroundColor: selectedCategories.length > 0 ? '#22C55E' : '#E2E8F0',
                  flexDirection: 'row'
                }}
                onPress={() => finishSetup('CONTRATANTE')}
                disabled={loading || selectedCategories.length === 0}
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16, marginRight: 8 }}>Concluir e Entrar</Text>
                    <ChevronRight color="#FFFFFF" size={18} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 6 PRESTADOR — Professions */}
          {step === 6 && selectedRole === 'PRESTADOR' && !isTyping && (
            <View style={{ maxHeight: 380 }}>
              <View style={{ 
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', 
                borderRadius: 14, paddingHorizontal: 12, marginBottom: 8,
                borderWidth: 1, borderColor: '#E2E8F0' 
              }}>
                <Search color="#94A3B8" size={18} />
                <TextInput
                  value={professionSearchQuery}
                  onChangeText={setProfessionSearchQuery}
                  placeholder="Buscar profissão (ex: garçom, eletricista...)"
                  placeholderTextColor="#94A3B8"
                  style={{ flex: 1, height: 40, fontSize: 14, color: '#1E293B', marginLeft: 8 }}
                />
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 8, maxHeight: 36 }}
                contentContainerStyle={{ gap: 8 }}
              >
                <TouchableOpacity
                  onPress={() => setActiveCategoryFilter('todos')}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                    backgroundColor: activeCategoryFilter === 'todos' ? '#1E293B' : '#FFFFFF',
                    borderWidth: 1, borderColor: activeCategoryFilter === 'todos' ? '#1E293B' : '#E2E8F0'
                  }}
                >
                  <Text style={{ 
                    fontSize: 12, fontWeight: '700', 
                    color: activeCategoryFilter === 'todos' ? '#FFFFFF' : '#64748B' 
                  }}>Todas</Text>
                </TouchableOpacity>
                {JOB_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setActiveCategoryFilter(cat.id)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                      backgroundColor: activeCategoryFilter === cat.id ? '#FF7A2F' : '#FFFFFF',
                      borderWidth: 1, borderColor: activeCategoryFilter === cat.id ? '#FF7A2F' : '#E2E8F0'
                    }}
                  >
                    <Text style={{ 
                      fontSize: 12, fontWeight: '700', 
                      color: activeCategoryFilter === cat.id ? '#FFFFFF' : '#64748B' 
                    }}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6 }}>
                Selecione sua profissão principal ({selectedProfessions.length}/1):
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '500', color: '#94A3B8', marginBottom: 6 }}>
                🔓 Faça upgrade do seu plano para selecionar mais profissões
              </Text>
              <ScrollView 
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                style={{ marginBottom: 8, maxHeight: 140, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' }}
              >
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {filteredProfessions.map((item, idx) => {
                    const isSel = selectedProfessions.includes(item.profession);
                    return (
                      <TouchableOpacity
                        key={`${item.profession}-${idx}`}
                        onPress={() => toggleProfession(item.profession)}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
                          backgroundColor: isSel ? '#FF7A2F' : '#FFFFFF',
                          borderWidth: 1, borderColor: isSel ? '#FF7A2F' : '#E2E8F0'
                        }}
                      >
                        {isSel && <Check color="#FFF" size={13} strokeWidth={3} style={{ marginRight: 4 }} />}
                        <Text style={{ 
                          fontSize: 13, fontWeight: isSel ? '700' : '500', 
                          color: isSel ? '#FFFFFF' : '#334155' 
                        }}>{item.profession}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleProceedFromProfessions}
                disabled={selectedProfessions.length === 0}
                style={{
                  width: '100%', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
                  backgroundColor: selectedProfessions.length > 0 ? '#FF7A2F' : '#E2E8F0',
                  flexDirection: 'row'
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Continuar e Falar da Experiência</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading/Initial state */}
          {step === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '500' }}>Zuri está preparando tudo para você...</Text>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
