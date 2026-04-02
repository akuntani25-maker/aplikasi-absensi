import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ children, padding = 'md', className, ...props }: CardProps) {
  return (
    <View
      {...props}
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100
        ${paddingMap[padding]}
        ${className ?? ''}
      `.trim()}
    >
      {children}
    </View>
  );
}
