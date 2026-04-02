const store = new Map<string, string>();

export const MMKV = jest.fn().mockImplementation(() => ({
  set: (key: string, value: string) => store.set(key, value),
  getString: (key: string) => store.get(key),
  delete: (key: string) => store.delete(key),
  getAllKeys: () => Array.from(store.keys()),
  clearAll: () => store.clear(),
}));
