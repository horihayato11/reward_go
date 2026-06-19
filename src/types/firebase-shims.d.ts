
declare module 'firebase/app';
declare module 'firebase/auth';
declare module 'firebase/auth/react-native';
declare module '@react-native-async-storage/async-storage';

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_FIREBASE_API_KEY?: string;
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
    EXPO_PUBLIC_FIREBASE_PROJECT_ID?: string;
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
    EXPO_PUBLIC_FIREBASE_APP_ID?: string;
    [key: string]: string | undefined;
  }
}

declare var process: NodeJS.Process;

export { };

