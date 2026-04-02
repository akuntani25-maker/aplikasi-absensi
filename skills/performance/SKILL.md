---
name: performance
description: "Gunakan untuk performance: lists, images, animations, bundle size, Hermes, memory. Trigger: performance, slow, FPS, animation, list, bundle, Hermes, memory, re-render."
---
# Performance — 60fps Target
## Lists: FlashList/FlatList, JANGAN ScrollView+map. estimatedItemSize wajib
## Images: expo-image dengan placeholder + caching
## Animations: Reanimated (UI thread), JANGAN Animated API untuk complex
## Re-renders: React.memo, useMemo, useCallback. React DevTools Profiler
## Bundle: Metro bundle analyzer, code splitting dengan lazy imports
## Hermes: pastikan enabled (default di new architecture)
