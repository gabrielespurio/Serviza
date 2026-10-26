import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Calendar, Clock, MapPin, Navigation, Hash, PenLine, ChevronLeft, ChevronRight, Check } from '../../../components/icons';
import { Input } from '../../../components/Input';
import axios from 'axios';
import { JobFormData } from '../CreateJobFlow';

interface StepProps {
  data: JobFormData;
  onUpdate: (updates: Partial<JobFormData>) => void;
}

// ========== CUSTOM CALENDAR COMPONENT ==========

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];
  const monthName = MONTHS[date.getMonth()].substring(0, 3);
  return `${weekday}, ${d} de ${monthName}`;
}

interface InlineCalendarProps {
  selectedDates: string[];
  onToggleDate: (dateKey: string) => void;
}

function InlineCalendar({ selectedDates, onToggleDate }: InlineCalendarProps) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: Array<{ day: number; dateKey: string; disabled: boolean } | null> = [];

    // Padding for days before month starts
    for (let i = 0; i < startPad; i++) days.push(null);

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateKey = toDateKey(date);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      days.push({ day: d, dateKey, disabled: isPast });
    }

    return days;
  }, [viewMonth, viewYear]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isPrevDisabled = viewYear === today.getFullYear() && viewMonth <= today.getMonth();

  return (
    <View className="bg-white rounded-[20px] border border-slate-100 overflow-hidden mb-4">
      {/* Month Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-50">
        <TouchableOpacity
          onPress={goToPrevMonth}
          disabled={isPrevDisabled}
          className={`w-9 h-9 rounded-full items-center justify-center ${isPrevDisabled ? 'opacity-30' : 'bg-slate-50'}`}
        >
          <ChevronLeft color="#64748B" size={18} />
        </TouchableOpacity>
        <Text className="text-[#1E293B] text-[16px] font-extrabold">
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity
          onPress={goToNextMonth}
          className="w-9 h-9 rounded-full items-center justify-center bg-slate-50"
        >
          <ChevronRight color="#64748B" size={18} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View className="flex-row px-3 pt-3 pb-1">
        {WEEKDAYS.map(wd => (
          <View key={wd} style={{ flex: 1, alignItems: 'center' }}>
            <Text className="text-[11px] font-bold text-[#94A3B8] uppercase">{wd}</Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View className="px-3 pb-4">
        {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIdx) => (
          <View key={weekIdx} className="flex-row" style={{ marginTop: 4 }}>
            {calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((dayObj, colIdx) => {
              if (!dayObj) {
                return <View key={`pad-${colIdx}`} style={{ flex: 1, height: 44 }} />;
              }

              const isSelected = selectedDates.includes(dayObj.dateKey);
              const isToday = dayObj.dateKey === todayKey;

              return (
                <TouchableOpacity
                  key={dayObj.dateKey}
                  disabled={dayObj.disabled}
                  onPress={() => onToggleDate(dayObj.dateKey)}
                  style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      isSelected
                        ? 'bg-[#F97316]'
                        : isToday
                        ? 'border-2 border-[#F97316]'
                        : ''
                    }`}
                  >
                    <Text
                      className={`text-[15px] font-semibold ${
                        dayObj.disabled
                          ? 'text-slate-200'
                          : isSelected
                          ? 'text-white'
                          : isToday
                          ? 'text-[#F97316]'
                          : 'text-[#334155]'
                      }`}
                    >
                      {dayObj.day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {/* Pad remaining cells if last row is incomplete */}
            {weekIdx === Math.ceil(calendarDays.length / 7) - 1 &&
              calendarDays.length % 7 !== 0 &&
              Array.from({ length: 7 - (calendarDays.length % 7) }).map((_, padIdx) => (
                <View key={`endpad-${padIdx}`} style={{ flex: 1, height: 44 }} />
              ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ========== MAIN COMPONENT ==========

export default function StepLocation({ data, onUpdate }: StepProps) {
  // Time picker state
  const [activeTimePicker, setActiveTimePicker] = useState<{
    type: 'start' | 'end';
    dateKey?: string; // undefined = global, string = per-day
  } | null>(null);

  // Location state
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);

  // ========== DATE HANDLERS ==========

  const handleToggleDate = (dateKey: string) => {
    const current = [...(data.selectedDates || [])];
    const idx = current.indexOf(dateKey);
    if (idx >= 0) {
      current.splice(idx, 1);
      const newSchedules = { ...(data.dateSchedules || {}) };
      delete newSchedules[dateKey];
      onUpdate({ selectedDates: current.sort(), dateSchedules: newSchedules });
    } else {
      current.push(dateKey);
      onUpdate({ selectedDates: current.sort() });
    }
    if (current.length <= 1) {
      onUpdate({ selectedDates: current.sort(), scheduleType: '' });
    }
  };

  // ========== TIME HANDLERS ==========

  const onTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS !== 'ios') setActiveTimePicker(null);
    if (!selectedTime || !activeTimePicker) return;

    if (activeTimePicker.dateKey) {
      // Per-day time
      const key = activeTimePicker.dateKey;
      const existing = data.dateSchedules[key] || { startTime: null, endTime: null };
      const updated = {
        ...existing,
        [activeTimePicker.type === 'start' ? 'startTime' : 'endTime']: selectedTime,
      };
      onUpdate({ dateSchedules: { ...data.dateSchedules, [key]: updated } });
    } else {
      // Global time
      onUpdate({
        [activeTimePicker.type === 'start' ? 'startTime' : 'endTime']: selectedTime,
      });
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const getTimePickerValue = (): Date => {
    if (!activeTimePicker) return new Date();
    if (activeTimePicker.dateKey) {
      const sched = data.dateSchedules[activeTimePicker.dateKey];
      if (activeTimePicker.type === 'start') return sched?.startTime || new Date();
      return sched?.endTime || new Date();
    }
    return activeTimePicker.type === 'start' ? (data.startTime || new Date()) : (data.endTime || new Date());
  };

  // ========== SCHEDULE TYPE ==========

  const handleScheduleType = (type: 'same' | 'different') => {
    onUpdate({ scheduleType: type });
    if (type === 'same') {
      // Clear per-day schedules
      onUpdate({ scheduleType: type, dateSchedules: {} });
    } else {
      // Clear global times
      onUpdate({ scheduleType: type, startTime: null, endTime: null });
    }
  };

  // ========== LOCATION HANDLERS ==========

  // Normaliza nomes de rua para comparação (remove acentos, prefixos e pontuação)
  const normalizeStreet = (s: string = '') =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/^(rua|r\.|avenida|av\.?|alameda|al\.|travessa|tv\.|estrada|rodovia|praca|pca\.)\s+/i, '')
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const streetsMatch = (a?: string, b?: string) => {
    const na = normalizeStreet(a);
    const nb = normalizeStreet(b);
    return !!na && !!nb && (na === nb || na.includes(nb) || nb.includes(na));
  };

  // Converte coordenadas em endereço. O geocoder nativo (Apple/Google) costuma acertar
  // a rua, mas no Brasil frequentemente retorna um bairro desatualizado/genérico.
  // Por isso o resultado é validado com o ViaCEP (base oficial dos Correios).
  const resolveAddressFromCoords = async (latitude: number, longitude: number) => {
    const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });

    const address = {
      cep: geo?.postalCode || '',
      estado: geo?.region || '',
      cidade: geo?.city || geo?.subregion || '',
      bairro: geo?.district || '',
      rua: geo?.street || '',
      numero: geo?.streetNumber || '',
      complemento: '',
    };

    const applyViaCep = (v: any) => {
      address.bairro = v.bairro || address.bairro;
      address.cidade = v.localidade || address.cidade;
      address.estado = v.uf || address.estado;
      address.rua = v.logradouro || address.rua;
      address.cep = v.cep || address.cep;
    };

    try {
      // 1) Consulta pelo CEP retornado pelo GPS — só aceita se a rua bater
      const cleanCep = address.cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        const res = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`, { timeout: 5000 });
        if (!res.data?.erro && streetsMatch(res.data.logradouro, address.rua)) {
          applyViaCep(res.data);
          return address;
        }
      }

      // 2) Fallback: busca por UF/Cidade/Rua no ViaCEP
      const uf = address.estado.length === 2 ? address.estado : '';
      if (uf && address.cidade && normalizeStreet(address.rua).length >= 3) {
        const url = `https://viacep.com.br/ws/${encodeURIComponent(uf)}/${encodeURIComponent(address.cidade)}/${encodeURIComponent(address.rua)}/json/`;
        const res = await axios.get(url, { timeout: 5000 });
        const list: any[] = Array.isArray(res.data) ? res.data.filter((r) => streetsMatch(r.logradouro, address.rua)) : [];
        const bairros = Array.from(new Set(list.map((r) => r.bairro)));
        // Só aplica se não houver ambiguidade (mesma rua em bairros diferentes)
        if (list.length > 0 && bairros.length === 1) {
          applyViaCep(list[0]);
        }
      }
    } catch (e) {
      // ViaCEP indisponível: mantém o resultado do geocoder nativo
    }

    return address;
  };

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

      const address = await resolveAddressFromCoords(latitude, longitude);

      onUpdate({
        coordinates: { latitude, longitude },
        address,
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

          try {
            const fullAddress = `${newAddress.rua}, ${newAddress.bairro}, ${newAddress.cidade}, ${newAddress.estado}, Brasil`;
            const coords = await Location.geocodeAsync(fullAddress);
            if (coords.length > 0) {
              onUpdate({ coordinates: { latitude: coords[0].latitude, longitude: coords[0].longitude } });
            }
          } catch (geoErr) {}
        }
      } catch (err) {}
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

  const handleMapDrag = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    onUpdate({ coordinates: { latitude, longitude } });

    // No modo GPS o endereço exibido vem das coordenadas: recalcular ao mover o marcador
    if (data.locationType === 'gps') {
      try {
        const address = await resolveAddressFromCoords(latitude, longitude);
        // Mantém o número digitado pelo usuário se continuar na mesma rua
        const keepNumero = streetsMatch(address.rua, data.address?.rua) && data.address?.numero;
        onUpdate({
          coordinates: { latitude, longitude },
          address: { ...address, numero: keepNumero ? data.address.numero : address.numero },
        });
      } catch (err) {}
    }
  };

  const hasAddress = data.address?.rua || data.address?.cidade;
  const safeSelectedDates = data.selectedDates || [];
  const safeDateSchedules = data.dateSchedules || {};
  const multiDay = safeSelectedDates.length > 1;
  const singleDay = safeSelectedDates.length === 1;

  // ========== RENDER ==========

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* ===== DATE SECTION ===== */}
      <Text className="text-lg font-extrabold text-[#1E293B] mb-1">Quando será o serviço?</Text>
      <Text className="text-[#94A3B8] text-sm mb-4">Toque nos dias desejados no calendário</Text>

      {/* Inline Calendar */}
      <InlineCalendar
        selectedDates={safeSelectedDates}
        onToggleDate={handleToggleDate}
      />

      {/* Selected Days Counter */}
      {safeSelectedDates.length > 0 && (
        <View className="bg-[#FFF4ED] rounded-2xl px-4 py-3 mb-5 flex-row items-center">
          <Calendar color="#F97316" size={18} />
          <Text className="text-[#F97316] text-[14px] font-bold ml-2.5">
            {singleDay
              ? `1 dia selecionado — ${formatDateLabel(safeSelectedDates[0])}`
              : `${safeSelectedDates.length} dias selecionados`}
          </Text>
        </View>
      )}

      {/* ===== TIME SECTION ===== */}
      {singleDay && (
        <>
          <Text className="text-[15px] font-bold text-[#1E293B] mb-3">Horário do serviço</Text>
          <View className="flex-row gap-3 mb-5">
            <TouchableOpacity
              className="flex-1 bg-white border border-slate-200 rounded-[16px] px-4 py-4 flex-row items-center"
              onPress={() => setActiveTimePicker({ type: 'start' })}
            >
              <Clock color="#F97316" size={18} />
              <Text className={`ml-2 text-[15px] ${data.startTime ? 'text-[#1E293B] font-semibold' : 'text-[#94A3B8]'}`}>
                {data.startTime ? formatTime(data.startTime) : 'Início'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white border border-slate-200 rounded-[16px] px-4 py-4 flex-row items-center"
              onPress={() => setActiveTimePicker({ type: 'end' })}
            >
              <Clock color="#94A3B8" size={18} />
              <Text className={`ml-2 text-[15px] ${data.endTime ? 'text-[#1E293B] font-semibold' : 'text-[#94A3B8]'}`}>
                {data.endTime ? formatTime(data.endTime) : 'Término'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {multiDay && (
        <>
          <Text className="text-[15px] font-bold text-[#1E293B] mb-1">Configuração de horários</Text>
          <Text className="text-[#94A3B8] text-[13px] mb-4">Os horários serão iguais em todos os dias?</Text>

          {/* Schedule Type Toggle */}
          <View className="flex-row gap-3 mb-5">
            <TouchableOpacity
              className={`flex-1 rounded-[18px] p-4 items-center border-2 ${
                data.scheduleType === 'same'
                  ? 'border-[#F97316] bg-[#FFF4ED]'
                  : 'border-slate-200 bg-white'
              }`}
              onPress={() => handleScheduleType('same')}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
                data.scheduleType === 'same' ? 'bg-[#F97316]' : 'bg-slate-100'
              }`}>
                <Clock color={data.scheduleType === 'same' ? '#fff' : '#94A3B8'} size={20} />
              </View>
              <Text className={`text-[14px] font-bold text-center ${
                data.scheduleType === 'same' ? 'text-[#F97316]' : 'text-[#1E293B]'
              }`}>
                Mesmo horário
              </Text>
              <Text className={`text-[11px] text-center mt-0.5 ${
                data.scheduleType === 'same' ? 'text-[#F97316]/70' : 'text-[#94A3B8]'
              }`}>
                Para todos os dias
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 rounded-[18px] p-4 items-center border-2 ${
                data.scheduleType === 'different'
                  ? 'border-[#F97316] bg-[#FFF4ED]'
                  : 'border-slate-200 bg-white'
              }`}
              onPress={() => handleScheduleType('different')}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
                data.scheduleType === 'different' ? 'bg-[#F97316]' : 'bg-slate-100'
              }`}>
                <Calendar color={data.scheduleType === 'different' ? '#fff' : '#94A3B8'} size={20} />
              </View>
              <Text className={`text-[14px] font-bold text-center ${
                data.scheduleType === 'different' ? 'text-[#F97316]' : 'text-[#1E293B]'
              }`}>
                Horários diferentes
              </Text>
              <Text className={`text-[11px] text-center mt-0.5 ${
                data.scheduleType === 'different' ? 'text-[#F97316]/70' : 'text-[#94A3B8]'
              }`}>
                Personalizar cada dia
              </Text>
            </TouchableOpacity>
          </View>

          {/* Same Time Fields */}
          {data.scheduleType === 'same' && (
            <View className="mb-5">
              <Text className="text-[13px] font-semibold text-[#64748B] mb-3 ml-1">
                Horário que vale para todos os {safeSelectedDates.length} dias:
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-white border border-slate-200 rounded-[16px] px-4 py-4 flex-row items-center"
                  onPress={() => setActiveTimePicker({ type: 'start' })}
                >
                  <Clock color="#F97316" size={18} />
                  <Text className={`ml-2 text-[15px] ${data.startTime ? 'text-[#1E293B] font-semibold' : 'text-[#94A3B8]'}`}>
                    {data.startTime ? formatTime(data.startTime) : 'Início'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-white border border-slate-200 rounded-[16px] px-4 py-4 flex-row items-center"
                  onPress={() => setActiveTimePicker({ type: 'end' })}
                >
                  <Clock color="#94A3B8" size={18} />
                  <Text className={`ml-2 text-[15px] ${data.endTime ? 'text-[#1E293B] font-semibold' : 'text-[#94A3B8]'}`}>
                    {data.endTime ? formatTime(data.endTime) : 'Término'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Different Time — Per-Day Cards */}
          {data.scheduleType === 'different' && (
            <View className="mb-5 gap-3">
              {safeSelectedDates.map(dateKey => {
                const sched = safeDateSchedules[dateKey] || { startTime: null, endTime: null };
                const isComplete = sched.startTime && sched.endTime;
                return (
                  <View
                    key={dateKey}
                    className={`bg-white rounded-[18px] border p-4 ${
                      isComplete ? 'border-[#34D399]/40' : 'border-slate-200'
                    }`}
                  >
                    <View className="flex-row items-center mb-3">
                      <Calendar color="#F97316" size={16} />
                      <Text className="text-[#1E293B] text-[14px] font-bold ml-2">
                        {formatDateLabel(dateKey)}
                      </Text>
                      {isComplete && (
                        <View className="ml-auto w-6 h-6 rounded-full bg-[#34D399] items-center justify-center">
                          <Check color="#fff" size={14} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 flex-row items-center"
                        onPress={() => setActiveTimePicker({ type: 'start', dateKey })}
                      >
                        <Clock color="#F97316" size={16} />
                        <Text className={`ml-2 text-[14px] ${sched.startTime ? 'text-[#1E293B] font-semibold' : 'text-[#94A3B8]'}`}>
                          {sched.startTime ? formatTime(sched.startTime) : 'Início'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 flex-row items-center"
                        onPress={() => setActiveTimePicker({ type: 'end', dateKey })}
                      >
                        <Clock color="#94A3B8" size={16} />
                        <Text className={`ml-2 text-[14px] ${sched.endTime ? 'text-[#1E293B] font-semibold' : 'text-[#94A3B8]'}`}>
                          {sched.endTime ? formatTime(sched.endTime) : 'Término'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      {/* Time Picker Modal (shared) */}
      {activeTimePicker && (
        <View className="bg-white rounded-2xl mb-4 overflow-hidden border border-slate-100">
          <DateTimePicker
            value={getTimePickerValue()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
            is24Hour
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity className="py-3 items-center border-t border-slate-100" onPress={() => setActiveTimePicker(null)}>
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

      {/* ===== PRIVACY TOGGLE ===== */}
      <View className="mt-8 mb-6 bg-white rounded-2xl border border-[#F97316]/30 p-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1 pr-3">
            <View className="w-8 h-8 rounded-full bg-[#FFF4ED] items-center justify-center mr-3">
              <MapPin color="#F97316" size={16} />
            </View>
            <Text className="text-[15px] font-bold text-[#1E293B]">Privacidade do Endereço</Text>
          </View>
          <Switch
            value={data.hideExactLocationUntilHired !== false} // defaults to true
            onValueChange={(val) => onUpdate({ hideExactLocationUntilHired: val })}
            trackColor={{ false: '#CBD5E1', true: '#F97316' }}
            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (data.hideExactLocationUntilHired !== false ? '#FFFFFF' : '#F8FAFC')}
          />
        </View>
        <Text className="text-[13px] text-[#64748B] leading-relaxed mt-1">
          {data.hideExactLocationUntilHired !== false
            ? 'Oculte o endereço exato. Os candidatos verão apenas uma área de 500m aproximada. O endereço completo só é revelado para o prestador que você confirmar.'
            : 'O endereço exato e o mapa preciso serão exibidos para todos os prestadores que visualizarem sua vaga.'}
        </Text>
      </View>
    </ScrollView>
  );
}
