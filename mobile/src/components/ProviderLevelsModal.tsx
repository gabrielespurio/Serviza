import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, CheckCircle2 } from './icons';
import { PROVIDER_LEVELS_CONFIG, ProviderLevel, getProviderLevelDetailsByServices } from '../services/providerLevels';

interface ProviderLevelsModalProps {
  visible: boolean;
  onClose: () => void;
  completedServices: number;
}

export const ProviderLevelsModal: React.FC<ProviderLevelsModalProps> = ({
  visible,
  onClose,
  completedServices
}) => {
  const currentLevelConfig = getProviderLevelDetailsByServices(completedServices);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-[#FAFAFA]">
        {/* Header da Tela */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-4 bg-white border-b border-slate-100 shadow-2xs">
          <View>
            <Text className="text-xs font-bold text-[#FF7A2F] uppercase tracking-wider">
              Carreira e Progresso
            </Text>
            <Text className="text-xl font-extrabold text-[#1E293B]">
              Níveis da Serviza
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
          >
            <X color="#64748B" size={20} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-5" showsVerticalScrollIndicator={false}>
          {/* Card Resumo do Nível Atual */}
          <View 
            className="rounded-3xl p-5 mb-6 border shadow-sm"
            style={{ backgroundColor: currentLevelConfig.bgColor, borderColor: currentLevelConfig.color + '40' }}
          >
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-xs font-extrabold uppercase tracking-wider text-[#64748B]">
                Seu Nível Atual na Serviza
              </Text>
              <View className="bg-white px-3 py-1 rounded-full shadow-2xs border border-slate-100">
                <Text className="text-xs font-bold text-[#1E293B]">
                  {completedServices} {completedServices === 1 ? 'serviço' : 'serviços'}
                </Text>
              </View>
            </View>

            <Text className="text-2xl font-black mb-1" style={{ color: currentLevelConfig.color }}>
              {currentLevelConfig.name}
            </Text>
            <Text className="text-xs font-medium text-[#475569] leading-relaxed">
              {currentLevelConfig.description}
            </Text>
          </View>

          <Text className="text-xs font-extrabold text-[#64748B] uppercase tracking-widest mb-3 px-1">
            TODOS OS NÍVEIS DA SERVIZA
          </Text>

          {/* Lista de Níveis */}
          {PROVIDER_LEVELS_CONFIG.map((lvl) => {
            const isCurrent = lvl.id === currentLevelConfig.id;
            const isUnlocked = completedServices >= lvl.minServices;

            return (
              <View
                key={lvl.id}
                className={`bg-white rounded-3xl p-5 mb-4 border ${
                  isCurrent
                    ? 'border-2 border-[#FF7A2F] shadow-md bg-[#FFF4ED]/30'
                    : isUnlocked
                      ? 'border-slate-200/90 shadow-2xs'
                      : 'border-slate-100 opacity-60 bg-slate-50/50'
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1 pr-3">
                    <View 
                      className="w-13 h-13 rounded-2xl items-center justify-center mr-3.5"
                      style={{ backgroundColor: lvl.bgColor }}
                    >
                      <Text className="text-2xl">{lvl.iconEmoji}</Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-0.5">
                        <Text className="text-base font-black text-[#1E293B]">
                          {lvl.name}
                        </Text>
                        {isCurrent && (
                          <View className="bg-[#FF7A2F] px-2.5 py-0.5 rounded-full">
                            <Text className="text-[10px] font-extrabold text-white uppercase">
                              Atual
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text className="text-xs font-bold text-[#64748B] mb-1.5">
                        {lvl.minServices} {lvl.minServices === 1 ? 'serviço concluído' : 'serviços concluídos'}
                      </Text>
                    </View>
                  </View>

                  {isUnlocked && !isCurrent && (
                    <CheckCircle2 color="#10B981" size={20} strokeWidth={2.5} />
                  )}
                </View>

                <Text className="text-xs font-medium text-[#475569] leading-relaxed pt-2 border-t border-slate-100/80 mt-2">
                  {lvl.description}
                </Text>
              </View>
            );
          })}

          <View className="h-10" />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
