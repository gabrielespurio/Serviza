import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { ProviderLevelConfig } from '../services/providerLevels';

interface LevelUpCelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  levelConfig: ProviderLevelConfig | null;
}

const { width, height } = Dimensions.get('window');

// Gerar partículas comemorativas leves para animação limpa e fluida sem bibliotecas externas
const PARTICLES = [
  { emoji: '✨', left: width * 0.15, delay: 0 },
  { emoji: '🎉', left: width * 0.3, delay: 150 },
  { emoji: '🌟', left: width * 0.5, delay: 300 },
  { emoji: '🎊', left: width * 0.7, delay: 100 },
  { emoji: '✨', left: width * 0.85, delay: 250 },
  { emoji: '💫', left: width * 0.25, delay: 400 },
  { emoji: '🎈', left: width * 0.65, delay: 350 },
];

export const LevelUpCelebrationModal: React.FC<LevelUpCelebrationModalProps> = ({
  visible,
  onClose,
  levelConfig
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(PARTICLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      particleAnims.forEach(anim => anim.setValue(0));

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true
        }),
        ...particleAnims.map((anim, idx) =>
          Animated.sequence([
            Animated.delay(PARTICLES[idx].delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true
            })
          ])
        )
      ]).start();
    }
  }, [visible]);

  if (!levelConfig) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/75 items-center justify-center px-6">
        {/* Partículas Flutuantes Animadas */}
        {PARTICLES.map((particle, idx) => {
          const translateY = particleAnims[idx].interpolate({
            inputRange: [0, 1],
            outputRange: [height * 0.4, -100]
          });
          const opacity = particleAnims[idx].interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, 1, 1, 0]
          });

          return (
            <Animated.Text
              key={idx}
              style={{
                position: 'absolute',
                left: particle.left,
                top: height * 0.45,
                fontSize: 28,
                transform: [{ translateY }],
                opacity
              }}
            >
              {particle.emoji}
            </Animated.Text>
          );
        })}

        {/* Card Principal Comemorativo */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            backgroundColor: '#FFFFFF',
            borderRadius: 36,
            padding: 28,
            width: '100%',
            maxWidth: 360,
            alignItems: 'center',
            shadowColor: '#FF7A2F',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10
          }}
        >
          <View className="w-20 h-20 rounded-full bg-[#FFF4ED] items-center justify-center mb-4 border-2 border-[#FF7A2F]/30 shadow-xs">
            <Text className="text-[44px]">{levelConfig.iconEmoji}</Text>
          </View>

          <Text className="text-2xl font-black text-[#1E293B] text-center mb-1">
            🎉 Parabéns!
          </Text>
          <Text className="text-sm font-semibold text-[#64748B] text-center mb-5">
            Você acaba de alcançar um novo nível.
          </Text>

          {/* Destaque do Nível Conquistado */}
          <View 
            className="w-full rounded-2xl py-4 px-5 items-center justify-center mb-5 border"
            style={{ backgroundColor: levelConfig.bgColor, borderColor: levelConfig.color + '50' }}
          >
            <Text className="text-2xl font-black" style={{ color: levelConfig.color }}>
              {levelConfig.name}
            </Text>
            <Text className="text-xs font-extrabold text-[#64748B] mt-1">
              {levelConfig.minServices} {levelConfig.minServices === 1 ? 'serviço concluído' : 'serviços concluídos'}
            </Text>
          </View>

          <Text className="text-xs font-medium text-[#475569] text-center mb-7 leading-relaxed px-2">
            Continue prestando um excelente serviço para evoluir ainda mais na Serviza.
          </Text>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onClose}
            className="w-full bg-[#FF7A2F] rounded-2xl py-4 items-center justify-center shadow-md"
          >
            <Text className="text-white font-extrabold text-base">
              Continuar
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};
