---
name: api-integration
description: "Gunakan untuk API integration: TanStack Query patterns, fetch/axios, error handling, offline support, optimistic updates. Trigger: API, fetch, axios, TanStack Query, mutation, optimistic, offline, caching."
---
# API Integration — TanStack Query
## Queries: useQuery({ queryKey: ['users'], queryFn: fetchUsers })
## Mutations: useMutation + queryClient.invalidateQueries
## Optimistic updates: onMutate → snapshot → rollback on error
## Offline: persistQueryClient + MMKV storage
## Error handling: global onError callback di QueryClient
