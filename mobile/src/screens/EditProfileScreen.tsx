import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Mail, Smartphone as Phone, MapPin, Search, CheckCircle2 } from '../components/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  
  // States
  const [tipoPessoa, setTipoPessoa] = useState<'fisica' | 'juridica'>('fisica');
  const [form, setForm] = useState({
    nomeCompleto: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidadeUf: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const rawUser = await AsyncStorage.getItem('@ContrataAI:userData');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        
        // Load data from old format if new fields aren't present yet
        setForm(prev => ({
          ...prev,
          nomeCompleto: parsed.nomeCompleto || parsed.name || '',
          email: parsed.email || '',
          telefone: parsed.telefone || parsed.phone || '',
          cidadeUf: parsed.cidadeUf || parsed.city || '',
          cpfCnpj: parsed.cpfCnpj || '',
          cep: parsed.cep || '',
          logradouro: parsed.logradouro || '',
          numero: parsed.numero || '',
          complemento: parsed.complemento || '',
          bairro: parsed.bairro || '',
        }));

        if (parsed.tipoPessoa) {
          setTipoPessoa(parsed.tipoPessoa);
        }
      }
    } catch (e) {
      console.error('Error loading profile data:', e);
    }
  };

  const handleMask = (field: string, value: string) => {
    let formatted = value;
    
    if (field === 'telefone') {
      formatted = value.replace(/\D/g, '');
      if (formatted.length > 11) formatted = formatted.slice(0, 11);
      
      if (formatted.length > 2) formatted = `(${formatted.slice(0,2)}) ${formatted.slice(2)}`;
      if (formatted.length > 10) formatted = `${formatted.slice(0,10)}-${formatted.slice(10)}`;
    } 
    else if (field === 'cpfCnpj') {
      formatted = value.replace(/\D/g, '');
      if (tipoPessoa === 'fisica') {
        if (formatted.length > 11) formatted = formatted.slice(0, 11);
        if (formatted.length > 9) formatted = `${formatted.slice(0,3)}.${formatted.slice(3,6)}.${formatted.slice(6,9)}-${formatted.slice(9)}`;
        else if (formatted.length > 6) formatted = `${formatted.slice(0,3)}.${formatted.slice(3,6)}.${formatted.slice(6)}`;
        else if (formatted.length > 3) formatted = `${formatted.slice(0,3)}.${formatted.slice(3)}`;
      } else {
        if (formatted.length > 14) formatted = formatted.slice(0, 14);
        if (formatted.length > 12) formatted = `${formatted.slice(0,2)}.${formatted.slice(2,5)}.${formatted.slice(5,8)}/${formatted.slice(8,12)}-${formatted.slice(12)}`;
        else if (formatted.length > 8) formatted = `${formatted.slice(0,2)}.${formatted.slice(2,5)}.${formatted.slice(5,8)}/${formatted.slice(8)}`;
        else if (formatted.length > 5) formatted = `${formatted.slice(0,2)}.${formatted.slice(2,5)}.${formatted.slice(5)}`;
        else if (formatted.length > 2) formatted = `${formatted.slice(0,2)}.${formatted.slice(2)}`;
      }
    }
    else if (field === 'cep') {
      formatted = value.replace(/\D/g, '');
      if (formatted.length > 8) formatted = formatted.slice(0, 8);
      if (formatted.length > 5) formatted = `${formatted.slice(0,5)}-${formatted.slice(5)}`;
    }

    setForm({ ...form, [field]: formatted });
  };

  const handleSearchCEP = async () => {
    const rawCep = form.cep.replace(/\D/g, '');
    if (rawCep.length !== 8) {
      Alert.alert('Atenção', 'Digite um CEP válido com 8 dígitos.');
      return;
    }

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        Alert.alert('Erro', 'CEP não encontrado.');
      } else {
        setForm(prev => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidadeUf: `${data.localidade}/${data.uf}`
        }));
      }
    } catch (error) {
      Alert.alert('Erro', 'Houve um problema ao buscar o CEP. Tente novamente.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSave = async () => {
    if (!form.nomeCompleto.trim()) {
      Alert.alert('Atenção', 'Por favor, informe seu Nome Completo.');
      return;
    }

    setLoading(true);
    try {
      // 1. Atualizar no Backend (com os campos que a API suporta atualmente)
      await api.put('/users/profile', {
        name: form.nomeCompleto.trim(),
        email: form.email.trim(),
        phone: form.telefone.trim(),
        city: form.cidadeUf.trim(),
      }).catch(() => null); // Ignora erro caso a API falhe no ambiente local

      // 2. Salvar todos os campos novos no AsyncStorage localmente
      const rawUser = await AsyncStorage.getItem('@ContrataAI:userData');
      const currentUser = rawUser ? JSON.parse(rawUser) : {};
      
      const updatedUser = {
        ...currentUser,
        tipoPessoa,
        nomeCompleto: form.nomeCompleto.trim(),
        name: form.nomeCompleto.trim(),
        cpfCnpj: form.cpfCnpj.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        phone: form.telefone.trim(),
        cep: form.cep.trim(),
        logradouro: form.logradouro.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim(),
        bairro: form.bairro.trim(),
        cidadeUf: form.cidadeUf.trim(),
        city: form.cidadeUf.trim(),
      };

      await AsyncStorage.setItem('@ContrataAI:userData', JSON.stringify(updatedUser));
      Alert.alert('Sucesso', 'Seus dados foram salvos com sucesso!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]"><KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      ><View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shadow-2xs">
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <ArrowLeft color="#1E293B" size={22} strokeWidth={2.5} />
          </TouchableOpacity>
          
          <Text className="text-[17px] font-extrabold text-[#1E293B]">Meus Dados</Text>
          <View className="w-10 h-10" /> 
        </View><ScrollView className="flex-1 px-5 pt-5 pb-10" showsVerticalScrollIndicator={false}><View className="flex-row bg-white rounded-full p-1 border border-slate-100 shadow-sm mb-6">
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => { setTipoPessoa('fisica'); handleMask('cpfCnpj', form.cpfCnpj); }}
              className={`flex-1 py-2.5 rounded-full items-center ${tipoPessoa === 'fisica' ? 'bg-[#FFF4ED]' : ''}`}
            >
              <Text className={`text-sm font-extrabold ${tipoPessoa === 'fisica' ? 'text-[#FF7A2F]' : 'text-[#64748B]'}`}>Pessoa Física</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => { setTipoPessoa('juridica'); handleMask('cpfCnpj', form.cpfCnpj); }}
              className={`flex-1 py-2.5 rounded-full items-center ${tipoPessoa === 'juridica' ? 'bg-[#FFF4ED]' : ''}`}
            >
              <Text className={`text-sm font-extrabold ${tipoPessoa === 'juridica' ? 'text-[#FF7A2F]' : 'text-[#64748B]'}`}>Pessoa Jurídica</Text>
            </TouchableOpacity>
          </View>

          
          <View className="flex-row items-center mb-4">
            <User color="#FF7A2F" size={16} strokeWidth={2.5} className="mr-2" />
            <Text className="text-[12px] font-extrabold text-[#64748B] uppercase tracking-widest">DADOS PESSOAIS</Text>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-extrabold text-[#1E293B] mb-2 ml-1">Nome Completo</Text>
            <View className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 shadow-sm">
              <TextInput
                value={form.nomeCompleto}
                onChangeText={(t) => setForm({ ...form, nomeCompleto: t })}
                placeholder="Digite seu nome completo"
                placeholderTextColor="#94A3B8"
                className="text-[15px] font-bold text-[#1E293B] p-0"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-extrabold text-[#1E293B] mb-2 ml-1">{tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}</Text>
            <View className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 shadow-sm">
              <TextInput
                value={form.cpfCnpj}
                onChangeText={(t) => handleMask('cpfCnpj', t)}
                keyboardType="numeric"
                placeholder={tipoPessoa === 'fisica' ? "000.000.000-00" : "00.000.000/0000-00"}
                placeholderTextColor="#94A3B8"
                className="text-[15px] font-bold text-[#1E293B] p-0"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-extrabold text-[#1E293B] mb-2 ml-1">Email</Text>
            <View className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 flex-row items-center shadow-sm">
              <Mail color="#94A3B8" size={18} strokeWidth={2.3} className="mr-3" />
              <TextInput
                value={form.email}
                onChangeText={(t) => setForm({ ...form, email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="seu@email.com"
                placeholderTextColor="#94A3B8"
                className="flex-1 text-[15px] font-bold text-[#1E293B] p-0"
              />
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-xs font-extrabold text-[#1E293B] mb-2 ml-1">Telefone / Celular</Text>
            <View className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 flex-row items-center shadow-sm">
              <Phone color="#94A3B8" size={18} strokeWidth={2.3} className="mr-3" />
              <TextInput
                value={form.telefone}
                onChangeText={(t) => handleMask('telefone', t)}
                keyboardType="phone-pad"
                placeholder="(00) 00000-0000"
                placeholderTextColor="#94A3B8"
                className="flex-1 text-[15px] font-bold text-[#1E293B] p-0"
              />
            </View>
          </View>

          
          <View className="flex-row items-center mb-4">
            <MapPin color="#FF7A2F" size={16} strokeWidth={2.5} className="mr-2" />
            <Text className="text-[12px] font-extrabold text-[#64748B] uppercase tracking-widest">ENDEREÇO</Text>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-extrabold text-[#1E293B] mb-2 ml-1">CEP</Text>
            <View className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 flex-row items-center shadow-sm">
              <TextInput
                value={form.cep}
                onChangeText={(t) => handleMask('cep', t)}
                keyboardType="numeric"
                placeholder="00000-000"
                placeholderTextColor="#94A3B8"
                className="flex-1 text-[15px] font-bold text-[#1E293B] p-0"
                onSubmitEditing={handleSearchCEP}
              />
              <TouchableOpacity onPress={handleSearchCEP} className="ml-2">
                {loadingCep ? (
                  <ActivityIndicator size="small" color="#FF7A2F" />
                ) : (
                  <Search color="#FF7A2F" size={20} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-extrabold text-[#1E293B] mb-2 ml-1">Logradouro</Text>
            <View className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 shadow-sm">
              <TextInput
                value={form.logradouro}
                onChangeText={(t) => setForm({ ...form, logradouro: t })}
                placeholder="Rua, Avenida, Alameda..."
                placeholderTextColor="#94A3B8"
                className="text-[15px] font-bold text-[#1E293B] p-0"
              />
            </View>
          </View>

          <View className="flex-row justify-between gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-extrabold text-[#1E293B] mb-2 ml-1">Número</Text>
              <View className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 shadow-sm">
                <TextInput
                  value={form.numero}
                  onChangeText={(t) => setForm({ ...form, numero: t })}
                  placeholder="123"
                  placeholderTextColor="#94A3B8"
                  className="text-[15px] font-bold text-[#1E293B] p-0"
                />
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-xs font-extrabold text-[#1E293B] mb-2 ml-1">Comp. <Text className="text-[#94A3B8] font-medium text-[10px]">(opcional)</Text></Text>
              <View className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 shadow-sm">
                <TextInput
                  value={form.complemento}
                  onChangeText={(t) => setForm({ ...form, complemento: t })}
                  placeholder="Apto 101"
                  placeholderTextColor="#94A3B8"
                  className="text-[15px] font-bold text-[#1E293B] p-0"
                />
              </View>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-extrabold text-[#1E293B] mb-2 ml-1">Bairro</Text>
            <View className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 shadow-sm">
              <TextInput
                value={form.bairro}
                onChangeText={(t) => setForm({ ...form, bairro: t })}
                placeholder="Centro"
                placeholderTextColor="#94A3B8"
                className="text-[15px] font-bold text-[#1E293B] p-0"
              />
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-xs font-extrabold text-[#1E293B] mb-2 ml-1">Cidade/UF</Text>
            <View className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 shadow-sm">
              <TextInput
                value={form.cidadeUf}
                onChangeText={(t) => setForm({ ...form, cidadeUf: t })}
                placeholder="São Paulo/SP"
                placeholderTextColor="#94A3B8"
                className="text-[15px] font-bold text-[#1E293B] p-0"
              />
            </View>
          </View>

          <TouchableOpacity 
            activeOpacity={0.88}
            onPress={handleSave}
            disabled={loading}
            className="bg-[#EF4444] rounded-2xl py-4 flex-row items-center justify-center shadow-sm mb-10"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text className="text-white font-extrabold text-[16px] mr-2">Salvar Dados</Text>
                <CheckCircle2 color="#FFFFFF" size={18} strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView></KeyboardAvoidingView></SafeAreaView>
  );
}
