// firebase.ts
import AsyncStorage                from '@react-native-async-storage/async-storage';
import { initializeApp            } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,   // exported from 'firebase/auth' since v10
} from 'firebase/auth';
import { getFirestore }            from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBMKXCDzAu8WEdEtdbzQGEsehY_UzrMtfo',
  authDomain: 'journal-5a1a2.firebaseapp.com',
  projectId: 'journal-5a1a2',
  storageBucket: 'journal-5a1a2.appspot.com',
  messagingSenderId: '462497084608',
  appId: '1:462497084608:web:8f95509eb6fcd7b19be925',
  measurementId: 'G-EMC66JT806',
};

const app  = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db   = getFirestore(app);
