import { getApps, initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getAuth, initializeAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

let auth: Auth;
try {
  // Use dynamic require for `firebase/auth/react-native` so builds without its typings still work.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rnAuth = require('firebase/auth/react-native');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  if (rnAuth && rnAuth.getReactNativePersistence) {
    auth = initializeAuth(app, {
      persistence: rnAuth.getReactNativePersistence(AsyncStorage),
    });
  } else {
    auth = getAuth(app);
  }
} catch (e) {
  // Fallback: if react-native auth module isn't available, use web getAuth
  auth = getAuth(app);
}

export { app, auth };

