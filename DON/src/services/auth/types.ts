// Types pour l'authentification
// Cette interface permet de swapper facilement LocalAuth -> Firebase

export interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
}

export interface AuthService {
  signUp(email: string, password: string): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthUser | null>;
  deleteAccount(): Promise<void>;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export class AuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'AuthError';
  }
}

export const AUTH_ERROR_CODES = {
  INVALID_EMAIL: 'auth/invalid-email',
  WEAK_PASSWORD: 'auth/weak-password',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  EMAIL_IN_USE: 'auth/email-already-in-use',
  NO_USER: 'auth/no-user',
} as const;
