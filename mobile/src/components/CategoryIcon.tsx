import React from 'react';
import { 
  CalendarDays, 
  Hammer, 
  Zap, 
  Droplets, 
  Wind, 
  Sparkles, 
  TreeDeciduous, 
  Wrench, 
  Truck, 
  Heart, 
  Scissors, 
  Car, 
  Dog, 
  Cog, 
  Sprout, 
  Briefcase, 
  Megaphone, 
  Package, 
  Paintbrush, 
  ShieldCheck, 
  Home, 
  Music, 
  Camera, 
  CheckCircle2, 
  Award 
} from './icons';
import { JOB_CATEGORIES, JobCategory } from '../data/jobCategories';

export interface CategoryIconProps {
  category?: string;
  profession?: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Função centralizada para retornar o ícone Lucide, cor principal e cor de fundo de qualquer categoria ou profissão.
 */
export function getCategoryIconAndColors(categoryOrProfession?: string): {
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  label: string;
} {
  const text = (categoryOrProfession || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // 1. Verificar primeiro por ID exato ou Label exato no JOB_CATEGORIES
  const foundByCat = JOB_CATEGORIES.find(
    c => c.id.toLowerCase() === text || 
         c.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === text ||
         c.professions.some(p => p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === text)
  );

  if (foundByCat) {
    return {
      icon: getIconComponentByName(foundByCat.icon, foundByCat.id),
      color: foundByCat.color,
      bgColor: foundByCat.bgColor,
      label: foundByCat.label
    };
  }

  // 2. Mapeamento refinado por palavras-chave (para profissões soltas ou textos descritivos)
  if (text.includes('evento') || text.includes('garcom') || text.includes('festa') || text.includes('bartender') || text.includes('dj') || text.includes('cerimonia') || text.includes('buffet') || text.includes('churras')) {
    return { icon: CalendarDays, color: '#F97316', bgColor: '#FFF4ED', label: 'Eventos' };
  }
  if (text.includes('reforma') || text.includes('pedreiro') || text.includes('pintor') || text.includes('gesseiro') || text.includes('construc') || text.includes('azulej') || text.includes('marcen')) {
    return { icon: Hammer, color: '#D97706', bgColor: '#FEF3C7', label: 'Reformas e Construção' };
  }
  if (text.includes('eletric') || text.includes('chuveiro') || text.includes('luminaria') || text.includes('luz') || text.includes('fiac') || text.includes('disjuntor')) {
    return { icon: Zap, color: '#EAB308', bgColor: '#FEF9C3', label: 'Elétrica' };
  }
  if (text.includes('hidraul') || text.includes('encan') || text.includes('desentup') || text.includes('vazament') || text.includes('piscina') || text.includes('bombeiro')) {
    return { icon: Droplets, color: '#06B6D4', bgColor: '#ECFEFF', label: 'Hidráulica' };
  }
  if (text.includes('climatiz') || text.includes('ar-cond') || text.includes('ar cond') || text.includes('ventilador')) {
    return { icon: Wind, color: '#38BDF8', bgColor: '#F0F9FF', label: 'Climatização' };
  }
  if (text.includes('limpez') || text.includes('diarist') || text.includes('faxin') || text.includes('pos-obra')) {
    return { icon: Sparkles, color: '#3B82F6', bgColor: '#EFF6FF', label: 'Limpeza' };
  }
  if (text.includes('jardim') || text.includes('jardin') || text.includes('grama') || text.includes('poda') || text.includes('paisag')) {
    return { icon: TreeDeciduous, color: '#22C55E', bgColor: '#F0FDF4', label: 'Jardinagem e Piscinas' };
  }
  if (text.includes('instal') || text.includes('montad') || text.includes('desmontad') || text.includes('cortin') || text.includes('persian') || text.includes('tv')) {
    return { icon: Wrench, color: '#64748B', bgColor: '#F1F5F9', label: 'Instalação e Montagem' };
  }
  if (text.includes('mudanca') || text.includes('frete') || text.includes('carreto') || text.includes('carregad') || text.includes('transport')) {
    return { icon: Truck, color: '#8B5CF6', bgColor: '#F5F3FF', label: 'Mudanças e Fretes' };
  }
  if (text.includes('cuidad') || text.includes('baba') || text.includes('enferm') || text.includes('idoso') || text.includes('acompanh')) {
    return { icon: Heart, color: '#EF4444', bgColor: '#FEF2F2', label: 'Cuidados' };
  }
  if (text.includes('belez') || text.includes('cabel') || text.includes('barbeiro') || text.includes('manicure') || text.includes('pedicure') || text.includes('maquia') || text.includes('massag')) {
    return { icon: Scissors, color: '#EC4899', bgColor: '#FDF2F8', label: 'Beleza e Bem-estar' };
  }
  if (text.includes('motorista') || text.includes('uber') || text.includes('carro')) {
    return { icon: Car, color: '#6366F1', bgColor: '#EEF2FF', label: 'Transporte' };
  }
  if (text.includes('pet') || text.includes('dog') || text.includes('gato') || text.includes('banho e tosa') || text.includes('adestrad')) {
    return { icon: Dog, color: '#A855F7', bgColor: '#FAF5FF', label: 'Pets' };
  }
  if (text.includes('automotiv') || text.includes('mecanic') || text.includes('borrach') || text.includes('guincho') || text.includes('polid') || text.includes('lavad')) {
    return { icon: Cog, color: '#475569', bgColor: '#F8FAFC', label: 'Automotivo' };
  }
  if (text.includes('agro') || text.includes('rural') || text.includes('trator') || text.includes('colhedor')) {
    return { icon: Sprout, color: '#16A34A', bgColor: '#F0FDF4', label: 'Agronegócio' };
  }
  if (text.includes('apoio') || text.includes('estoq') || text.includes('servicos gerais') || text.includes('ajudante')) {
    return { icon: ShieldCheck, color: '#0F766E', bgColor: '#F0FDFA', label: 'Apoio Operacional' };
  }
  if (text.includes('promoc') || text.includes('promotor') || text.includes('panflet') || text.includes('degustad') || text.includes('demonstrad')) {
    return { icon: Megaphone, color: '#D946EF', bgColor: '#FDF4FF', label: 'Ações Promocionais' };
  }
  if (text.includes('entreg') || text.includes('motoboy') || text.includes('pacote') || text.includes('bike')) {
    return { icon: Package, color: '#EA580C', bgColor: '#FFF7ED', label: 'Entregas e Pequenos Fretes' };
  }

  // Padrão elegante para categorias genéricas
  return { icon: Briefcase, color: '#FF7A2F', bgColor: '#FFF4ED', label: 'Serviços Presenciais' };
}

/**
 * Mapeamento do nome da string do ícone para o componente Lucide de alto nível.
 */
function getIconComponentByName(iconName?: string, categoryId?: string): React.ComponentType<any> {
  if (iconName === 'CalendarDays' || categoryId === 'eventos') return CalendarDays;
  if (iconName === 'Hammer' || categoryId === 'reformas_construcao') return Hammer;
  if (iconName === 'Zap' || categoryId === 'eletrica') return Zap;
  if (iconName === 'Droplets' || categoryId === 'hidraulica') return Droplets;
  if (iconName === 'Wind' || categoryId === 'climatizacao') return Wind;
  if (iconName === 'Sparkles' || categoryId === 'limpeza') return Sparkles;
  if (iconName === 'TreeDeciduous' || categoryId === 'jardinagem_piscinas') return TreeDeciduous;
  if (iconName === 'Wrench' || categoryId === 'instalacao_montagem') return Wrench;
  if (iconName === 'Truck' || categoryId === 'mudancas_fretes') return Truck;
  if (iconName === 'Heart' || categoryId === 'cuidados') return Heart;
  if (iconName === 'Scissors' || categoryId === 'beleza_bem_estar') return Scissors;
  if (iconName === 'Car' || categoryId === 'transporte') return Car;
  if (iconName === 'Dog' || categoryId === 'pets') return Dog;
  if (iconName === 'Cog' || categoryId === 'automotivo') return Cog;
  if (iconName === 'Sprout' || categoryId === 'agronegocio') return Sprout;
  if (iconName === 'Briefcase' && categoryId === 'apoio_operacional') return ShieldCheck;
  if (iconName === 'Megaphone' || categoryId === 'acoes_promocionais') return Megaphone;
  if (iconName === 'Package' || categoryId === 'entregas_fretes') return Package;

  return Briefcase;
}

/**
 * Componente CategoryIcon — Renderiza o ícone perfeito com as cores estilizadas da categoria.
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  profession,
  color,
  size = 20,
  strokeWidth = 2.3
}) => {
  const details = getCategoryIconAndColors(category || profession);
  const IconComponent = details.icon;
  const finalColor = color || details.color;

  return <IconComponent color={finalColor} size={size} strokeWidth={strokeWidth} />;
};
