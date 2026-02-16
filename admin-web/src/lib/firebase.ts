import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCTNLL67WaH0tJkhXFu9CJMz_ab7emwd4k',
  authDomain: 'zakat-8e5a4.firebaseapp.com',
  projectId: 'zakat-8e5a4',
  storageBucket: 'zakat-8e5a4.firebasestorage.app',
  messagingSenderId: '1026513048742',
  appId: '1:1026513048742:web:211811ded4c2bdcbcbd067',
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export { app };
