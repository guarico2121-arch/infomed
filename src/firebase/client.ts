'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

// This function provides a single, reliable initialization path for the client.
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
} {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);

  // Enable offline persistence
  enableMultiTabIndexedDbPersistence(firestore).catch((err) => {
      if (err.code == 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a a time.
          console.warn('Firestore persistence failed: multiple tabs open.');
      } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the features required to enable persistence
          console.warn('Firestore persistence not available in this browser.');
      }
  });

  return {
    firebaseApp,
    auth,
    firestore,
    storage,
  };
}
