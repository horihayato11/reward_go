import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type User = { id: string; name?: string } | null;

type AuthContextType = {
  user: User;
  setUser: (u: User) => void;
  login: (u: User) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('rewardgo:user');
        if (raw) setUserState(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const setUser = (u: User) => {
    setUserState(u);
    AsyncStorage.setItem('rewardgo:user', JSON.stringify(u || null)).catch(() => {});
  };

  const login = async (u: User) => {
    setUser(u);
    await AsyncStorage.setItem('rewardgo:user', JSON.stringify(u));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('rewardgo:user');
  };

  return <AuthContext.Provider value={{ user, setUser, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
