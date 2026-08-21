import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Calendar, Clock, MapPin, Navigation, Hash, PenLine } from '../../../components/icons';
import { Input } from '../../../components/Input';
import axios from 'axios';
import { JobFormData } from '../CreateJobFlow';

interface StepProps {
  data: JobFormData;
  onUpdate: (updates: Partial<JobFormData>) => void;
}

export default function StepLocation({ data, onUpdate }: StepProps) {
  // Date/Time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Location state
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);

  // ========== DATE/TIME HANDLERS ==========

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios' ? true : false);
    if (selectedDate) {
      onUpdate({ date: selectedDate });
    }
  };

  const onStartTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowStartPicker(Platform.OS === 'ios' ? true : false);
    if (selectedTime) {
      onUpdate({ startTime: selectedTime });
    }
  };

  const onEndTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowEndPicker(Platform.OS === 'ios' ? true : false);
    if (selectedTime) {
      onUpdate({ endTime: selectedTime });
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const timeError = (): string => {
    if (data.startTime && data.endTime) {
      const start = data.startTime.getHours() * 60 + data.startTime.getMinutes();
      const end = data.endTime.getHours() * 60 + data.endTime.getMinutes();
      if (end <= start) return 'O horário de término deve ser maior que o de início.';
    }
    return '';
  };

  // ========== LOCATION HANDLERS ==========

  const handleGPS = async () => {
    setLoadingGPS(true);
    onUpdate({ locationType: 'gps' });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para continuar.');
        setLoadingGPS(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;

      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });

      onUpdate({
        coordinates: { latitude, longitude },
        address: {
          cep: geo?.postalCode || '',
          estado: geo?.region || '',
          cidade: geo?.city || geo?.subregion || '',
          bairro: geo?.district || '',
          rua: geo?.street || '',
          numero: geo?.streetNumber || '',
          complemento: '',
        },
      });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível obter sua localização. Tente novamente.');
    }
    setLoadingGPS(false);
  };

  const handleCEPLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    onUpdate({
      address: { ...data.address, cep },
    });

    if (cleanCep.length === 8) {
      setLoadingCEP(true);
      try {
        const res = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`, { timeout: 5000 });
        if (!res.data.erro) {
          const newAddress = {
            ...data.address,
            cep,
            estado: res.data.uf || '',
            cidade: res.data.localidade || '',
            bairro: res.data.bairro || '',
            rua: res.data.logradouro || '',
          };
          onUpdate({ address: newAddress });

          // Geocode to get coordinates for the map
          try {
            const fullAddress = `${newAddress.rua}, ${newAddress.bairro}, ${newAddress.cidade}, ${newAddress.estado}, Brasil`;
            const coords = await Location.geocodeAsync(fullAddress);
            if (coords.length > 0) {
              onUpdate({ coordinates: { latitude: coords[0].latitude, longitude: coords[0].longitude } });
            }
          } catch (geoErr) {
            // Geocoding failed silently — map won't show but address is still valid
          }
        }
      } catch (err) {
        // ViaCEP failed — let user fill manually
      }
      setLoadingCEP(false);
    }
  };

  const selectLocationType = (type: 'gps' | 'cep' | 'manual') => {
    if (type === 'gps') {
      handleGPS();
    } else {
      onUpdate({
        locationType: type,
        coordinates: null,
        address: { cep: '', estado: '', cidade: '', bairro: '', rua: '', numero: '', complemento: '' },
      });
    }
  };

  const handleMapDrag = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    onUpdate({ coordinates: { latitude, longitude } });
  };

  const hasAddress = data.address.rua || data.address.cidade;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* ===== DATE SECTION ===== */}
      <Text className="text-lg font-extrabold text-[#1E293B] mb-1">Quando será o serviço?</Text>
      <Text className="text-[#94A3B8] text-sm mb-6">Selecione a data e o horário</Text>

      {/* Date Picker */}
      <TouchableOpacity
        className="bg-white border border-slate-200 rounded-[16px] px-5 py-4 mb-4 flex-row items-center justify-between"
        onPress={() => setShowDatePicker(true)}
      >
        <View className="flex-row items-center">
          <Calendar color="#F97316" size={20} />
          <Text className={`ml-3 text-base ${data.date ? 'text-[#1E293B] font-semibold' : 'text-[#94A3B8]'}`}>
            {data.date ? formatDate(data.date) : 'Selecionar data'}
          </Text>
        </View>
      </TouchableOpacity>

      {showDatePicker && (
        <View className="bg-white rounded-2xl mb-4 overflow-hidden border border-slate-100">
          <DateTimePicker
            value={data.date || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={new Date()}
            onChange={onDateChange}
            locale="pt-BR"
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity className="py-3 items-center border-t border-slate-100" onPress={() => setShowDatePicker(false)}>
              <Text className="text-[#F97316] font-bold">Confirmar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Time Pickers */}
      <View className="flex-row gap-3 mb-2">
        <TouchableOpacity
          className="flex-1 bg-white border border-slate-200 rounded-[16px] px-4 py-4 flex-row items-center"
          onPress={() => setShowStartPicker(true)}
        >
          <Clock color="#F97316" size={18} />
          <Text className={`ml-2 text-[15px] ${data.startTime ? 'text-[#1E293B] font-semibold' : 'text-[#94A3B8]'}`}>
            {data.startTime ? formatTime(data.startTime) : 'Início'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-white border border-slate-200 rounded-[16px] px-4 py-4 flex-row items-center"
          onPress={() => setShowEndPicker(true)}
        >
          <Clock color="#94A3B8" size={18} />
          <Text className={`ml-2 text-[15px] ${data.endTime ? 'text-[#1E293B] font-semibold' : 'text-[#94A3B8]'}`}>
            {data.endTime ? formatTime(data.endTime) : 'Término'}
          </Text>
        </TouchableOpacity>
      </View>

      {timeError() ? (
        <Text className="text-red-500 text-sm mb-4 ml-1">{timeError()}</Text>
      ) : (
        <View className="mb-6" />
      )}

      {showStartPicker && (
        <View className="bg-white rounded-2xl mb-4 overflow-hidden border border-slate-100">
          <DateTimePicker
            value={data.startTime || new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onStartTimeChange}
            is24Hour
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity className="py-3 items-center border-t border-slate-100" onPress={() => setShowStartPicker(false)}>
              <Text className="text-[#F97316] font-bold">Confirmar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {showEndPicker && (
        <View className="bg-white rounded-2xl mb-4 overflow-hidden border border-slate-100">
          <DateTimePicker
            value={data.endTime || new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onEndTimeChange}
            is24Hour
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity className="py-3 items-center border-t border-slate-100" onPress={() => setShowEndPicker(false)}>
              <Text className="text-[#F97316] font-bold">Confirmar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ===== LOCATION SECTION ===== */}
      <View className="h-px bg-slate-100 my-6" />
      <Text className="text-lg font-extrabold text-[#1E293B] mb-1">Onde será o serviço?</Text>
      <Text className="text-[#94A3B8] text-sm mb-6">Escolha como informar o endereço</Text>

      {/* Location Type Cards */}
      <View className="gap-3 mb-6">
        <TouchableOpacity
          className={`flex-row items-center p-4 rounded-2xl border-2 ${
            data.locationType === 'gps'
              ? 'border-[#F97316] bg-[#FFF4ED]'
              : 'border-slate-200 bg-white'
          }`}
          onPress={() => selectLocationType('gps')}
        >
          <View className={`w-10 h-10 rounded-full items-center justify-center ${
            data.locationType === 'gps' ? 'bg-[#F97316]' : 'bg-slate-100'
          }`}>
            <Navigation color={data.locationType === 'gps' ? '#fff' : '#94A3B8'} size={18} />
          </View>
          <View className="ml-3 flex-1">
            <Text className={`font-bold text-[15px] ${data.locationType === 'gps' ? 'text-[#F97316]' : 'text-[#1E293B]'}`}>
              Usar minha localização
            </Text>
            <Text className="text-[#94A3B8] text-xs mt-0.5">Detectar endereço automaticamente</Text>
          </View>
          {loadingGPS && <ActivityIndicator color="#F97316" />}
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-row items-center p-4 rounded-2xl border-2 ${
            data.locationType === 'cep'
              ? 'border-[#F97316] bg-[#FFF4ED]'
              : 'border-slate-200 bg-white'
          }`}
          onPress={() => selectLocationType('cep')}
        >
          <View className={`w-10 h-10 rounded-full items-center justify-center ${
            data.locationType === 'cep' ? 'bg-[#F97316]' : 'bg-slate-100'
          }`}>
            <Hash color={data.locationType === 'cep' ? '#fff' : '#94A3B8'} size={18} />
          </View>
          <View className="ml-3 flex-1">
            <Text className={`font-bold text-[15px] ${data.locationType === 'cep' ? 'text-[#F97316]' : 'text-[#1E293B]'}`}>
              Informar CEP
            </Text>
            <Text className="text-[#94A3B8] text-xs mt-0.5">Preencher endereço pelo CEP</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-row items-center p-4 rounded-2xl border-2 ${
            data.locationType === 'manual'
              ? 'border-[#F97316] bg-[#FFF4ED]'
              : 'border-slate-200 bg-white'
          }`}
          onPress={() => selectLocationType('manual')}
        >
          <View className={`w-10 h-10 rounded-full items-center justify-center ${
            data.locationType === 'manual' ? 'bg-[#F97316]' : 'bg-slate-100'
          }`}>
            <PenLine color={data.locationType === 'manual' ? '#fff' : '#94A3B8'} size={18} />
          </View>
          <View className="ml-3 flex-1">
            <Text className={`font-bold text-[15px] ${data.locationType === 'manual' ? 'text-[#F97316]' : 'text-[#1E293B]'}`}>
              Informar manualmente
            </Text>
            <Text className="text-[#94A3B8] text-xs mt-0.5">Digitar todos os campos do endereço</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* GPS Result */}
      {data.locationType === 'gps' && hasAddress && !loadingGPS && (
        <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <MapPin color="#F97316" size={16} />
            <Text className="text-[#1E293B] font-bold text-sm ml-2">Endereço detectado</Text>
          </View>
          <Text className="text-[#475569] text-sm leading-relaxed">
            {[data.address.rua, data.address.numero].filter(Boolean).join(', ')}
            {data.address.bairro ? ` - ${data.address.bairro}` : ''}
            {'\n'}
            {[data.address.cidade, data.address.estado].filter(Boolean).join(' - ')}
            {data.address.cep ? ` • ${data.address.cep}` : ''}
          </Text>

          <View className="mt-4">
            <Input
              label="Número (confirme ou corrija)"
              placeholder="Ex: 1250"
              keyboardType="numeric"
              value={data.address.numero}
              onChangeText={(v) => onUpdate({ address: { ...data.address, numero: v } })}
            />
          </View>
        </View>
      )}

      {/* CEP Form */}
      {data.locationType === 'cep' && (
        <View className="gap-1">
          <View className="flex-row items-end gap-3">
            <View className="flex-1">
              <Input
                label="CEP"
                placeholder="00000-000"
                keyboardType="numeric"
                value={data.address.cep}
                onChangeText={(v) => handleCEPLookup(v)}
                maxLength={9}
              />
            </View>
            {loadingCEP && (
              <View className="mb-7">
                <ActivityIndicator color="#F97316" />
              </View>
            )}
          </View>

          {data.address.rua ? (
            <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
              <View className="flex-row items-center mb-3">
                <MapPin color="#22C55E" size={16} />
                <Text className="text-[#22C55E] font-bold text-sm ml-2">Endereço encontrado</Text>
              </View>
              <Text className="text-[#475569] text-sm leading-relaxed mb-4">
                {data.address.rua}
                {data.address.bairro ? `, ${data.address.bairro}` : ''}
                {'\n'}
                {data.address.cidade} - {data.address.estado}
              </Text>
              <Input
                label="Número"
                placeholder="Ex: 1250"
                keyboardType="numeric"
                value={data.address.numero}
                onChangeText={(v) => onUpdate({ address: { ...data.address, numero: v } })}
              />
              <Input
                label="Complemento (opcional)"
                placeholder="Apto, bloco, sala..."
                value={data.address.complemento}
                onChangeText={(v) => onUpdate({ address: { ...data.address, complemento: v } })}
              />
            </View>
          ) : null}
        </View>
      )}

      {/* Manual Form */}
      {data.locationType === 'manual' && (
        <View className="gap-1">
          <Input
            label="CEP"
            placeholder="00000-000"
            keyboardType="numeric"
            value={data.address.cep}
            onChangeText={(v) => handleCEPLookup(v)}
            maxLength={9}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="Estado" placeholder="SP" value={data.address.estado} onChangeText={(v) => onUpdate({ address: { ...data.address, estado: v } })} />
            </View>
            <View className="flex-[2]">
              <Input label="Cidade" placeholder="São Paulo" value={data.address.cidade} onChangeText={(v) => onUpdate({ address: { ...data.address, cidade: v } })} />
            </View>
          </View>
          <Input label="Bairro" placeholder="Centro" value={data.address.bairro} onChangeText={(v) => onUpdate({ address: { ...data.address, bairro: v } })} />
          <Input label="Rua" placeholder="Av. Principal" value={data.address.rua} onChangeText={(v) => onUpdate({ address: { ...data.address, rua: v } })} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="Número" placeholder="123" keyboardType="numeric" value={data.address.numero} onChangeText={(v) => onUpdate({ address: { ...data.address, numero: v } })} />
            </View>
            <View className="flex-[2]">
              <Input label="Complemento" placeholder="Opcional" value={data.address.complemento} onChangeText={(v) => onUpdate({ address: { ...data.address, complemento: v } })} />
            </View>
          </View>
        </View>
      )}

      {/* ===== MAP PREVIEW ===== */}
      {data.coordinates && (
        <View className="mt-4">
          <Text className="text-sm font-bold text-[#1E293B] mb-2 ml-1">Confirme no mapa</Text>
          <Text className="text-xs text-[#94A3B8] mb-3 ml-1">Arraste o marcador para ajustar a posição</Text>
          <View
            className="rounded-2xl overflow-hidden border border-slate-200"
            style={{ height: 220 }}
          >
            <MapView
              style={{ flex: 1 }}
              region={{
                latitude: data.coordinates.latitude,
                longitude: data.coordinates.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <Marker
                coordinate={data.coordinates}
                draggable
                onDragEnd={handleMapDrag}
              />
            </MapView>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
