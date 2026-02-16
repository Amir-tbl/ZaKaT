import {useState, useCallback, useEffect} from 'react';
import {AuthError} from '../services/auth/types';

// Lazy-load Google Sign-In to avoid crash in Expo Go
let GoogleSignin: any = null;
let statusCodes: any = {};
let googleSignInAvailable = false;

try {
  const mod = require('@react-native-google-signin/google-signin');
  GoogleSignin = mod.GoogleSignin;
  statusCodes = mod.statusCodes;
  googleSignInAvailable = true;
} catch {
  // Native module not available (Expo Go)
  googleSignInAvailable = false;
}

// Google OAuth Web Client ID (required for Firebase auth)
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

interface UseGoogleAuthResult {
  signInWithGoogle: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
}

export function useGoogleAuth(): UseGoogleAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = !!GOOGLE_WEB_CLIENT_ID && googleSignInAvailable;

  // Configure Google Sign-In on mount
  useEffect(() => {
    if (isConfigured && GoogleSignin) {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });
    }
  }, [isConfigured]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    if (!googleSignInAvailable) {
      setError('Google Sign-In n\'est pas disponible (Expo Go non supporte)');
      setIsLoading(false);
      return;
    }

    if (!isConfigured) {
      setError('Google Sign-In n\'est pas configure');
      setIsLoading(false);
      return;
    }

    try {
      const {firebaseAuthService} = require('../services/auth/FirebaseAuthService');

      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices();

      // Sign in with Google (native UI)
      const response = await GoogleSignin.signIn();

      if (response.type === 'success' && response.data?.idToken) {
        // Sign in to Firebase with the Google credential
        await firebaseAuthService.signInWithGoogleCredential(
          response.data.idToken,
        );
        // Auth state change will be handled by AuthProvider
      } else {
        setError('Token Google non recu');
      }
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled - do nothing
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError('Connexion deja en cours');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services non disponible');
      } else if (err instanceof AuthError) {
        setError(err.message);
      } else {
        console.error('Google Sign-In error:', err);
        setError('Erreur lors de la connexion Google');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  return {
    signInWithGoogle,
    isLoading,
    error,
    isConfigured,
  };
}
