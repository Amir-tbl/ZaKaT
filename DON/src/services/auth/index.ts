export * from './types';
export * from './FirebaseAuthService';

// Legacy local auth (kept for reference)
// export * from './LocalAuthService';

import {firebaseAuthService} from './FirebaseAuthService';

// Service actif - Firebase Auth
export const authService = firebaseAuthService;
