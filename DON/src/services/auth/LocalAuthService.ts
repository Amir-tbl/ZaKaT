import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthService,
  AuthUser,
  AuthError,
  AUTH_ERROR_CODES,
} from './types';

const STORAGE_KEYS = {
  USER: '@auth_user',
  CREDENTIALS: '@auth_credentials',
  SESSION: '@auth_session',
} as const;

interface StoredCredentials {
  email: string;
  passwordHash: string;
}

// Simple hash pour le MVP (ne pas utiliser en prod!)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function validateEmail(email: string): boolean {
  return email.includes('@') && email.includes('.');
}

/**
 * Validate password strength:
 * - Minimum 6 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 */
function validatePassword(password: string): {valid: boolean; error?: string} {
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
    return {valid: false, error: 'Le mot de passe doit contenir au moins un caractere special (!@#$%^&*...)'};
  }
  return {valid: true};
}

function generateUserId(): string {
  return 'local_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export class LocalAuthService implements AuthService {
  async signUp(email: string, password: string): Promise<AuthUser> {
    // Validation
    if (!validateEmail(email)) {
      throw new AuthError(
        AUTH_ERROR_CODES.INVALID_EMAIL,
        'Adresse email invalide'
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new AuthError(
        AUTH_ERROR_CODES.WEAK_PASSWORD,
        passwordValidation.error || 'Mot de passe invalide'
      );
    }

    // Verifier si un compte existe deja
    const existingCreds = await AsyncStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (existingCreds) {
      const creds: StoredCredentials = JSON.parse(existingCreds);
      if (creds.email === email.toLowerCase()) {
        throw new AuthError(
          AUTH_ERROR_CODES.EMAIL_IN_USE,
          'Un compte existe deja avec cet email'
        );
      }
    }

    // Creer le user
    const user: AuthUser = {
      id: generateUserId(),
      email: email.toLowerCase(),
      createdAt: Date.now(),
    };

    // Stocker les credentials
    const credentials: StoredCredentials = {
      email: email.toLowerCase(),
      passwordHash: simpleHash(password),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));

    return user;
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    // Validation
    if (!validateEmail(email)) {
      throw new AuthError(
        AUTH_ERROR_CODES.INVALID_EMAIL,
        'Adresse email invalide'
      );
    }

    // Verifier les credentials
    const credentialsJson = await AsyncStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (!credentialsJson) {
      throw new AuthError(
        AUTH_ERROR_CODES.USER_NOT_FOUND,
        'Aucun compte trouve avec cet email'
      );
    }

    const credentials: StoredCredentials = JSON.parse(credentialsJson);

    if (credentials.email !== email.toLowerCase()) {
      throw new AuthError(
        AUTH_ERROR_CODES.USER_NOT_FOUND,
        'Aucun compte trouve avec cet email'
      );
    }

    if (credentials.passwordHash !== simpleHash(password)) {
      throw new AuthError(
        AUTH_ERROR_CODES.WRONG_PASSWORD,
        'Mot de passe incorrect'
      );
    }

    // Recuperer le user
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (!userJson) {
      throw new AuthError(
        AUTH_ERROR_CODES.USER_NOT_FOUND,
        'Utilisateur non trouve'
      );
    }

    const user: AuthUser = JSON.parse(userJson);

    // Creer la session
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));

    return user;
  }

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  async getSession(): Promise<AuthUser | null> {
    const sessionJson = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
    if (!sessionJson) {
      return null;
    }
    return JSON.parse(sessionJson);
  }

  async deleteAccount(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.CREDENTIALS,
      STORAGE_KEYS.SESSION,
    ]);
  }
}

// Export singleton instance
export const localAuthService = new LocalAuthService();
