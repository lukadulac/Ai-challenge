import * as SecureStore from "expo-secure-store";

process.env.EXPO_PUBLIC_API_URL = "http://api.test";

// Secure storage is a native boundary: an in-memory stand-in keeps the session between renders.
jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: async (key: string) => store.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => {
      store.set(key, value);
    },
    deleteItemAsync: async (key: string) => {
      store.delete(key);
    },
    __clear: () => store.clear(),
  };
});

jest.mock("react-native-safe-area-context", () => jest.requireActual("react-native-safe-area-context/jest/mock").default);

afterEach(() => {
  (SecureStore as unknown as { __clear(): void }).__clear();
});
