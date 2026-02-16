import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {auth} from '../../lib/firebase';
import {
  AuthService,
  AuthUser,
  AuthError,
  AUTH_ERROR_CODES,
} from './types';

const AUTH_PERSISTENCE_KEY = '@firebase_auth_user';

/**
 * Convert Firebase User to AuthUser
 */
function toAuthUser(firebaseUser: FirebaseUser): AuthUser {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    createdAt: firebaseUser.metadata.creationTime
      ? new Date(firebaseUser.metadata.creationTime).getTime()
      : Date.now(),
  };
}

/**
 * Map Firebase error codes to our error codes
 */
function mapFirebaseError(error: any): AuthError {
  const code = error?.code || 'auth/unknown';

  const errorMap: Record<string, {code: string; message: string}> = {
    'auth/invalid-email': {
      code: AUTH_ERROR_CODES.INVALID_EMAIL,
      message: 'Adresse email invalide',
    },
    'auth/weak-password': {
      code: AUTH_ERROR_CODES.WEAK_PASSWORD,
      message: 'Le mot de passe est trop faible',
    },
    'auth/user-not-found': {
      code: AUTH_ERROR_CODES.USER_NOT_FOUND,
      message: 'Aucun compte trouve avec cet email',
    },
    'auth/wrong-password': {
      code: AUTH_ERROR_CODES.WRONG_PASSWORD,
      message: 'Mot de passe incorrect',
    },
    'auth/invalid-credential': {
      code: AUTH_ERROR_CODES.WRONG_PASSWORD,
      message: 'Email ou mot de passe incorrect',
    },
    'auth/email-already-in-use': {
      code: AUTH_ERROR_CODES.EMAIL_IN_USE,
      message: 'Un compte existe deja avec cet email',
    },
    'auth/too-many-requests': {
      code: 'auth/too-many-requests',
      message: 'Trop de tentatives. Reessayez plus tard.',
    },
    'auth/network-request-failed': {
      code: 'auth/network-error',
      message: 'Erreur reseau. Verifiez votre connexion.',
    },
  };

  const mapped = errorMap[code];
  if (mapped) {
    return new AuthError(mapped.code, mapped.message);
  }

  return new AuthError(code, error?.message || 'Une erreur est survenue');
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password: string): {valid: boolean; error?: string} {
  if (password.length < 6) {
    return {valid: false, error: 'Le mot de passe doit contenir au moins 6 caracteres'};
  }
  if (!/[A-Z]/.test(password)) {
    return {valid: false, error: 'Le mot de passe doit contenir au moins une majuscule'};
  }
  if (!/[0-9]/.test(password)) {
    return {valid: false, error: 'Le mot de passe doit contenir au moins un chiffre'};
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {valid: false, error: 'Le mot de passe doit contenir au moins un caractere special'};
  }
  return {valid: true};
}

export class FirebaseAuthService implements AuthService {
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];
  private initialized = false;

  constructor() {
    // Listen to Firebase auth state changes
    onAuthStateChanged(auth, async (user) => {
      const authUser = user ? toAuthUser(user) : null;

      // Persist to AsyncStorage
      if (authUser) {
        await AsyncStorage.setItem(AUTH_PERSISTENCE_KEY, JSON.stringify(authUser));
      } else {
        await AsyncStorage.removeItem(AUTH_PERSISTENCE_KEY);
      }

      this.initialized = true;
      this.authStateListeners.forEach(listener => listener(authUser));
    });
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback);

    if (this.initialized && auth.currentUser) {
      callback(toAuthUser(auth.currentUser));
    }

    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  async signUp(email: string, password: string): Promise<AuthUser> {
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      throw new AuthError(AUTH_ERROR_CODES.WEAK_PASSWORD, passwordCheck.error!);
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const authUser = toAuthUser(credential.user);
      await AsyncStorage.setItem(AUTH_PERSISTENCE_KEY, JSON.stringify(authUser));
      return authUser;
    } catch (error) {
      throw mapFirebaseError(error);
    }
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const authUser = toAuthUser(credential.user);
      await AsyncStorage.setItem(AUTH_PERSISTENCE_KEY, JSON.stringify(authUser));
      return authUser;
    } catch (error) {
      throw mapFirebaseError(error);
    }
  }

  async signInWithGoogleCredential(idToken: string | null, accessToken?: string | null): Promise<AuthUser> {
    try {
      const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
      const result = await signInWithCredential(auth, googleCredential);
      const authUser = toAuthUser(result.user);
      await AsyncStorage.setItem(AUTH_PERSISTENCE_KEY, JSON.stringify(authUser));
      return authUser;
    } catch (error) {
      throw mapFirebaseError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      // Clear all cached data
      await AsyncStorage.multiRemove([
        AUTH_PERSISTENCE_KEY,
        '@user_profile', // ProfileService cache
      ]);
    } catch (error) {
      throw mapFirebaseError(error);
    }
  }

  async getSession(): Promise<AuthUser | null> {
    if (auth.currentUser) {
      return toAuthUser(auth.currentUser);
    }

    try {
      const stored = await AsyncStorage.getItem(AUTH_PERSISTENCE_KEY);
      if (stored) {
        return JSON.parse(stored) as AuthUser;
      }
    } catch (error) {
      console.warn('Error reading persisted auth:', error);
    }

    return null;
  }

  async deleteAccount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new AuthError(AUTH_ERROR_CODES.NO_USER, 'Aucun utilisateur connecte');
    }

    try {
      await deleteUser(user);
      await AsyncStorage.removeItem(AUTH_PERSISTENCE_KEY);
    } catch (error) {
      throw mapFirebaseError(error);
    }
  }

  getCurrentFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  }
}

export const firebaseAuthService = new FirebaseAuthService();
