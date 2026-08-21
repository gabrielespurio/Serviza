import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, X, Check, ThumbsUp, ThumbsDown, Send } from './icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProviderReview {
  id: string;
  providerId: string;
  jobId: string;
  contractorId: string;
  providerName: string;
  providerAvatar?: string;
  jobTitle?: string;
  rating: number; // 1 a 5
  tags: string[];
  wouldHireAgain: boolean | null;
  comment?: string;
  createdAt: string;
}

interface ProviderReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onReviewSubmitted?: (review: ProviderReview) => void;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  jobId: string;
  jobTitle: string;
}

export const ProviderReviewModal: React.FC<ProviderReviewModalProps> = ({
  visible,
  onClose,
  onReviewSubmitted,
  providerId,
  providerName,
  providerAvatar,
  jobId,
  jobTitle
}) => {
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [wouldHireAgain, setWouldHireAgain] = useState<boolean | null>(true);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tags dinâmicas adaptadas à nota dada (Sugestão inteligente implementada)
  const getTagsForRating = (stars: number) => {
    if (stars === 5) {
      return [
        '✅ Serviço de qualidade',
        '⏰ Pontual',
        '💬 Boa comunicação',
        '🤝 Educado',
        '⚡ Ágil',
        '🧹 Organizado',
        '👍 Resolveu o problema',
        '💰 Bom custo-benefício'
      ];
    }
    if (stars === 4 || stars === 3) {
      return [
        '✅ Serviço de qualidade',
        '⏰ Pontual',
        '💬 Boa comunicação',
        '🤝 Educado',
        '💰 Bom custo-benefício',
        '⚠️ Podia ser mais rápido',
        '⚠️ Detalhes a rever'
      ];
    }
    return [
      '❌ Atrasou',
      '❌ Serviço incompleto',
      '❌ Má comunicação',
      '❌ Não resolveu o problema',
      '❌ Pouco profissional'
    ];
  };

  const currentAvailableTags = getTagsForRating(rating);

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleStarSelect = (stars: number) => {
    setRating(stars);
    // Limpar tags incompatíveis ao mudar drasticamente a nota
    if ((stars <= 2 && rating >= 3) || (stars >= 3 && rating <= 2)) {
      setSelectedTags([]);
    }
    // Auto-ajustar "Contrataria novamente" por comodidade (mas o usuário pode mudar)
    if (stars >= 4 && wouldHireAgain === null) setWouldHireAgain(true);
    if (stars <= 2 && wouldHireAgain === null) setWouldHireAgain(false);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Atenção', 'Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }
    if (wouldHireAgain === null) {
      Alert.alert('Atenção', 'Por favor, informe se contrataria este profissional novamente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReview: ProviderReview = {
        id: `rev-${Date.now()}`,
        providerId,
        jobId,
        contractorId: 'current-contratante',
        providerName,
        providerAvatar,
        jobTitle,
        rating,
        tags: selectedTags,
        wouldHireAgain,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      };

      // 1. Salvar localmente em @ContrataAI:providerReviews
      const rawExisting = await AsyncStorage.getItem('@ContrataAI:providerReviews');
      const existingReviews = rawExisting ? JSON.parse(rawExisting) : [];
      const updatedReviews = [newReview, ...existingReviews];
      await AsyncStorage.setItem('@ContrataAI:providerReviews', JSON.stringify(updatedReviews));

      // 2. Tentar atualizar vagas para concluídas no storage (@ContrataAI:myJobs)
      const rawJobs = await AsyncStorage.getItem('@ContrataAI:myJobs');
      if (rawJobs) {
        const jobs = JSON.parse(rawJobs);
        const updatedJobs = jobs.map((j: any) => {
          if (j.id === jobId || j.title === jobTitle) {
            return { ...j, status: 'Concluída', isReviewed: true };
          }
          return j;
        });
        await AsyncStorage.setItem('@ContrataAI:myJobs', JSON.stringify(updatedJobs));
      }

      // 3. Incremento permanente e exclusivo de completedServices (Regra de Nível)
      const rawCompletedCount = await AsyncStorage.getItem('@ContrataAI:completedServices');
      const currentCount = rawCompletedCount ? parseInt(rawCompletedCount, 10) : 127;
      const nextCount = Math.max(0, currentCount + 1);
      await AsyncStorage.setItem('@ContrataAI:completedServices', nextCount.toString());

      if (onReviewSubmitted) {
        onReviewSubmitted(newReview);
      }

      Alert.alert(
        '🌟 Avaliação Enviada!',
        `Muito obrigado! Sua avaliação sobre ${providerName} foi publicada e ajudará toda a comunidade Serviza.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-[#FAFAFA]">
        {/* Header Rápido (< 30s para preencher) */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-3 bg-white border-b border-slate-100">
          <View>
            <Text className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
              Serviço Concluído
            </Text>
            <Text className="text-xl font-extrabold text-[#1E293B]">
              Avaliar Prestador
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
          >
            <X color="#64748B" size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-5" showsVerticalScrollIndicator={false}>
          {/* Resumo Rápido do Prestador e Vaga */}
          <View className="bg-white rounded-3xl p-4 mb-6 border border-slate-100 shadow-sm flex-row items-center">
            <Image
              source={{ uri: providerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }}
              className="w-14 h-14 rounded-full bg-slate-200 mr-3.5 border-2 border-white"
            />
            <View className="flex-1">
              <Text className="text-[17px] font-extrabold text-[#1E293B]" numberOfLines={1}>
                {providerName}
              </Text>
              <Text className="text-xs font-semibold text-[#8C7A6B]" numberOfLines={1}>
                Serviço: {jobTitle}
              </Text>
            </View>
          </View>

          {/* 1. Nota Geral (Obrigatório) */}
          <View className="bg-white rounded-3xl p-5 mb-5 border border-slate-100 shadow-sm items-center">
            <Text className="text-sm font-extrabold text-[#1E293B] mb-1">
              1. Qual é a sua nota geral? <Text className="text-red-500">*</Text>
            </Text>
            <Text className="text-xs text-[#64748B] mb-4 text-center">
              Essa nota definirá a média pública de {providerName}
            </Text>

            <View className="flex-row items-center justify-center gap-3 mb-2">
              {[1, 2, 3, 4, 5].map((starVal) => (
                <TouchableOpacity
                  key={starVal}
                  activeOpacity={0.7}
                  onPress={() => handleStarSelect(starVal)}
                  className="p-1"
                >
                  <Star
                    color={starVal <= rating ? '#F59E0B' : '#CBD5E1'}
                    fill={starVal <= rating ? '#F59E0B' : 'transparent'}
                    size={40}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-base font-extrabold text-[#FF7A2F]">
              {rating === 5 && '⭐⭐⭐⭐⭐ 5,0 - Excelente!'}
              {rating === 4 && '⭐⭐⭐⭐ 4,0 - Muito bom'}
              {rating === 3 && '⭐⭐⭐ 3,0 - Regular'}
              {rating === 2 && '⭐⭐ 2,0 - Deixou a desejar'}
              {rating === 1 && '⭐ 1,0 - Insatisfeito'}
            </Text>
          </View>

          {/* 2. Como foi a experiência? (Opcional - Tags dinâmicas estilo iFood) */}
          <View className="bg-white rounded-3xl p-5 mb-5 border border-slate-100 shadow-sm">
            <Text className="text-sm font-extrabold text-[#1E293B] mb-1">
              2. Como foi a experiência? <Text className="text-xs font-normal text-[#8C7A6B]">(Opcional)</Text>
            </Text>
            <Text className="text-xs text-[#64748B] mb-3">
              Selecione os pontos de destaque do atendimento:
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {currentAvailableTags.map((tag, index) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    onPress={() => handleToggleTag(tag)}
                    className={`px-4 py-2.5 rounded-full border flex-row items-center ${
                      isSelected
                        ? 'bg-[#FF7A2F] border-[#FF7A2F]'
                        : 'bg-slate-50 border-slate-200/90'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-[#334155]'
                      }`}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. Contrataria novamente? (Obrigatório) */}
          <View className="bg-white rounded-3xl p-5 mb-5 border border-slate-100 shadow-sm">
            <Text className="text-sm font-extrabold text-[#1E293B] mb-1">
              3. Você contrataria este profissional novamente? <Text className="text-red-500">*</Text>
            </Text>
            <Text className="text-xs text-[#64748B] mb-3.5">
              Ajuda outros clientes a tomarem uma decisão com segurança
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setWouldHireAgain(true)}
                className={`flex-1 py-3.5 rounded-2xl border flex-row items-center justify-center ${
                  wouldHireAgain === true
                    ? 'bg-green-50 border-green-600 shadow-2xs'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <ThumbsUp 
                  color={wouldHireAgain === true ? '#16A34A' : '#64748B'} 
                  size={18} 
                  className="mr-2" 
                />
                <Text 
                  className={`text-sm font-extrabold ${
                    wouldHireAgain === true ? 'text-green-700' : 'text-[#64748B]'
                  }`}
                >
                  👍 Sim, com certeza
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setWouldHireAgain(false)}
                className={`flex-1 py-3.5 rounded-2xl border flex-row items-center justify-center ${
                  wouldHireAgain === false
                    ? 'bg-red-50 border-red-600 shadow-2xs'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <ThumbsDown 
                  color={wouldHireAgain === false ? '#DC2626' : '#64748B'} 
                  size={18} 
                  className="mr-2" 
                />
                <Text 
                  className={`text-sm font-extrabold ${
                    wouldHireAgain === false ? 'text-red-700' : 'text-[#64748B]'
                  }`}
                >
                  👎 Não
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Comentário (Opcional - até 500 caracteres) */}
          <View className="bg-white rounded-3xl p-5 mb-8 border border-slate-100 shadow-sm">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm font-extrabold text-[#1E293B]">
                Conte como foi sua experiência <Text className="text-xs font-normal text-[#8C7A6B]">(Opcional)</Text>
              </Text>
              <Text className={`text-xs ${comment.length > 480 ? 'text-red-500 font-bold' : 'text-[#94A3B8]'}`}>
                {comment.length} / 500
              </Text>
            </View>

            <TextInput
              value={comment}
              onChangeText={(t) => {
                if (t.length <= 500) setComment(t);
              }}
              multiline
              numberOfLines={4}
              placeholder="Conte como foi o atendimento e a prestação do serviço. Sua avaliação pode ajudar outros contratantes..."
              placeholderTextColor="#94A3B8"
              style={{ textAlignVertical: 'top', height: 110 }}
              className="text-sm font-medium text-[#1E293B] bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 mt-2"
            />
          </View>

          {/* Botão Enviar Avaliação (< 30s) */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSubmitReview}
            disabled={isSubmitting}
            className="bg-[#FF7A2F] rounded-2xl py-4 flex-row items-center justify-center shadow-md mb-12"
          >
            <Text className="text-white font-extrabold text-base mr-2">
              {isSubmitting ? 'Enviando Avaliação...' : 'Enviar Avaliação Rápida'}
            </Text>
            <Send color="#FFFFFF" size={18} strokeWidth={2.4} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
