import React from 'react';
import { Image, View } from 'react-native';
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

const CUSTOM_IMAGES: Record<string, any> = {
  'eventos': require('../../assets/icons/categories/Eventos.png'),
  'eletrica': require('../../assets/icons/categories/Eletrica.png'),
  'reformas_construcao': require('../../assets/icons/categories/Reformas e Construção.png'),
  'hidraulica': require('../../assets/icons/categories/Hidraulica.png'),
  'climatizacao': require('../../assets/icons/categories/Climatizacao.png'),
  'limpeza': require('../../assets/icons/categories/Limpeza.png'),
  'jardinagem_piscinas': require('../../assets/icons/categories/Jardinagem e Piscinas.png'),
  'instalacao_montagem': require('../../assets/icons/categories/Instalação e Montagem.png'),
  'mudancas_fretes': require('../../assets/icons/categories/Mudança e Fretes.png'),
  'cuidados': require('../../assets/icons/categories/Cuidados.png'),
  'beleza_bem_estar': require('../../assets/icons/categories/Beleza e Bem-estar.png'),
  'transporte': require('../../assets/icons/categories/Transporte.png'),
  'pets': require('../../assets/icons/categories/Pets.png'),
  'automotivo': require('../../assets/icons/categories/Automotivo.png'),
  'agronegocio': require('../../assets/icons/categories/Agronegocio.png'),
  'apoio_operacional': require('../../assets/icons/categories/Apoio Operacional.png'),
  'acoes_promocionais': require('../../assets/icons/categories/Ações Promocionais.png')
};

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
  id: string;
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
      id: foundByCat.id,
      icon: getIconComponentByName(foundByCat.icon, foundByCat.id),
      color: foundByCat.color,
      bgColor: foundByCat.bgColor,
      label: foundByCat.label
    };
  }

  // 2. Mapeamento refinado por palavras-chave (para profissões soltas ou textos descritivos)
  if (text.includes('evento') || text.includes('garcom') || text.includes('festa') || text.includes('bartender') || text.includes('dj') || text.includes('cerimonia') || text.includes('buffet') || text.includes('churras')) {
    return { id: 'eventos', icon: CalendarDays, color: '#F97316', bgColor: '#FFFFFF', label: 'Eventos' };
  }
  if (text.includes('reforma') || text.includes('pedreiro') || text.includes('pintor') || text.includes('gesseiro') || text.includes('construc') || text.includes('azulej') || text.includes('marcen')) {
    return { id: 'reformas_construcao', icon: Hammer, color: '#D97706', bgColor: '#FFFFFF', label: 'Reformas e Construção' };
  }
  if (text.includes('eletric') || text.includes('chuveiro') || text.includes('luminaria') || text.includes('luz') || text.includes('fiac') || text.includes('disjuntor')) {
    return { id: 'eletrica', icon: Zap, color: '#EAB308', bgColor: '#FFFFFF', label: 'Elétrica' };
  }
  if (text.includes('hidraul') || text.includes('encan') || text.includes('desentup') || text.includes('vazament') || text.includes('piscina') || text.includes('bombeiro')) {
    return { id: 'hidraulica', icon: Droplets, color: '#06B6D4', bgColor: '#FFFFFF', label: 'Hidráulica' };
  }
  if (text.includes('climatiz') || text.includes('ar-cond') || text.includes('ar cond') || text.includes('ventilador')) {
    return { id: 'climatizacao', icon: Wind, color: '#38BDF8', bgColor: '#FFFFFF', label: 'Climatização' };
  }
  if (text.includes('limpez') || text.includes('diarist') || text.includes('faxin') || text.includes('pos-obra')) {
    return { id: 'limpeza', icon: Sparkles, color: '#3B82F6', bgColor: '#FFFFFF', label: 'Limpeza' };
  }
  if (text.includes('jardim') || text.includes('jardin') || text.includes('grama') || text.includes('poda') || text.includes('paisag')) {
    return { id: 'jardinagem_piscinas', icon: TreeDeciduous, color: '#22C55E', bgColor: '#FFFFFF', label: 'Jardinagem e Piscinas' };
  }
  if (text.includes('instal') || text.includes('montad') || text.includes('desmontad') || text.includes('cortin') || text.includes('persian') || text.includes('tv')) {
    return { id: 'instalacao_montagem', icon: Wrench, color: '#64748B', bgColor: '#FFFFFF', label: 'Instalação e Montagem' };
  }
  if (text.includes('mudanca') || text.includes('frete') || text.includes('carreto') || text.includes('carregad') || text.includes('transport')) {
    return { id: 'mudancas_fretes', icon: Truck, color: '#8B5CF6', bgColor: '#FFFFFF', label: 'Mudanças e Fretes' };
  }
  if (text.includes('cuidad') || text.includes('baba') || text.includes('enferm') || text.includes('idoso') || text.includes('acompanh')) {
    return { id: 'cuidados', icon: Heart, color: '#EF4444', bgColor: '#FFFFFF', label: 'Cuidados' };
  }
  if (text.includes('belez') || text.includes('cabel') || text.includes('barbeiro') || text.includes('manicure') || text.includes('pedicure') || text.includes('maquia') || text.includes('massag')) {
    return { id: 'beleza_bem_estar', icon: Scissors, color: '#EC4899', bgColor: '#FFFFFF', label: 'Beleza e Bem-estar' };
  }
  if (text.includes('motorista') || text.includes('uber') || text.includes('carro')) {
    return { id: 'transporte', icon: Car, color: '#6366F1', bgColor: '#FFFFFF', label: 'Transporte' };
  }
  if (text.includes('pet') || text.includes('dog') || text.includes('gato') || text.includes('banho e tosa') || text.includes('adestrad')) {
    return { id: 'pets', icon: Dog, color: '#A855F7', bgColor: '#FFFFFF', label: 'Pets' };
  }
  if (text.includes('automotiv') || text.includes('mecanic') || text.includes('borrach') || text.includes('guincho') || text.includes('polid') || text.includes('lavad')) {
    return { id: 'automotivo', icon: Cog, color: '#475569', bgColor: '#FFFFFF', label: 'Automotivo' };
  }
  if (text.includes('agro') || text.includes('rural') || text.includes('trator') || text.includes('colhedor')) {
    return { id: 'agronegocio', icon: Sprout, color: '#16A34A', bgColor: '#FFFFFF', label: 'Agronegócio' };
  }
  if (text.includes('apoio') || text.includes('estoq') || text.includes('servicos gerais') || text.includes('ajudante')) {
    return { id: 'apoio_operacional', icon: ShieldCheck, color: '#0F766E', bgColor: '#FFFFFF', label: 'Apoio Operacional' };
  }
  if (text.includes('promoc') || text.includes('promotor') || text.includes('panflet') || text.includes('degustad') || text.includes('demonstrad')) {
    return { id: 'acoes_promocionais', icon: Megaphone, color: '#D946EF', bgColor: '#FFFFFF', label: 'Ações Promocionais' };
  }

  // Padrão elegante para categorias genéricas
  return { id: 'geral', icon: Briefcase, color: '#FF7A2F', bgColor: '#FFFFFF', label: 'Serviços Presenciais' };
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
  
  if (details.id && CUSTOM_IMAGES[details.id]) {
    return (
      <View style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <Image source={CUSTOM_IMAGES[details.id]} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
    );
  }

  const IconComponent = details.icon;
  const finalColor = color || details.color;

  return <IconComponent color={finalColor} size={size} strokeWidth={strokeWidth} />;
};
