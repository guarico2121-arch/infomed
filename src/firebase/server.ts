import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

/**
 * Initializes the Firebase Admin SDK, ensuring it's a singleton.
 * It uses default credentials provided by the App Hosting environment.
 */
export function initializeFirebaseAdmin(): { firebaseApp: App; auth: Auth; firestore: Firestore } {
  // If the app is already initialized, return the existing instances.
  if (getApps().length) {
    const app = getApp();
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  }

  // If the app is not initialized, initialize it with default credentials.
  // This is the standard practice for Google Cloud environments like App Hosting.
  const firebaseApp = initializeApp();
  
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}
