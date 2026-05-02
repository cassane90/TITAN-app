
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, QueryRecord, ThemeMode, UserRole } from '../types';
import { supabaseService } from '../services/supabaseService';

interface AppContextType {
  user: UserProfile | null;
  history: QueryRecord[];
  isLoading: boolean;
  isAuthenticated: boolean;
  theme: ThemeMode;
  toggleTheme: () => void;
  refreshState: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Local storage key for guest persistence
const GUEST_PROFILE_KEY = 'titan_guest_profile';

const DEFAULT_GUEST: UserProfile = {
  id: 'guest_operator',
  email: 'operator@titan.forensic',
  role: UserRole.OPERATOR,
  is_premium: false,
  query_count: 0,
  onboarding_accepted: false,
  permissions: { camera: 'granted', location: 'granted' }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<QueryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const refreshState = async () => {
    try {
      const [u, h] = await Promise.race([
        Promise.all([supabaseService.getProfile(), supabaseService.getLogs()]),
        new Promise<[null, []]>((resolve) => setTimeout(() => resolve([null, []]), 5000))
      ]);
      const profile = u ?? (() => {
        const stored = localStorage.getItem(GUEST_PROFILE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_GUEST;
      })();
      setUser(profile);
      setHistory(h);
    } catch {
      const stored = localStorage.getItem(GUEST_PROFILE_KEY);
      setUser(stored ? JSON.parse(stored) : DEFAULT_GUEST);
      setHistory([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      const client = supabaseService.client;

      const doInit = async () => {
        if (!client) {
          await refreshState();
          return;
        }
        const session = await client.auth.getSession();
        setIsAuthenticated(!!session.data.session || !!localStorage.getItem(GUEST_PROFILE_KEY));
        await refreshState();
        client.auth.onAuthStateChange(async (_event, s) => {
          setIsAuthenticated(!!s || !!localStorage.getItem(GUEST_PROFILE_KEY));
          await refreshState();
        });
      };

      // Always resolve within 6 seconds to prevent infinite loading screen
      await Promise.race([
        doInit(),
        new Promise<void>((resolve) => setTimeout(resolve, 6000))
      ]).catch(() => {});

      setIsLoading(false);
    };
    init();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newTheme);
  };

  const signOut = async () => {
      await supabaseService.signOut();
      localStorage.removeItem(GUEST_PROFILE_KEY);
      window.location.reload();
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (user?.id === 'guest_operator') {
        const newProfile = { ...user, ...updates };
        setUser(newProfile);
        localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(newProfile));
    } else {
        await supabaseService.updateProfile(updates);
        await refreshState();
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, history, isLoading, isAuthenticated, theme, 
      toggleTheme, refreshState, signOut, updateUser,
      showPremiumModal, setShowPremiumModal
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp context error.');
  return context;
};
