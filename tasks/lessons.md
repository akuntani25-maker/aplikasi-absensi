# Lessons Learned

## Pola yang Harus Diingat

### React Native / Expo

**1. React version pinning untuk RN 0.79**
- RN 0.79 membutuhkan `react: 19.0.0` (bukan `^18`)
- Selalu pin exact version saat ada peer dep conflict
- Gunakan `--legacy-peer-deps` untuk semua npm install di monorepo ini

**2. Vision Camera + Reanimated di Jest**
- `babel-preset-expo` SDK 53+ auto-detect reanimated → `react-native-worklets/plugin` error saat Jest
- Fix: buat `jest.unit.config.js` terpisah dengan `configFile: false, babelrc: false`
- Tambahkan `@babel/plugin-transform-modules-commonjs` untuk ESM → CJS transform
- JANGAN gunakan `api.env()` setelah `api.cache(true)` di babel config

**3. noUncheckedIndexedAccess = true**
- `array[0]` → `T | undefined`, bukan `T`
- Fix: gunakan `.substring(0, 10)` bukan `.split('T')[0]`

**4. runOnJS di Reanimated**
- Import `runOnJS` dari `react-native-reanimated`, bukan `react-native-worklets-core`

**5. Vision Camera cameraRef**
- Internal: `RefObject<Camera | null>`, pass ke prop: cast `as RefObject<Camera>`

### Supabase

**6. @supabase/ssr di Next.js App Router**
- Gunakan `@supabase/ssr` (bukan auth-helpers yang deprecated)
- Type `CookieOptions` harus diimport dari `@supabase/ssr`

**7. Supabase Realtime**
- Cleanup channel di `useEffect` return: `supabase.removeChannel(channel)`

**8. Haversine Formula**
- Extract ke `lib/haversine.ts` untuk testability
- R = 6,371,000 meter

### Monorepo / Windows

**9. npm workspaces hoisting**
- Package yang di-install di sub-workspace bisa ter-hoist ke root — ini normal

**10. Node.js di Windows Git Bash**
- Path: `/c/Users/LittleKazam PC/.config/herd/bin/nvm/v23.10.0/node.exe`
- Gunakan `node.exe "path/to/script.js"` langsung (tidak bisa pakai `npx` via bash)

## Aturan Pencegahan

- JANGAN commit `.env.local` atau file secrets ke repo
- JANGAN hardcode koordinat GPS tanpa validasi haversine + accuracy check
- JANGAN lupa `purgeFailed()` untuk offline queue — mencegah memory leak di MMKV
- JANGAN gunakan `api.env()` setelah `api.cache(true)` di babel.config.js
