import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ title, variant = 'primary', isLoading, className, icon, ...props }: ButtonProps) {
  if (variant === 'primary') {
    return (
      <View
        className={`w-full rounded-2xl overflow-hidden ${className || ''} ${props.disabled ? 'opacity-50' : ''}`}
        style={Platform.select({
          ios: { shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
          android: { elevation: 6 },
          web: { boxShadow: '0px 8px 16px rgba(249, 115, 22, 0.3)' }
        })}
      >
        <TouchableOpacity
          className="w-full"
          disabled={isLoading || props.disabled}
          {...props}
        >
          <LinearGradient
            colors={['#F99D4C', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: '100%', height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
                <Text className="font-bold text-[17px] text-white text-center tracking-wide">
                  {title}
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (variant === 'outline') {
    return (
      <View
        className={`w-full rounded-2xl overflow-hidden border-2 border-[#F97316] ${className || ''} ${props.disabled ? 'opacity-50' : ''}`}
      >
        <TouchableOpacity
          style={{ width: '100%', height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}
          disabled={isLoading || props.disabled}
          {...props}
        >
          {isLoading ? (
            <ActivityIndicator color="#F97316" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
              <Text className="font-bold text-[17px] text-[#F97316] text-center tracking-wide">{title}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // ghost / secondary
  return (
    <TouchableOpacity
      className={`w-full rounded-2xl bg-slate-100 ${className || ''} ${props.disabled ? 'opacity-50' : ''}`}
      style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="#F97316" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
          <Text className="font-bold text-[17px] text-slate-800 text-center tracking-wide">{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
