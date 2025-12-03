import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App;
let auth: Auth;
let firestore: Firestore;

/**
 * Initializes the Firebase Admin SDK, ensuring it's a singleton.
 * It uses default credentials provided by the App Hosting environment.
 */
export function initializeFirebaseAdmin(): { firebaseApp: App; auth: Auth; firestore: Firestore } {
  // If the app is already initialized, return the existing instances.
  if (getApps().length) {
    const existingApp = getApps()[0];
    return {
      firebaseApp: existingApp,
      auth: getAuth(existingApp),
      firestore: getFirestore(existingApp),
    };
  }

  // If the app is not initialized, initialize it with default credentials.
  // This is the standard practice for Google Cloud environments like App Hosting.
  const newApp = initializeApp();
  
  return {
    firebaseApp: newApp,
    auth: getAuth(newApp),
    firestore: getFirestore(newApp),
  };
}
