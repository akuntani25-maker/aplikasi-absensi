import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role: 'employee' | 'admin' | 'super_admin';
  department: string | null;
  position: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  face_enrolled: boolean;
  face_reference_id: string | null;
  face_enrolled_at: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setProfile: (profile) =>
    set({ profile }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  setInitialized: (isInitialized) =>
    set({ isInitialized }),

  reset: () =>
    set({ session: null, user: null, profile: null, isLoading: false }),
}));
