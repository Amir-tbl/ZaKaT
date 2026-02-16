import {initializeApp, getApps, FirebaseApp} from 'firebase/app';
import {getAuth, Auth} from 'firebase/auth';
import {getFirestore, Firestore} from 'firebase/firestore';
import {getStorage, FirebaseStorage} from 'firebase/storage';
import {getFunctions, Functions} from 'firebase/functions';

// Firebase configuration for ZaKaT app
const firebaseConfig = {
  apiKey: 'AIzaSyCTNLL67WaH0tJkhXFu9CJMz_ab7emwd4k',
  authDomain: 'zakat-8e5a4.firebaseapp.com',
  projectId: 'zakat-8e5a4',
  storageBucket: 'zakat-8e5a4.firebasestorage.app',
  messagingSenderId: '1026513048742',
  appId: '1:1026513048742:web:211811ded4c2bdcbcbd067',
};

// Initialize Firebase App (singleton)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const functions: Functions = getFunctions(app, 'europe-west3');

export {app, auth, db, storage, functions};
