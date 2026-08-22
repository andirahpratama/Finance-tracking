import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isGuest: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    // If Supabase is not configured, default to Demo/Guest mode
    if (!configured || !supabase) {
      const savedGuest = localStorage.getItem('ft_guest_user');
      if (savedGuest) {
        try {
          setUser(JSON.parse(savedGuest));
          setIsGuest(true);
        } catch {
          setUser(null);
        }
      } else {
        // Auto initialize default guest user so user immediately has full working app
        const defaultGuest: UserProfile = {
          id: 'demo-user-123',
          email: 'demo@financetracking.com',
          full_name: 'Pengguna Demo',
          avatar_url: '',
          created_at: new Date().toISOString(),
        };
        setUser(defaultGuest);
        setIsGuest(true);
        localStorage.setItem('ft_guest_user', JSON.stringify(defaultGuest));
      }
      setIsLoading(false);
      return;
    }

    const client = supabase;
    if (!client) return;

    // Check active Supabase session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url || '',
            created_at: session.user.created_at,
          };
          setUser(profile);
          setIsGuest(false);
        } else {
          // Check if user previously chose guest mode
          const savedGuest = localStorage.getItem('ft_guest_user');
          if (savedGuest) {
            setUser(JSON.parse(savedGuest));
            setIsGuest(true);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error fetching Supabase session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen to Supabase auth changes
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url || '',
          created_at: session.user.created_at,
        };
        setUser(profile);
        setIsGuest(false);
        localStorage.removeItem('ft_guest_user');
      } else if (!isGuest) {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  const signInWithEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!configured || !supabase) {
      // Local demo sign in
      const demoUser: UserProfile = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        email,
        full_name: email.split('@')[0],
        created_at: new Date().toISOString(),
      };
      setUser(demoUser);
      setIsGuest(true);
      localStorage.setItem('ft_guest_user', JSON.stringify(demoUser));
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Email atau kata sandi salah. Silakan periksa kembali.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Email belum dikonfirmasi. Buka email Anda untuk klik link verifikasi, atau matikan fitur "Confirm email" di Supabase Dashboard.' };
        }
        return { error: error.message };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          avatar_url: data.user.user_metadata?.avatar_url || '',
          created_at: data.user.created_at,
        });
        setIsGuest(false);
        localStorage.removeItem('ft_guest_user');
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Gagal masuk akun' };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: string | null; needsEmailConfirmation?: boolean }> => {
    if (!configured || !supabase) {
      // Local demo sign up
      const demoUser: UserProfile = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        email,
        full_name: fullName || email.split('@')[0],
        created_at: new Date().toISOString(),
      };
      setUser(demoUser);
      setIsGuest(true);
      localStorage.setItem('ft_guest_user', JSON.stringify(demoUser));
      return { error: null, needsEmailConfirmation: false };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          return { error: 'Email ini sudah terdaftar. Silakan pilih menu Masuk (Login).' };
        }
        return { error: error.message };
      }

      // If Supabase created user but no session, email confirmation is active
      if (data.user && !data.session) {
        // If identities is empty array, it means user already exists in Supabase Auth
        if (data.user.identities && data.user.identities.length === 0) {
          return { error: 'Email ini sudah terdaftar. Silakan pilih menu Masuk (Login).' };
        }
        return { error: null, needsEmailConfirmation: true };
      }

      if (data.user && data.session) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          full_name: fullName,
          created_at: data.user.created_at,
        });
        setIsGuest(false);
        localStorage.removeItem('ft_guest_user');
      }

      return { error: null, needsEmailConfirmation: false };
    } catch (err: any) {
      return { error: err.message || 'Gagal mendaftar akun' };
    }
  };

  const signOut = async () => {
    if (configured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('ft_guest_user');
  };

  const continueAsGuest = () => {
    const demoUser: UserProfile = {
      id: 'guest-' + Math.random().toString(36).substring(2, 7),
      email: 'tamu@financetracking.local',
      full_name: 'Tamu Finance',
      avatar_url: '',
      created_at: new Date().toISOString(),
    };
    setUser(demoUser);
    setIsGuest(true);
    localStorage.setItem('ft_guest_user', JSON.stringify(demoUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGuest,
        isConfigured: configured,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
