import { View, Text } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  success: { container: 'bg-green-100',  text: 'text-green-700' },
  warning: { container: 'bg-yellow-100', text: 'text-yellow-700' },
  danger:  { container: 'bg-red-100',    text: 'text-red-700' },
  info:    { container: 'bg-blue-100',   text: 'text-blue-700' },
  neutral: { container: 'bg-gray-100',   text: 'text-gray-600' },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <View className={`${styles.container} px-2.5 py-1 rounded-full self-start`}>
      <Text className={`${styles.text} text-xs font-medium`}>{label}</Text>
    </View>
  );
}
