import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { authService } from '../services/authService';

/**
 * Hook untuk inisialisasi auth state dan listen perubahan session.
 * Dipanggil sekali di root _layout.tsx.
 */
export function useAuthInit() {
  const { setSession, setProfile, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    // Load session yang tersimpan
    authService.getSession().then(async (session) => {
      setSession(session);

      if (session?.user) {
        try {
          const profile = await authService.getProfile(session.user.id);
          setProfile(profile);
        } catch {
          // Profile belum ada, biarkan null
        }
      }

      setInitialized(true);
    });

    // Listen perubahan auth state
    const { data: listener } = authService.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (session?.user) {
        try {
          const profile = await authService.getProfile(session.user.id);
          setProfile(profile);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [setSession, setProfile, setLoading, setInitialized]);
}

/**
 * Hook untuk aksi login/logout di komponen.
 */
export function useAuthActions() {
  const { setLoading, reset } = useAuthStore();

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.login({ email, password });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      reset();
    } finally {
      setLoading(false);
    }
  };

  return { login, logout };
}
