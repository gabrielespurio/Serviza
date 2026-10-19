import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { FileText, Calendar, MapPin, CreditCard } from '../../../components/icons';
import { CategoryIcon } from '../../../components/CategoryIcon';
import { JobFormData } from '../CreateJobFlow';

interface StepReviewProps {
  data: JobFormData;
  onGoToStep: (step: number) => void;
}

function formatDate(dateString: string | Date | null): string {
  if (!dateString) return '—';
  let date: Date;
  if (typeof dateString === 'string') {
    const [y, m, d] = dateString.split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = dateString;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(date: Date | null): string {
  if (!date) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatCurrency(value: string): string {
  if (!value) return '—';
  return `R$ ${value}`;
}

function formatAddress(address: JobFormData['address']): string {
  const parts: string[] = [];

  if (address.rua) {
    let line = address.rua;
    if (address.numero) line += `, ${address.numero}`;
    parts.push(line);
  }

  if (address.bairro) {
    parts.push(address.bairro);
  }

  if (address.cidade) {
    let line = address.cidade;
    if (address.estado) line += ` - ${address.estado}`;
    parts.push(line);
  } else if (address.estado) {
    parts.push(address.estado);
  }

  if (address.cep) {
    parts.push(`CEP: ${address.cep}`);
  }

  return parts.join(', ') || '—';
}

function getPaymentTypeLabel(type: string): string {
  switch (type) {
    case 'fixed':
      return 'Valor Fixo';
    case 'hourly':
      return 'Valor por Hora';
    default:
      return '—';
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3">
      <Text className="text-sm text-[#94A3B8] mb-0.5">{label}</Text>
      <Text className="text-[#1E293B] font-semibold text-[15px]">
        {value || '—'}
      </Text>
    </View>
  );
}

function SectionCard({
  icon,
  title,
  onEdit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className="font-bold text-[#1E293B] text-base">{title}</Text>
        </View>
        <TouchableOpacity onPress={onEdit} hitSlop={12}>
          <Text className="text-[#F97316] font-semibold text-sm">Editar</Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

export default function StepReview({ data, onGoToStep }: StepReviewProps) {
  const timeRange =
    data.startTime || data.endTime
      ? `${formatTime(data.startTime)} - ${formatTime(data.endTime)}`
      : '—';

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="mb-6">
        <Text className="text-2xl font-extrabold text-[#1E293B] mb-1">
          Revisão
        </Text>
        <Text className="text-[#64748B] text-[15px] leading-5">
          Confira todas as informações antes de publicar a vaga.
        </Text>
      </View>

      {/* Seção 1 — Informações da Vaga */}
      <SectionCard
        icon={
          <View className="w-7 h-7 items-center justify-center">
            <CategoryIcon category={data.category || data.categoryLabel} profession={data.profession} color="#F97316" size={22} />
          </View>
        }
        title="Informações da Vaga"
        onEdit={() => onGoToStep(0)}
      >
        <InfoRow label="Categoria" value={data.categoryLabel || data.category} />
        <InfoRow label="Profissão" value={data.profession} />
        <InfoRow label="Título" value={data.title} />
        <View className="mb-4">
          <Text className="text-sm text-[#94A3B8] mb-0.5">Descrição</Text>
          <Text className="text-[#1E293B] font-semibold text-[15px] leading-[22px]">
            {data.description || '—'}
          </Text>
        </View>
        
        {data.photos && data.photos.length > 0 && (
          <View>
            <Text className="text-sm text-[#94A3B8] mb-2">Fotos do Serviço</Text>
            <View className="flex-row flex-wrap gap-2">
              {data.photos.map((uri, index) => (
                <Image 
                  key={index} 
                  source={{ uri }} 
                  className="w-[70px] h-[70px] rounded-xl"
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>
        )}
      </SectionCard>

      {/* Seção 2 — Data e Horário */}
      <SectionCard
        icon={<Calendar size={20} color="#F97316" />}
        title="Data e Horário"
        onEdit={() => onGoToStep(1)}
      >
        {data.selectedDates && data.selectedDates.length > 0 ? (
          data.selectedDates.length === 1 ? (
            <>
              <InfoRow label="Data" value={formatDate(data.selectedDates[0])} />
              <InfoRow label="Horário" value={timeRange} />
            </>
          ) : (
            <View>
              <Text className="text-sm text-[#94A3B8] mb-2">Dias Selecionados ({data.selectedDates.length})</Text>
              {data.selectedDates.map((dateKey) => {
                let range = '—';
                if (data.scheduleType === 'same' && data.startTime && data.endTime) {
                  range = `${formatTime(data.startTime)} - ${formatTime(data.endTime)}`;
                } else if (data.scheduleType === 'different' && data.dateSchedules[dateKey]) {
                  const s = data.dateSchedules[dateKey].startTime;
                  const e = data.dateSchedules[dateKey].endTime;
                  if (s && e) {
                    range = `${formatTime(s)} - ${formatTime(e)}`;
                  }
                }
                
                return (
                  <View key={dateKey} className="flex-row items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-2">
                    <Text className="text-[#1E293B] font-semibold text-[14px]">
                      {formatDate(dateKey)}
                    </Text>
                    <Text className="text-[#64748B] text-[13px] font-medium">
                      {range}
                    </Text>
                  </View>
                );
              })}
            </View>
          )
        ) : (
          <>
            <InfoRow label="Data" value="—" />
            <InfoRow label="Horário" value="—" />
          </>
        )}
      </SectionCard>

      {/* Seção 3 — Localização */}
      <SectionCard
        icon={<MapPin size={20} color="#F97316" />}
        title="Localização"
        onEdit={() => onGoToStep(1)}
      >
        <InfoRow label="Endereço" value={formatAddress(data.address)} />
        {data.address.complemento ? (
          <InfoRow label="Complemento" value={data.address.complemento} />
        ) : null}
      </SectionCard>

      {/* Seção 4 — Pagamento */}
      <SectionCard
        icon={<CreditCard size={20} color="#F97316" />}
        title="Pagamento"
        onEdit={() => onGoToStep(2)}
      >
        <InfoRow label="Tipo" value={getPaymentTypeLabel(data.paymentType)} />
        <InfoRow label="Valor" value={formatCurrency(data.paymentValue)} />
        <InfoRow
          label="Forma de Pagamento"
          value={data.paymentMethod || '—'}
        />
      </SectionCard>
    </ScrollView>
  );
}
