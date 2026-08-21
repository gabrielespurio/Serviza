export enum ProviderLevel {
  NEW = 'NEW',
  BEGINNER = 'BEGINNER',
  QUALIFIED = 'QUALIFIED',
  EXPERIENCED = 'EXPERIENCED',
  REFERENCE = 'REFERENCE',
  SPECIALIST = 'SPECIALIST'
}

export interface ProviderProfile {
  completedServices: number;
  level: ProviderLevel;
}

export interface ProviderLevelConfig {
  id: ProviderLevel;
  name: string; // Ex: '🌱 Novo', '🟢 Iniciante'
  label: string; // Ex: 'Novo', 'Iniciante'
  minServices: number;
  description: string;
  iconEmoji: string;
  color: string;
  bgColor: string;
  index: number;
}

/**
 * Configuração Única e Centralizada dos Níveis da Serviza
 * Permite fácil manutenção e expansão futura sem espalhar valores fixos pelo app.
 */
export const PROVIDER_LEVELS_CONFIG: ProviderLevelConfig[] = [
  {
    id: ProviderLevel.NEW,
    name: '🌱 Novo',
    label: 'Novo',
    minServices: 0,
    description: 'Começando sua jornada na Serviza.',
    iconEmoji: '🌱',
    color: '#10B981',
    bgColor: '#ECFDF5',
    index: 1
  },
  {
    id: ProviderLevel.BEGINNER,
    name: '🟢 Iniciante',
    label: 'Iniciante',
    minServices: 1,
    description: 'Você concluiu seu primeiro serviço na plataforma.',
    iconEmoji: '🟢',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    index: 2
  },
  {
    id: ProviderLevel.QUALIFIED,
    name: '🔵 Qualificado',
    label: 'Qualificado',
    minServices: 10,
    description: 'Você já possui experiência e vem construindo sua reputação.',
    iconEmoji: '🔵',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    index: 3
  },
  {
    id: ProviderLevel.EXPERIENCED,
    name: '🟣 Experiente',
    label: 'Experiente',
    minServices: 30,
    description: 'Você demonstra consistência e já conquistou a confiança de diversos contratantes.',
    iconEmoji: '🟣',
    color: '#9333EA',
    bgColor: '#F3E8FF',
    index: 4
  },
  {
    id: ProviderLevel.REFERENCE,
    name: '🏅 Referência',
    label: 'Referência',
    minServices: 60,
    description: 'Você é reconhecido como um profissional confiável e experiente dentro da plataforma.',
    iconEmoji: '🏅',
    color: '#D97706',
    bgColor: '#FEF3C7',
    index: 5
  },
  {
    id: ProviderLevel.SPECIALIST,
    name: '⭐ Especialista',
    label: 'Especialista',
    minServices: 100,
    description: 'Você alcançou o mais alto nível da Serviza, reservado aos profissionais com ampla experiência e histórico consistente.',
    iconEmoji: '⭐',
    color: '#FF7A2F',
    bgColor: '#FFF4ED',
    index: 6
  }
];

/**
 * Função Centralizada para determinar o nível do usuário
 * Retorna o ProviderLevel correto com base na quantidade de serviços concluídos.
 */
export function calculateProviderLevel(completedServices: number): ProviderLevel {
  const count = Math.max(0, Math.floor(completedServices || 0));
  for (let i = PROVIDER_LEVELS_CONFIG.length - 1; i >= 0; i--) {
    if (count >= PROVIDER_LEVELS_CONFIG[i].minServices) {
      return PROVIDER_LEVELS_CONFIG[i].id;
    }
  }
  return ProviderLevel.NEW;
}

/**
 * Retorna os detalhes completos do nível de acordo com o enum ProviderLevel
 */
export function getProviderLevelDetails(level: ProviderLevel): ProviderLevelConfig {
  const found = PROVIDER_LEVELS_CONFIG.find(l => l.id === level);
  return found || PROVIDER_LEVELS_CONFIG[0];
}

/**
 * Retorna os detalhes completos do nível diretamente com base na contagem de serviços concluídos
 */
export function getProviderLevelDetailsByServices(completedServices: number): ProviderLevelConfig {
  const levelEnum = calculateProviderLevel(completedServices);
  return getProviderLevelDetails(levelEnum);
}

/**
 * Calcula o progresso para a barra de progresso visual
 */
export function calculateProgressToNextLevel(completedServices: number) {
  const count = Math.max(0, Math.floor(completedServices || 0));
  const currentLevelConfig = getProviderLevelDetailsByServices(count);
  const currentIndex = PROVIDER_LEVELS_CONFIG.findIndex(l => l.id === currentLevelConfig.id);
  
  const isMaxLevel = currentIndex === PROVIDER_LEVELS_CONFIG.length - 1;
  const nextLevelConfig = isMaxLevel ? null : PROVIDER_LEVELS_CONFIG[currentIndex + 1];

  if (isMaxLevel || !nextLevelConfig) {
    return {
      currentLevel: currentLevelConfig,
      nextLevel: null,
      progressPercentage: 100,
      remainingServices: 0,
      isMaxLevel: true,
      progressString: '████████████████',
      statusText: '⭐ Você alcançou o nível máximo da Serviza.'
    };
  }

  const rangeStart = currentLevelConfig.minServices;
  const rangeEnd = nextLevelConfig.minServices;
  const totalNeed = rangeEnd - rangeStart;
  const currentProgress = count - rangeStart;
  const remainingServices = rangeEnd - count;

  const ratio = Math.min(1, Math.max(0, currentProgress / totalNeed));
  const progressPercentage = Math.round(ratio * 100);

  // Gerar barra ASCII visual (ex: ██████░░░░░) para exibição e depuração
  const totalBlocks = 16;
  const filledBlocks = Math.round(ratio * totalBlocks);
  const progressString = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);

  const statusText = `Faltam ${remainingServices} ${remainingServices === 1 ? 'serviço' : 'serviços'} para alcançar o nível ${nextLevelConfig.label}.`;

  return {
    currentLevel: currentLevelConfig,
    nextLevel: nextLevelConfig,
    progressPercentage,
    remainingServices,
    isMaxLevel: false,
    progressString,
    statusText
  };
}
