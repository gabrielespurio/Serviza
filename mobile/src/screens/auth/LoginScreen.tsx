import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight } from '../../components/icons';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Função auxiliar para recuperar perfil salvo localmente (chave permanente do onboarding)
  const getLocalProfile = async (userEmail: string) => {
    const emailKey = userEmail.toLowerCase().trim();
    
    // 1. Fonte PRIMÁRIA: chave permanente salva no onboarding (nunca é sobrescrita pelo login)
    const permanentProfile = await AsyncStorage.getItem(`@ContrataAI:profile:${emailKey}`);
    if (permanentProfile) {
      return JSON.parse(permanentProfile);
    }
    
    // 2. Fallback: userData genérico (pode ter sido corrompido por login anterior)
    const userData = await AsyncStorage.getItem('@ContrataAI:userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.email?.toLowerCase().trim() === emailKey && parsed.role) {
        return parsed;
      }
    }
    
    // 3. Último recurso: userRole salvo
    const savedRole = await AsyncStorage.getItem('@ContrataAI:userRole');
    if (savedRole) {
      return { role: savedRole === 'prestador' ? 'PRESTADOR' : 'CONTRATANTE' };
    }
    
    return null;
  };

  const handleLogin = async () => {
    if (!email || !password) return alert('Preencha os campos para entrar.');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.token) {
        await AsyncStorage.setItem('@ContrataAI:token', res.data.token);
      }
      
      let userRole = res.data?.user?.role;
      let userDataToSave: any = {
        name: res.data?.user?.name || email.split('@')[0],
        email: res.data?.user?.email || email,
        role: userRole || 'CONTRATANTE',
        skills: res.data?.user?.prestador?.skills || []
      };

      try {
        const profileRes = await api.get('/users/profile');
        if (profileRes.data) {
          userRole = profileRes.data.role || userRole;
          userDataToSave = {
            ...userDataToSave,
            name: profileRes.data.name || userDataToSave.name,
            email: profileRes.data.email || userDataToSave.email,
            role: userRole || userDataToSave.role,
            skills: profileRes.data.prestador?.skills || userDataToSave.skills
          };
        }
      } catch (e) {}

      // Se o backend não retornou role, buscar perfil local permanente
      if (!userRole) {
        const localProfile = await getLocalProfile(email);
        if (localProfile) {
          userRole = localProfile.role;
          // Mesclar dados locais completos com os do backend
          userDataToSave = { ...localProfile, ...userDataToSave, role: userRole, skills: localProfile.skills || userDataToSave.skills, name: localProfile.name || userDataToSave.name };
        }
      }

      userDataToSave.role = userRole || 'CONTRATANTE';
      await AsyncStorage.setItem('@ContrataAI:userData', JSON.stringify(userDataToSave));
      await AsyncStorage.setItem('@ContrataAI:userRole', userRole === 'PRESTADOR' ? 'prestador' : 'contratante');

      if (userRole === 'PRESTADOR') {
        navigation.replace('MainPrestador');
      } else {
        navigation.replace('MainContratante');
      }
    } catch (e: any) {
      // Backend offline — recuperar perfil permanente salvo durante o onboarding
      const localProfile = await getLocalProfile(email);

      if (localProfile && localProfile.role) {
        // Restaurar dados completos do onboarding
        const profileToRestore = {
          name: localProfile.name || email.split('@')[0],
          email: localProfile.email || email,
          role: localProfile.role,
          phone: localProfile.phone || '',
          skills: localProfile.skills || [],
          description: localProfile.description || '',
          city: localProfile.city || ''
        };
        
        await AsyncStorage.setItem('@ContrataAI:userData', JSON.stringify(profileToRestore));
        await AsyncStorage.setItem('@ContrataAI:userRole', localProfile.role === 'PRESTADOR' ? 'prestador' : 'contratante');

        if (localProfile.role === 'PRESTADOR') {
          navigation.replace('MainPrestador');
        } else {
          navigation.replace('MainContratante');
        }
      } else {
        // Nenhum perfil encontrado — primeira vez com esse email, redirecionar para registro
        alert('Nenhuma conta encontrada com esse e-mail. Crie uma conta primeiro.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        <TouchableOpacity 
          className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mb-8 mt-4 border border-slate-100"
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.replace('Onboarding');
            }
          }}
        >
          <ArrowLeft color="#1E293B" size={20} />
        </TouchableOpacity>

        <View className="mb-10">
          <Text className="text-3xl font-extrabold text-[#1E293B] mb-2">Bem-vindo de volta!</Text>
          <Text className="text-[#64748B] text-[15px]">Faça login para continuar sua jornada.</Text>
        </View>

        <View className="space-y-4 gap-4 mb-8">
          <Input 
            label="E-mail"
            placeholder="Digite seu e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Input 
            label="Senha"
            placeholder="Digite sua senha"
            value={password}
            onChangeText={setPassword}
            isPassword
          />
        </View>

        <View className="mt-auto mb-4">
          <Button 
            title="Entrar" 
            onPress={handleLogin}
            isLoading={isLoading} 
            icon={<ArrowRight color="#fff" size={20} />}
          />
          
          <TouchableOpacity 
            className="mt-6 flex-row justify-center items-center pb-2"
            onPress={() => navigation.navigate('Onboarding')}
          >
            <Text className="text-[#64748B] text-[15px] font-medium">Não tem uma conta? </Text>
            <Text className="text-[#F97316] font-bold text-[15px]">Criar agora</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
