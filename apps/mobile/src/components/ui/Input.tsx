import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  type TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Tampilkan toggle show/hide password */
  secureToggle?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  secureToggle,
  secureTextEntry,
  className,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isSecure = secureTextEntry && !showPassword;

  return (
    <View className="w-full gap-1">
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}

      <View
        className={`
          flex-row items-center
          bg-white border rounded-xl px-4 py-3
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className ?? ''}
        `.trim()}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <TextInput
          {...props}
          secureTextEntry={isSecure}
          className="flex-1 text-base text-gray-900"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
        />

        {secureToggle && (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} className="ml-2 p-1">
            <Text className="text-xs text-blue-600">
              {showPassword ? 'Sembunyikan' : 'Tampilkan'}
            </Text>
          </TouchableOpacity>
        )}

        {rightIcon && !secureToggle && (
          <View className="ml-2">{rightIcon}</View>
        )}
      </View>

      {error && <Text className="text-xs text-red-600">{error}</Text>}
      {hint && !error && <Text className="text-xs text-gray-500">{hint}</Text>}
    </View>
  );
}
