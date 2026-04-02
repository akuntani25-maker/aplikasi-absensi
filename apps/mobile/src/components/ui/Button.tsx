import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary:   { container: 'bg-blue-600 active:bg-blue-700',     text: 'text-white font-semibold' },
  secondary: { container: 'bg-gray-100 active:bg-gray-200',     text: 'text-gray-800 font-semibold' },
  outline:   { container: 'border border-blue-600 bg-transparent active:bg-blue-50', text: 'text-blue-600 font-semibold' },
  ghost:     { container: 'bg-transparent active:bg-gray-100',  text: 'text-blue-600 font-medium' },
  danger:    { container: 'bg-red-600 active:bg-red-700',       text: 'text-white font-semibold' },
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-4 py-2 rounded-lg',    text: 'text-sm' },
  md: { container: 'px-5 py-3 rounded-xl',    text: 'text-base' },
  lg: { container: 'px-6 py-4 rounded-2xl',   text: 'text-lg' },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      {...props}
      disabled={isDisabled}
      className={`
        ${v.container} ${s.container}
        flex-row items-center justify-center gap-2
        ${fullWidth ? 'w-full' : 'self-start'}
        ${isDisabled ? 'opacity-50' : ''}
        ${className ?? ''}
      `.trim()}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' || variant === 'danger' ? '#fff' : '#2563eb'} />}
      <Text className={`${v.text} ${s.text}`}>{label}</Text>
    </TouchableOpacity>
  );
}
