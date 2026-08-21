import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { DollarSign, Clock, Smartphone, Banknote, ArrowLeftRight, MessageCircle } from '../../../components/icons';
import { Input } from '../../../components/Input';
import { PAYMENT_METHODS } from '../../../data/jobCategories';
import { JobFormData } from '../CreateJobFlow';

interface StepProps {
  data: JobFormData;
  onUpdate: (updates: Partial<JobFormData>) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  Smartphone,
  Banknote,
  ArrowLeftRight,
  MessageCircle,
};

const PAYMENT_TYPES = [
  {
    id: 'fixed' as const,
    label: 'Valor Fixo',
    description: 'Um valor total pelo serviço',
    Icon: DollarSign,
  },
  {
    id: 'hourly' as const,
    label: 'Valor por Hora',
    description: 'Pagamento por hora trabalhada',
    Icon: Clock,
  },
];

export default function StepPayment({ data, onUpdate }: StepProps) {
  const handleSelectPaymentType = (type: 'fixed' | 'hourly') => {
    onUpdate({ paymentType: type, paymentValue: '' });
  };

  const handleSelectPaymentMethod = (methodId: string) => {
    onUpdate({ paymentMethod: methodId });
  };

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';

    const numericValue = parseInt(digits, 10) / 100;
    return numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleValueChange = (text: string) => {
    const formatted = formatCurrency(text);
    onUpdate({ paymentValue: formatted });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tipo de Pagamento ── */}
        <View className="mb-8">
          <Text className="text-[#1E293B] text-[18px] font-extrabold mb-2">
            Tipo de pagamento
          </Text>
          <Text className="text-[#64748B] text-[14px] mb-5 leading-relaxed">
            Como você deseja pagar o profissional?
          </Text>

          <View className="flex-row gap-4">
            {PAYMENT_TYPES.map(({ id, label, description, Icon }) => {
              const isSelected = data.paymentType === id;

              return (
                <TouchableOpacity
                  key={id}
                  activeOpacity={0.7}
                  onPress={() => handleSelectPaymentType(id)}
                  className={`flex-1 rounded-[20px] p-5 items-center ${
                    isSelected
                      ? 'border-2 border-[#F97316] bg-[#FFF4ED]'
                      : 'border border-slate-200 bg-white'
                  }`}
                >
                  <View
                    className={`w-14 h-14 rounded-2xl items-center justify-center mb-3 ${
                      isSelected ? 'bg-[#F97316]' : 'bg-slate-50'
                    }`}
                  >
                    <Icon color={isSelected ? '#FFFFFF' : '#94A3B8'} size={26} />
                  </View>

                  <Text
                    className={`text-[15px] font-bold text-center ${
                      isSelected ? 'text-[#F97316]' : 'text-[#1E293B]'
                    }`}
                  >
                    {label}
                  </Text>

                  <Text
                    className={`text-[12px] text-center mt-1 ${
                      isSelected ? 'text-[#F97316]/70' : 'text-[#94A3B8]'
                    }`}
                  >
                    {description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Campo de Valor ── */}
        {data.paymentType !== '' && (
          <View className="mb-8">
            <View className="flex-row items-center mb-1">
              <Text className="text-[#1E293B] text-[18px] font-extrabold">
                {data.paymentType === 'fixed' ? 'Valor' : 'Valor por hora'}
              </Text>
            </View>

            <Text className="text-[#64748B] text-[13px] mb-5 leading-relaxed">
              {data.paymentType === 'fixed'
                ? 'Informe o valor total que será pago pelo serviço completo.'
                : 'Informe quanto será pago por hora de trabalho.'}
            </Text>

            <View className="relative justify-center">
              <View className="absolute left-5 z-10 flex-row items-center">
                <Text className="text-[#94A3B8] text-[16px] font-bold">R$</Text>
              </View>
              <Input
                label=""
                placeholder="0,00"
                keyboardType="numeric"
                value={data.paymentValue}
                onChangeText={handleValueChange}
                className="mb-0"
                style={{ paddingLeft: 52 }}
              />
            </View>

            {data.paymentType === 'hourly' && data.paymentValue !== '' && (
              <View className="bg-[#FFF4ED] rounded-2xl px-5 py-4 mt-4 flex-row items-center">
                <Clock color="#F97316" size={18} />
                <Text className="text-[#F97316] text-[13px] font-bold ml-3">
                  Estimativa: R$ {data.paymentValue}/hora
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Forma de Pagamento ── */}
        <View className="mb-4">
          <Text className="text-[#1E293B] text-[18px] font-extrabold mb-2">
            Forma de pagamento
          </Text>
          <Text className="text-[#64748B] text-[14px] mb-5 leading-relaxed">
            Como o profissional será pago?
          </Text>

          <View className="flex-row flex-wrap gap-4">
            {PAYMENT_METHODS.map((method) => {
              const isSelected = data.paymentMethod === method.id;
              const IconComponent = ICON_MAP[method.icon];

              return (
                <TouchableOpacity
                  key={method.id}
                  activeOpacity={0.7}
                  onPress={() => handleSelectPaymentMethod(method.id)}
                  className={`rounded-[18px] p-4 flex-row items-center ${
                    isSelected
                      ? 'border-2 border-[#F97316] bg-[#FFF4ED]'
                      : 'border border-slate-200 bg-white'
                  }`}
                  style={{ width: '47%' }}
                >
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                      isSelected ? 'bg-[#F97316]' : 'bg-slate-50'
                    }`}
                  >
                    {IconComponent && (
                      <IconComponent
                        color={isSelected ? '#FFFFFF' : '#94A3B8'}
                        size={20}
                      />
                    )}
                  </View>

                  <Text
                    className={`text-[14px] font-bold flex-shrink ${
                      isSelected ? 'text-[#F97316]' : 'text-[#1E293B]'
                    }`}
                    numberOfLines={1}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
