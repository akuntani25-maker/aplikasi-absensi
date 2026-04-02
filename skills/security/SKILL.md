---
name: security
description: "Gunakan untuk auth, secure storage, biometrics, SSL pinning, token management. Trigger: security, auth, token, secure store, biometric, SSL pinning, keychain, encryption."
---
# Security — React Native
## Token storage: expo-secure-store (Keychain/Keystore) JANGAN AsyncStorage
## Auth: expo-auth-session untuk OAuth flows
## Biometrics: expo-local-authentication
## SSL Pinning: react-native-ssl-pinning untuk production
## JANGAN: hardcode secrets di JS bundle, store sensitive di AsyncStorage
