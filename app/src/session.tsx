import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createApi } from "./api";

export const SESSION_TOKEN_KEY = "session-token";

interface Session {
  /** False until the stored token has been read. */
  ready: boolean;
  token: string | null;
  signIn(token: string): Promise<void>;
  signOut(): Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<{ ready: boolean; token: string | null }>({ ready: false, token: null });

  useEffect(() => {
    SecureStore.getItemAsync(SESSION_TOKEN_KEY)
      .then((token) => setState({ ready: true, token }))
      .catch(() => setState({ ready: true, token: null }));
  }, []);

  const signIn = useCallback(async (token: string) => {
    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
    setState({ ready: true, token });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
    } catch {
      // Sign out in memory regardless. A token left behind in storage is refused by
      // the server once it expires, and the 401 signs out again.
    }
    setState({ ready: true, token: null });
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(() => ({ ...state, signIn, signOut }), [state, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>");
  return session;
}

/** The API, authorised as the signed-in Student; a 401 signs them out. */
export function useApi() {
  const { token, signOut } = useSession();
  return useMemo(() => createApi(token, () => void signOut()), [token, signOut]);
}
