import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';

const registerSchema = z.object({
  full_name: z.string().min(3, 'Nama minimal 3 karakter').max(100),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await authService.register({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      });
      Alert.alert(
        'Registrasi Berhasil',
        'Akun Anda berhasil dibuat. Silakan login.',
        [{ text: 'Login', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (err: any) {
      Alert.alert(
        'Registrasi Gagal',
        err?.message === 'User already registered'
          ? 'Email sudah terdaftar. Gunakan email lain atau login.'
          : err?.message ?? 'Terjadi kesalahan. Silakan coba lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">A</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">Daftar Akun</Text>
            <Text className="mt-1 text-base text-gray-500">Buat akun karyawan baru</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nama Lengkap"
                  placeholder="Nama lengkap Anda"
                  autoComplete="name"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.full_name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="nama@perusahaan.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Minimal 8 karakter"
                  secureTextEntry
                  secureToggle
                  autoComplete="new-password"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Konfirmasi Password"
                  placeholder="Ulangi password"
                  secureTextEntry
                  secureToggle
                  autoComplete="new-password"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Button
              label="Daftar"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              onPress={handleSubmit(onSubmit)}
              className="mt-2"
            />

            <Button
              label="Sudah punya akun? Login"
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
