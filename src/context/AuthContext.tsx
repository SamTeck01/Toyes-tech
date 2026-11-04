import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface User {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface StoredUser extends User {
  passwordHash: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  signOut: () => void;
}

const USERS_KEY = "toyes-users";
const SESSION_KEY = "toyes-session";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

// Client-side demo auth: hashes the password so it is never stored as plain text.
// Swap this for a real backend (e.g. Supabase Auth) before going live.
const hash = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const strip = ({ passwordHash: _ph, ...u }: StoredUser): User => u;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const email = read<string | null>(SESSION_KEY, null);
    const found = read<StoredUser[]>(USERS_KEY, []).find((u) => u.email === email);
    return found ? strip(found) : null;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user?.email ?? null));
    } catch { /* storage unavailable */ }
  }, [user]);

  const saveUsers = (users: StoredUser[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const signIn = async (email: string, password: string) => {
    const users = read<StoredUser[]>(USERS_KEY, []);
    const found = users.find((u) => u.email === email.trim().toLowerCase());
    if (!found || found.passwordHash !== (await hash(password))) {
      throw new Error("Incorrect email or password.");
    }
    setUser(strip(found));
  };

  const register = async (name: string, email: string, password: string) => {
    const users = read<StoredUser[]>(USERS_KEY, []);
    const normalized = email.trim().toLowerCase();
    if (users.some((u) => u.email === normalized)) {
      throw new Error("An account with this email already exists.");
    }
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");
    const newUser: StoredUser = { name: name.trim(), email: normalized, passwordHash: await hash(password) };
    saveUsers([...users, newUser]);
    setUser(strip(newUser));
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const users = read<StoredUser[]>(USERS_KEY, []);
    const updated = users.map((u) => (u.email === user.email ? { ...u, ...data, email: u.email } : u));
    saveUsers(updated);
    setUser({ ...user, ...data, email: user.email });
  };

  const signOut = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, signIn, register, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
