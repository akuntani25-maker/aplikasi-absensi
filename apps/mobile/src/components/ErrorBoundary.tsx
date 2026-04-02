import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: kirim ke Sentry / error tracking
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6">
          <Text className="text-4xl">⚠️</Text>
          <Text className="text-xl font-bold text-gray-900 mt-4 text-center">
            Terjadi Kesalahan
          </Text>
          <Text className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
            {this.state.error?.message ?? 'Kesalahan yang tidak diketahui.'}
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            className="mt-6 bg-blue-600 px-8 py-3 rounded-xl"
            accessibilityRole="button"
            accessibilityLabel="Coba lagi"
          >
            <Text className="text-white font-semibold text-base">Coba Lagi</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
