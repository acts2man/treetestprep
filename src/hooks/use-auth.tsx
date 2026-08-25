import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "instructor" | "student";

export type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isInstructor: boolean;
  isMember: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetails = useCallback(async (userId: string) => {
    const [rolesResult, profileResult] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase
        .from("profiles")
        .select("id, display_name, email, phone, avatar_url")
        .eq("id", userId)
        .maybeSingle(),
    ]);
    setRoles(((rolesResult.data ?? []) as { role: AppRole }[]).map((row) => row.role));
    setProfile((profileResult.data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    let active = true;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession?.user) {
        setTimeout(() => {
          void loadDetails(nextSession.user.id);
        }, 0);
      } else {
        setRoles([]);
        setProfile(null);
      }
      setLoading(false);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        setTimeout(() => {
          void loadDetails(data.session!.user.id);
        }, 0);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadDetails]);

  const refreshRoles = useCallback(async () => {
    if (session?.user) await loadDetails(session.user.id);
  }, [session, loadDetails]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setProfile(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const isSuperAdmin = roles.includes("super_admin");
    const isAdmin = isSuperAdmin || roles.includes("admin");
    return {
      session,
      user: session?.user ?? null,
      roles,
      profile,
      loading,
      isAdmin,
      isSuperAdmin,
      isInstructor: roles.includes("instructor"),
      isMember: !!session?.user,
      signOut,
      refreshRoles,
    };
  }, [session, roles, profile, loading, signOut, refreshRoles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
