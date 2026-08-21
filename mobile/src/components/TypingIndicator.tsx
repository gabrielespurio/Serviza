import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

export function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(400) // Pausa entre os ciclos
          ])
        )
      ]);
    };

    Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 200),
      animateDot(dot3, 400),
    ]).start();
  }, [dot1, dot2, dot3]);

  const translateY1 = dot1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6]
  });

  const translateY2 = dot2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6]
  });

  const translateY3 = dot3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6]
  });

  return (
    <View className="flex-row items-center h-6 px-1 space-x-1 gap-1">
      <Animated.View style={{ transform: [{ translateY: translateY1 }] }} className="w-2 h-2 bg-slate-400 rounded-full" />
      <Animated.View style={{ transform: [{ translateY: translateY2 }] }} className="w-2 h-2 bg-slate-400 rounded-full" />
      <Animated.View style={{ transform: [{ translateY: translateY3 }] }} className="w-2 h-2 bg-slate-400 rounded-full" />
    </View>
  );
}
