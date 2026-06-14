import * as React from "react";
import { db } from "@/data";
import type { SignUpInput } from "@/data";
import type { Profile, Role } from "@/types";

interface AuthState {
  loading: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  role: Role | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<Role | null>;
  signUp: (input: SignUpInput) => Promise<{ needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);

  const loadProfile = React.useCallback(async (id: string | null) => {
    if (!id) {
      setProfile(null);
      return null;
    }
    const p = await db.getProfile(id);
    setProfile(p);
    return p;
  }, []);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const user = await db.getCurrentUser();
      if (!active) return;
      setUserId(user?.id ?? null);
      setEmail(user?.email ?? null);
      await loadProfile(user?.id ?? null);
      setLoading(false);
    })();

    const unsub = db.onAuthChange(async (user) => {
      setUserId(user?.id ?? null);
      setEmail(user?.email ?? null);
      await loadProfile(user?.id ?? null);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [loadProfile]);

  const value: AuthState = {
    loading,
    userId,
    email,
    profile,
    role: profile?.role ?? null,
    isAdmin: profile?.role === "admin",
    async signIn(em, pw) {
      const user = await db.signIn(em, pw);
      setUserId(user.id);
      setEmail(user.email);
      const p = await loadProfile(user.id);
      return p?.role ?? null;
    },
    async signUp(input) {
      const { user, needsConfirmation } = await db.signUp(input);
      if (user && !needsConfirmation) {
        setUserId(user.id);
        setEmail(user.email);
        await loadProfile(user.id);
      }
      return { needsConfirmation };
    },
    async signInWithGoogle() {
      await db.signInWithGoogle();
    },
    async signOut() {
      await db.signOut();
      setUserId(null);
      setEmail(null);
      setProfile(null);
    },
    async resetPassword(em) {
      await db.resetPassword(em);
    },
    async refreshProfile() {
      await loadProfile(userId);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
