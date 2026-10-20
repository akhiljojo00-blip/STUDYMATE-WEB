import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, testConnection } from '../config/firebase.ts';
import { syncUserProfile } from '../services/userService.ts';
import { UserProfile } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isDemo: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  enterDemoMode: () => void;
  signOutUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate connection to Firestore on boot as required by specification
    testConnection().catch((err) => {
      console.warn('Initial Firestore connection check notice:', err);
    });

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            setUser(firebaseUser);
            setIsDemo(false);
            const profile = await syncUserProfile(firebaseUser);
            setUserProfile(profile);
            setError(null);
          } catch (profileErr) {
            console.error('Failed to sync user profile:', profileErr);
            // Fallback profile from auth object
            setUserProfile({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Scholar',
              photoURL: firebaseUser.photoURL || '',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      },
      (authErr) => {
        console.error('Auth state listener error:', authErr);
        setError(authErr.message || 'Authentication error occurred.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setIsDemo(false);
      const profile = await syncUserProfile(result.user);
      setUserProfile(profile);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. The Google popup was closed before completion.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google sign-in popup was blocked by your browser. Please allow popups or try Demo Scholar mode.');
      } else {
        setError(err.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const enterDemoMode = () => {
    setIsDemo(true);
    setUser(null);
    setUserProfile({
      id: 'demo-student-user',
      email: 'scholar.demo@studymate.edu',
      displayName: 'Alex Scholar',
      photoURL: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setError(null);
  };

  const signOutUser = async () => {
    try {
      setLoading(true);
      if (auth.currentUser) {
        await signOut(auth);
      }
      setUser(null);
      setUserProfile(null);
      setIsDemo(false);
      setError(null);
    } catch (err: any) {
      console.error('Sign-out error:', err);
      setError(err.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isDemo,
        loading,
        error,
        signInWithGoogle,
        enterDemoMode,
        signOutUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
