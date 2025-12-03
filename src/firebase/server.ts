
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
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
  if (!getApps().length) {
    // This is the standard way to initialize in a Google Cloud environment.
    // It automatically uses the service account credentials available in the runtime.
    app = initializeApp();
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  firestore = getFirestore(app);
  
  return {
    firebaseApp: app,
    auth,
    firestore,
  };
}
