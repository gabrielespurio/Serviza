import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from './icons';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export function Input({ label, error, className, isPassword, ...props }: InputProps) {
  const [isSecure, setIsSecure] = useState(isPassword);

  return (
    <View className={`w-full mb-5 ${className || ''}`}>
      <Text className="text-[#1E293B] text-[15px] mb-2 ml-1">
        {label}
      </Text>
      
      <View className="relative justify-center">
        <TextInput
          className={`w-full bg-white border ${
            error ? 'border-red-500' : 'border-slate-200'
          } rounded-[16px] px-5 py-[16px] text-[#1E293B] text-[16px]`}
          placeholderTextColor="#94A3B8"
          secureTextEntry={isSecure}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity 
            className="absolute right-4" 
            onPress={() => setIsSecure(!isSecure)}
          >
            {isSecure ? (
              <EyeOff color="#94A3B8" size={20} />
            ) : (
              <Eye color="#94A3B8" size={20} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text className="text-red-500 text-sm mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}
