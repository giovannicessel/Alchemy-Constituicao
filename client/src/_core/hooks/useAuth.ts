import { getLoginUrl } from "@/const";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await resp.json().catch(() => ({ user: null }))) as { user?: unknown };
      setUser((data.user as any) ?? null);
    } catch (err) {
      setError(err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network/logout errors; force local auth reset below.
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(user)
    );
    return {
      user: user ?? null,
      loading,
      error,
      isAuthenticated: Boolean(user),
    };
  }, [error, loading, user]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    loading,
    state.user,
  ]);

  return {
    ...state,
    refresh,
    logout,
  };
}
