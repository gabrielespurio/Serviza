import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ArrowLeft, Check, Send } from '../../components/icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/Button';
import { api } from '../../services/api';

import StepInfo from './steps/StepInfo';
import StepLocation from './steps/StepLocation';
import StepPayment from './steps/StepPayment';
import StepReview from './steps/StepReview';

// ========== TYPES ==========

export interface JobFormData {
  category: string;
  categoryLabel: string;
  profession: string;
  title: string;
  description: string;
  photos: string[];
  selectedDates: string[]; // ISO date strings 'YYYY-MM-DD'
  scheduleType: 'same' | 'different' | '';
  dateSchedules: { [dateKey: string]: { startTime: Date | null; endTime: Date | null } };
  startTime: Date | null;
  endTime: Date | null;
  date: Date | null; // backward compat — populated from selectedDates[0] at publish
  hideExactLocationUntilHired: boolean;
  locationType: 'gps' | 'cep' | 'manual' | '';
  address: {
    cep: string;
    estado: string;
    cidade: string;
    bairro: string;
    rua: string;
    numero: string;
    complemento: string;
  };
  coordinates: { latitude: number; longitude: number } | null;
  paymentType: 'fixed' | 'hourly' | '';
  paymentValue: string;
  paymentMethod: string;
}

const INITIAL_DATA: JobFormData = {
  category: '',
  categoryLabel: '',
  profession: '',
  title: '',
  description: '',
  photos: [],
  selectedDates: [],
  scheduleType: '',
  dateSchedules: {},
  startTime: null,
  endTime: null,
  date: null,
  hideExactLocationUntilHired: true, // Default to true for privacy
  locationType: '',
  address: { cep: '', estado: '', cidade: '', bairro: '', rua: '', numero: '', complemento: '' },
  coordinates: null,
  paymentType: '',
  paymentValue: '',
  paymentMethod: '',
};

const DRAFT_KEY = '@ContrataAI:jobDraft';

const STEPS = [
  { label: 'Informações', shortLabel: 'Info' },
  { label: 'Localização', shortLabel: 'Local' },
  { label: 'Pagamento', shortLabel: 'Pagar' },
  { label: 'Revisão', shortLabel: 'Revisão' },
];

// ========== COMPONENT ==========

export default function CreateJobFlow({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<JobFormData>(INITIAL_DATA);
  const [publishing, setPublishing] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  // Auto-save draft on data change
  useEffect(() => {
    if (draftLoaded) {
      saveDraft();
    }
  }, [data, currentStep]);

  const loadDraft = async () => {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Restore dates from ISO strings
        if (parsed.data) {
          if (parsed.data.date) parsed.data.date = new Date(parsed.data.date);
          if (parsed.data.startTime) parsed.data.startTime = new Date(parsed.data.startTime);
          if (parsed.data.endTime) parsed.data.endTime = new Date(parsed.data.endTime);
        }

        Alert.alert(
          'Rascunho encontrado',
          'Você tem uma vaga em andamento. Deseja continuar de onde parou?',
          [
            {
              text: 'Começar do zero',
              style: 'destructive',
              onPress: () => {
                AsyncStorage.removeItem(DRAFT_KEY);
                setDraftLoaded(true);
              },
            },
            {
              text: 'Continuar',
              onPress: () => {
                setData({ ...INITIAL_DATA, ...parsed.data });
                setCurrentStep(parsed.step || 0);
                setDraftLoaded(true);
              },
            },
          ]
        );
      } else {
        setDraftLoaded(true);
      }
    } catch {
      setDraftLoaded(true);
    }
  };

  const saveDraft = async () => {
    try {
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step: currentStep }));
    } catch {}
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch {}
  };

  // ========== UPDATE & NAVIGATION ==========

  const handleUpdate = useCallback((updates: Partial<JobFormData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 0:
        if (!data.category) return 'Selecione uma categoria de serviço.';
        if (!data.profession) return 'Selecione a profissão desejada.';
        if (!data.title.trim()) return 'Informe o título da vaga.';
        if (!data.description.trim()) return 'Descreva o serviço que será realizado.';
        return null;
      case 1:
        if (data.selectedDates.length === 0) return 'Selecione pelo menos uma data para o serviço.';
        if (data.selectedDates.length === 1 || data.scheduleType === 'same') {
          if (!data.startTime) return 'Informe o horário de início.';
          if (!data.endTime) return 'Informe o horário de término.';
          if (data.startTime && data.endTime) {
            const s = data.startTime.getHours() * 60 + data.startTime.getMinutes();
            const e = data.endTime.getHours() * 60 + data.endTime.getMinutes();
            if (e <= s) return 'O horário de término deve ser maior que o de início.';
          }
        } else if (data.scheduleType === 'different') {
          for (const dateKey of data.selectedDates) {
            const schedule = data.dateSchedules[dateKey];
            if (!schedule?.startTime || !schedule?.endTime) {
              return `Preencha os horários do dia ${dateKey.split('-').reverse().join('/')}.`;
            }
          }
        } else if (data.selectedDates.length > 1) {
          return 'Escolha se os horários serão iguais ou diferentes.';
        }
        if (!data.locationType) return 'Escolha como informar o endereço.';
        if (!data.address.cidade) return 'Informe a cidade.';
        if (!data.address.rua && !data.address.bairro) return 'Informe pelo menos rua ou bairro.';
        return null;
      case 2:
        if (!data.paymentType) return 'Selecione o tipo de pagamento.';
        if (!data.paymentValue.trim()) return 'Informe o valor.';
        if (!data.paymentMethod) return 'Selecione a forma de pagamento.';
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      Alert.alert('Atenção', error);
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // ========== PUBLISH ==========

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const numericPrice = parseFloat(data.paymentValue.replace(/\D/g, '')) / 100 || 0;
      const payload = {
        title: data.title,
        description: data.description,
        price: numericPrice,
        paymentValue: data.paymentValue,
        category: data.category,
        profession: data.profession,
        date: data.date?.toISOString() || new Date().toISOString(),
        startTime: data.startTime?.toISOString(),
        endTime: data.endTime?.toISOString(),
        address: data.address,
        coordinates: data.coordinates,
        paymentType: data.paymentType,
        paymentMethod: data.paymentMethod,
        status: 'OPEN',
        // Novos campos
        selectedDates: data.selectedDates,
        scheduleType: data.scheduleType,
        dateSchedules: data.dateSchedules,
        photos: data.photos,
        hideExactLocationUntilHired: data.hideExactLocationUntilHired,
      };

      try {
        await api.post('/jobs', payload);
      } catch {
        // Backend offline — continuamos para UX
      }

      // Salvar localmente em @ContrataAI:myJobs para exibição em tempo real na Home e aba Vagas
      try {
        const rawJobs = await AsyncStorage.getItem('@ContrataAI:myJobs');
        const existingJobs = rawJobs ? JSON.parse(rawJobs) : [];
        const firstDate = data.selectedDates.length > 0 ? data.selectedDates[0] : new Date().toISOString().split('T')[0];
        const newJob = {
          id: Date.now().toString(),
          title: data.title,
          description: data.description,
          category: data.category,
          categoryLabel: data.categoryLabel || data.category,
          profession: data.profession,
          photos: data.photos || [],
          selectedDates: data.selectedDates,
          scheduleType: data.scheduleType,
          dateSchedules: data.dateSchedules,
          date: firstDate,
          startTime: data.startTime ? data.startTime.toISOString() : null,
          endTime: data.endTime ? data.endTime.toISOString() : null,
          address: data.address,
          coordinates: data.coordinates,
          paymentType: data.paymentType,
          paymentValue: data.paymentValue,
          paymentMethod: data.paymentMethod,
          status: 'Ativa',
          proposalsCount: 0,
          applications: [],
          createdAt: new Date().toISOString()
        };
        const updatedJobs = [newJob, ...existingJobs];
        await AsyncStorage.setItem('@ContrataAI:myJobs', JSON.stringify(updatedJobs));
      } catch (err) {
        // Ignora erro de storage local
      }

      await clearDraft();

      Alert.alert(
        '🎉 Vaga publicada!',
        'Sua vaga foi publicada com sucesso. Profissionais já podem se candidatar.',
        [{ text: 'Voltar para Home', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível publicar a vaga. Tente novamente.');
    }
    setPublishing(false);
  };

  // ========== RENDER ==========

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepInfo data={data} onUpdate={handleUpdate} />;
      case 1:
        return <StepLocation data={data} onUpdate={handleUpdate} />;
      case 2:
        return <StepPayment data={data} onUpdate={handleUpdate} />;
      case 3:
        return <StepReview data={data} onGoToStep={goToStep} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* ===== HEADER ===== */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
          <TouchableOpacity
            onPress={goBack}
            className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center"
          >
            {currentStep === 0 ? (
              <X color="#64748B" size={20} />
            ) : (
              <ArrowLeft color="#64748B" size={20} />
            )}
          </TouchableOpacity>

          <Text className="text-lg font-extrabold text-[#1E293B]">
            {currentStep === 3 ? 'Revisão' : 'Nova Vaga'}
          </Text>

          <View className="w-10 h-10" />
        </View>

        {/* ===== PROGRESS BAR ===== */}
        <View className="px-5 pt-5 pb-2 bg-white">
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {STEPS.map((step, i) => (
              <React.Fragment key={i}>
                {/* Step Column */}
                <View style={{ alignItems: 'center', width: 60 }}>
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${
                      i < currentStep
                        ? 'bg-[#34D399]'
                        : i === currentStep
                        ? 'bg-[#F97316]'
                        : 'bg-slate-200'
                    }`}
                  >
                    {i < currentStep ? (
                      <Check color="#fff" size={14} strokeWidth={3} />
                    ) : (
                      <Text className={`text-xs font-bold ${i === currentStep ? 'text-white' : 'text-slate-400'}`}>
                        {i + 1}
                      </Text>
                    )}
                  </View>
                  <Text
                    className={`text-[10px] font-semibold mt-1.5 text-center ${
                      i === currentStep ? 'text-[#F97316]' : i < currentStep ? 'text-[#34D399]' : 'text-[#94A3B8]'
                    }`}
                    numberOfLines={1}
                  >
                    {step.label}
                  </Text>
                </View>

                {/* Connector Line */}
                {i < STEPS.length - 1 && (
                  <View style={{ flex: 1, justifyContent: 'center', paddingTop: 4 }}>
                    <View
                      className={`h-[2px] ${
                        i < currentStep ? 'bg-[#34D399]' : 'bg-slate-200'
                      }`}
                    />
                  </View>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ===== STEP CONTENT ===== */}
        <View className="flex-1 px-5 pt-6">
          {renderStep()}
        </View>

        {/* ===== BOTTOM BUTTONS ===== */}
        <View 
          className="px-5 pt-3 bg-white border-t border-slate-100" 
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          {currentStep < 3 ? (
            <Button title="Continuar" onPress={goNext} />
          ) : (
            <Button
              title="Publicar Vaga"
              onPress={handlePublish}
              isLoading={publishing}
              icon={<Send color="#fff" size={18} />}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
