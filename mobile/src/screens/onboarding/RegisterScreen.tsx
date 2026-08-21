import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight } from '../../components/icons';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { maskPhone, isValidEmail, isValidPhone } from '../../utils/validators';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; phone?: string; password?: string }>({});

  const handlePhoneChange = (text: string) => {
    setPhone(maskPhone(text));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Informe seu e-mail';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'E-mail inválido. Ex: nome@email.com';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Informe seu telefone';
    } else if (!isValidPhone(phone)) {
      newErrors.phone = 'Telefone inválido. Use (DDD) + número';
    }

    if (!password.trim()) {
      newErrors.password = 'Crie uma senha';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;

    // CRÍTICO: Limpar toda a sessão anterior para evitar herança de dados de outro usuário
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const contrataKeys = allKeys.filter(k => k.startsWith('@ContrataAI:'));
      if (contrataKeys.length > 0) {
        await AsyncStorage.multiRemove(contrataKeys);
      }
    } catch (e) {}

    try {
      setIsLoading(true);
      const response = await api.post('/auth/check-email', { email });
      if (response.data && response.data.exists) {
        setErrors({ email: 'Este e-mail já está cadastrado. Faça login ou use outro.' });
        setIsLoading(false);
        return;
      }
      
      navigation.navigate('ChatOnboarding', {
        baseData: { email, phone: phone.replace(/\D/g, ''), password }
      });
    } catch (error: any) {
      if (error.response?.data?.exists || error.response?.data?.error?.toLowerCase().includes('cadastrado')) {
        setErrors({ email: 'Este e-mail já está cadastrado. Faça login ou use outro.' });
      } else {
        // Falha suave caso o servidor local não responda ou falhe a rede, garantindo que o usuário consiga seguir
        navigation.navigate('ChatOnboarding', {
          baseData: { email, phone: phone.replace(/\D/g, ''), password }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]">
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 px-8 pt-8">
        
        <TouchableOpacity 
          className="w-10 h-10 justify-center mb-6 mt-4"
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color="#1E293B" size={28} />
        </TouchableOpacity>

        <Text className="text-4xl font-extrabold text-[#111827] mb-2 tracking-tight">
          Crie sua conta
        </Text>
        <Text className="text-[16px] text-[#6B7280] mb-8">
          Comece a transformar seu trabalho agora.
        </Text>

        <View className="mb-1">
          <Input 
            label="Email" 
            placeholder="Ex: joao@email.com" 
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={handleEmailChange}
          />
          {errors.email && (
            <Text className="text-red-500 text-xs font-semibold mt-1 ml-1">{errors.email}</Text>
          )}
        </View>

        <View className="mb-1">
          <Input 
            label="Telefone" 
            placeholder="(00) 00000-0000" 
            keyboardType="phone-pad"
            value={phone}
            onChangeText={handlePhoneChange}
          />
          {errors.phone && (
            <Text className="text-red-500 text-xs font-semibold mt-1 ml-1">{errors.phone}</Text>
          )}
        </View>

        <View className="mb-1">
          <Input 
            label="Senha" 
            placeholder="Crie uma senha segura" 
            isPassword
            value={password}
            onChangeText={handlePasswordChange}
          />
          {errors.password && (
            <Text className="text-red-500 text-xs font-semibold mt-1 ml-1">{errors.password}</Text>
          )}
        </View>

        <View className="mt-4 mb-6">
          <Button 
            title="Continuar" 
            onPress={handleNext}
            isLoading={isLoading} 
            icon={<ArrowRight color="#fff" size={20} />}
          />
        </View>

        <Text className="text-center text-[#94A3B8] text-[13px] px-4 mb-8 leading-relaxed">
          Ao se cadastrar, você concorda com nossos <Text className="underline">Termos de Uso</Text> e <Text className="underline">Política de Privacidade</Text>.
        </Text>

        <View className="flex-row justify-center items-center pb-12">
          <Text className="text-[#64748B] text-[15px]">Já tem uma conta? </Text>
          <TouchableOpacity className="flex-row items-center" onPress={() => navigation.navigate('Login')}>
            <Text className="text-[#F97316] font-bold text-[15px] mr-1">Entre aqui</Text>
            <ArrowRight color="#F97316" size={16} />
          </TouchableOpacity>
        </View>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
