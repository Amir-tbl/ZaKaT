import React, {createContext, useContext, useEffect, useState, useCallback} from 'react';
import {authService, AuthUser, AuthError} from '../services/auth';
import {firebaseAuthService} from '../services/auth/FirebaseAuthService';
import {profileService} from '../services/profile';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean | null;
  isProfileLoading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({children}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Check if user has a Firestore profile
  const checkProfile = useCallback(async () => {
    setIsProfileLoading(true);
    try {
      const profile = await profileService.getProfile();
      setHasProfile(!!profile);
    } catch {
      setHasProfile(false);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await checkProfile();
  }, [checkProfile]);

  useEffect(() => {
    let mounted = true;

    // Try to restore session from storage first
    authService.getSession().then((session) => {
      if (mounted && session) {
        setUser(session);
      }
      if (mounted) {
        setIsLoading(false);
      }
    }).catch(() => {
      if (mounted) {
        setIsLoading(false);
      }
    });

    // Listen to Firebase auth state changes
    const unsubscribe = firebaseAuthService.onAuthStateChange((authUser) => {
      if (mounted) {
        setUser(authUser);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Check profile whenever user changes
  useEffect(() => {
    if (user) {
      checkProfile();
    } else {
      setHasProfile(null);
    }
  }, [user, checkProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const loggedUser = await authService.signIn(email, password);
    setUser(loggedUser);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const newUser = await authService.signUp(email, password);
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setHasProfile(null);
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await authService.deleteAccount();
    setHasProfile(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    hasProfile,
    isProfileLoading,
    refreshProfile,
    signIn,
    signUp,
    signOut,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export pour faciliter l'import
export {AuthError};
