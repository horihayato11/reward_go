import { auth } from '@/lib/firebase';
import {
    createUserWithEmailAndPassword,
    deleteUser as fbDeleteUser,
    signOut as fbSignOut,
    updateEmail as fbUpdateEmail,
    updatePassword as fbUpdatePassword,
    updateProfile as fbUpdateProfile,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInAnonymously,
    signInWithEmailAndPassword,
    User,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const guestLogin = async () => {
    await signInAnonymously(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!auth.currentUser) throw new Error('No user');
    await fbUpdateProfile(auth.currentUser, data);
  };

  const updateEmail = async (email: string) => {
    if (!auth.currentUser) throw new Error('No user');
    await fbUpdateEmail(auth.currentUser, email);
  };

  const updatePassword = async (password: string) => {
    if (!auth.currentUser) throw new Error('No user');
    await fbUpdatePassword(auth.currentUser, password);
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) throw new Error('No user');
    await fbDeleteUser(auth.currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        guestLogin,
        resetPassword,
        signOut,
        updateProfile,
        updateEmail,
        updatePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
