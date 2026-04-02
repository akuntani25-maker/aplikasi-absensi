# Project: [Nama Project]

## Stack
- **Framework**: React Native 0.79+ (New Architecture default)
- **Navigation**: Expo Router v4 (file-based routing) atau React Navigation v7
- **Language**: TypeScript (strict mode)
- **Styling**: NativeWind v4 (Tailwind for RN) atau StyleSheet
- **State**: Zustand (client) + TanStack Query (server state)
- **API**: TanStack Query + fetch/axios (atau tRPC client)
- **Storage**: expo-secure-store (sensitive), MMKV (fast KV), AsyncStorage (legacy)
- **Auth**: expo-auth-session + secure token storage
- **Forms**: React Hook Form + Zod
- **Testing**: Jest + React Native Testing Library + Detox (e2e)
- **Build**: EAS Build + EAS Submit
- **OTA Updates**: EAS Update
- **Linter**: ESLint + Prettier

## Workflow Orchestration
### Mode Perencanaan — Plan mode untuk 3+ langkah
### Verifikasi — `npx tsc --noEmit && npx jest && npx expo lint` sebelum selesai
### Self-Improvement — Update tasks/lessons.md
### Bug Fixing — Langsung perbaiki

## Konvensi Kode

### React Native
- Functional components + hooks SELALU
- Platform-specific: `*.ios.tsx`, `*.android.tsx` jika perlu
- Avoid inline styles — gunakan NativeWind atau StyleSheet.create
- Memoize expensive components: React.memo, useMemo, useCallback
- FlatList/FlashList untuk lists (JANGAN ScrollView + map)

### Arsitektur
```
src/
├── app/                     → Expo Router file-based routes
│   ├── (tabs)/              → Tab navigator group
│   ├── (auth)/              → Auth flow group
│   ├── _layout.tsx          → Root layout
│   └── index.tsx            → Home screen
├── components/
│   ├── ui/                  → Reusable primitives (Button, Input, Card)
│   ├── forms/               → Form components
│   └── features/            → Feature-specific components
├── hooks/                   → Custom hooks
├── stores/                  → Zustand stores
├── services/                → API service functions
├── lib/                     → Utilities, constants, types
├── assets/                  → Images, fonts
└── types/                   → Global TypeScript types
```

### Penamaan
- Components: PascalCase (UserProfile.tsx)
- Hooks: camelCase + use prefix (useAuth.ts)
- Stores: camelCase + Store suffix (useAuthStore.ts)
- Screens (Expo Router): kebab-case (user-profile.tsx)
- Services: camelCase (authService.ts)
- Types: PascalCase (UserProfile, ApiResponse)

### Performance
- FlatList/FlashList (Shopify) untuk lists, JANGAN map di ScrollView
- Hermes engine enabled (default di new arch)
- Image: expo-image (bukan RN Image) — caching built-in
- Animations: Reanimated 3 (UI thread, 60fps)
- Avoid: unnecessary re-renders, bridge calls, large JS bundles

## Skills
- skills/ui/SKILL.md → Components, NativeWind, animations, gestures
- skills/navigation/SKILL.md → Expo Router, deep linking, auth flow
- skills/state-management/SKILL.md → Zustand, TanStack Query, MMKV
- skills/testing/SKILL.md → Jest, RNTL, Detox e2e
- skills/security/SKILL.md → Secure storage, auth, biometrics, SSL pinning
- skills/performance/SKILL.md → Lists, images, animations, bundle size
- skills/code-review/SKILL.md → RN-specific code smells
- skills/native-modules/SKILL.md → Expo modules, native linking, Turbo Modules
- skills/api-integration/SKILL.md → TanStack Query, offline support, caching

## Prinsip Inti
- **Expo First**: Gunakan Expo SDK & EAS, eject hanya jika terpaksa
- **Performance**: 60fps always — Reanimated, FlashList, Hermes
- **Offline First**: Cache data, handle no-connection gracefully
- **Platform Aware**: Respek platform conventions (iOS/Android)
- **Type Safety**: TypeScript strict, Zod validation
