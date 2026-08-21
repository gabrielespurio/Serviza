import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { FileText, Calendar, MapPin, CreditCard } from '../../../components/icons';
import { CategoryIcon } from '../../../components/CategoryIcon';
import { JobFormData } from '../CreateJobFlow';

interface StepReviewProps {
  data: JobFormData;
  onGoToStep: (step: number) => void;
}

function formatDate(date: Date | null): string {
  if (!date) return '—';
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
        icon={<CategoryIcon category={data.category || data.categoryLabel} profession={data.profession} color="#F97316" size={22} />}
        title="Informações da Vaga"
        onEdit={() => onGoToStep(0)}
      >
        <InfoRow label="Categoria" value={data.categoryLabel || data.category} />
        <InfoRow label="Profissão" value={data.profession} />
        <InfoRow label="Título" value={data.title} />
        <View>
          <Text className="text-sm text-[#94A3B8] mb-0.5">Descrição</Text>
          <Text className="text-[#1E293B] font-semibold text-[15px] leading-[22px]">
            {data.description || '—'}
          </Text>
        </View>
      </SectionCard>

      {/* Seção 2 — Data e Horário */}
      <SectionCard
        icon={<Calendar size={20} color="#F97316" />}
        title="Data e Horário"
        onEdit={() => onGoToStep(1)}
      >
        <InfoRow label="Data" value={formatDate(data.date)} />
        <InfoRow label="Horário" value={timeRange} />
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
