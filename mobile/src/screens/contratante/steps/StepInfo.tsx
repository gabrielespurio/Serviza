import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Input } from '../../../components/Input';
import ProfessionSelector, { ProfessionSelection } from '../../../components/ProfessionSelector';
import { JobFormData } from '../CreateJobFlow';

interface StepProps {
  data: JobFormData;
  onUpdate: (updates: Partial<JobFormData>) => void;
}

export default function StepInfo({ data, onUpdate }: StepProps) {
  const handleSelectProfession = (selection: ProfessionSelection) => {
    onUpdate({
      profession: selection.profession,
      category: selection.categoryId,
      categoryLabel: selection.categoryLabel,
      // Se o título estiver vazio, sugerimos um título inicial rápido com base na profissão selecionada
      title: !data.title ? `${selection.profession}` : data.title,
    });
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Busca inteligente de Profissão (iFood / Uber style) */}
      <View className="mb-6">
        <ProfessionSelector
          selectedProfession={data.profession}
          selectedCategory={data.categoryLabel || data.category}
          onSelect={handleSelectProfession}
          placeholder="Ex.: Garçom, Piscineiro, Eletricista..."
        />
      </View>

      {/* Detalhes da Vaga */}
      <View className="pt-2 border-t border-slate-100">
        <Text className="text-[#1E293B] text-lg font-extrabold mb-4">
          Detalhes do Serviço
        </Text>

        <View className="mb-4">
          <Input
            label="Título da Vaga"
            placeholder="Ex: Garçom para festa de aniversário no sábado"
            value={data.title}
            onChangeText={(text: string) => onUpdate({ title: text })}
          />
        </View>

        <Input
          label="Descrição do Serviço"
          placeholder="Descreva em detalhes o que o profissional deverá fazer, localização aproximada, horários e requisitos necessários."
          value={data.description}
          onChangeText={(text: string) => onUpdate({ description: text })}
          multiline
          numberOfLines={4}
          style={{ minHeight: 120, textAlignVertical: 'top' }}
        />
      </View>
    </ScrollView>
  );
}
