import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../../stores/useAuthStore';
import { useAuthActions } from '../../../hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-800 flex-1 text-right">{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile } = useAuthStore();
  const { logout } = useAuthActions();

  const handleLogout = () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerClassName="p-6 gap-5" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-gray-900">Profil</Text>

        {/* Avatar & Name */}
        <Card className="items-center py-6 gap-3">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center">
            <Text className="text-3xl font-bold text-blue-600">
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">{profile?.full_name}</Text>
          <Text className="text-sm text-gray-500">{profile?.employee_id}</Text>
          <Badge
            label={profile?.role === 'admin' ? 'Admin' : 'Karyawan'}
            variant={profile?.role === 'admin' ? 'info' : 'neutral'}
          />
        </Card>

        {/* Info Karyawan */}
        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-2">Informasi Akun</Text>
          <InfoRow label="Email" value={profile?.email ?? '-'} />
          <InfoRow label="Departemen" value={profile?.department ?? '-'} />
          <InfoRow label="Jabatan" value={profile?.position ?? '-'} />
          <InfoRow label="Telepon" value={profile?.phone ?? '-'} />
        </Card>

        {/* Status Wajah */}
        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-2">Face Recognition</Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-500">Status Pendaftaran</Text>
            <Badge
              label={profile?.face_enrolled ? 'Terdaftar' : 'Belum Terdaftar'}
              variant={profile?.face_enrolled ? 'success' : 'warning'}
            />
          </View>
        </Card>

        {/* Logout */}
        <Button label="Keluar" variant="danger" fullWidth onPress={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}
