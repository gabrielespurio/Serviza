import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../../../components/Input';
import ProfessionSelector, { ProfessionSelection } from '../../../components/ProfessionSelector';
import { JobFormData } from '../CreateJobFlow';
import { Camera, X } from '../../../components/icons';

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
      title: !data.title ? `${selection.profession}` : data.title,
    });
  };

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const currentPhotos = data.photos || [];
      if (currentPhotos.length < 4) {
        onUpdate({ photos: [...currentPhotos, result.assets[0].uri] });
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    const currentPhotos = data.photos || [];
    const newPhotos = [...currentPhotos];
    newPhotos.splice(index, 1);
    onUpdate({ photos: newPhotos });
  };

  const photos = data.photos || [];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="mb-6">
        <ProfessionSelector
          selectedProfession={data.profession}
          selectedCategory={data.categoryLabel || data.category}
          onSelect={handleSelectProfession}
          placeholder="Ex.: Garçom, Piscineiro, Eletricista..."
        />
      </View>

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

        <View className="mt-6">
          <Text className="text-slate-700 font-semibold mb-1">Fotos do Serviço (opcional)</Text>
          <Text className="text-slate-500 text-sm mb-4">
            Adicione fotos do local ou referências do serviço
          </Text>

          <View className="flex-row flex-wrap gap-3">
            {photos.length < 4 && (
              <TouchableOpacity
                onPress={handleAddPhoto}
                className="w-[47%] aspect-square bg-orange-50 rounded-2xl border-2 border-dashed border-orange-200 items-center justify-center"
              >
                <Camera color="#F97316" size={32} />
                <Text className="text-orange-500 font-medium mt-2">Adicionar</Text>
              </TouchableOpacity>
            )}

            {photos.map((uri, index) => (
              <View key={index} className="w-[47%] aspect-square rounded-2xl overflow-hidden bg-slate-100">
                <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => handleRemovePhoto(index)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center z-10"
                >
                  <X color="#FFFFFF" size={16} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
