
import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

// This function provides a single, reliable initialization path for the server.
export function initializeFirebaseAdmin(): { firebaseApp: App; auth: Auth; firestore: Firestore } {
  if (getApps().length) {
    const app = getApp();
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  }

  try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require('../../serviceAccountKey.json');
      const firebaseApp = initializeApp({
          credential: credential.cert(serviceAccount)
      });
      return {
        firebaseApp,
        auth: getAuth(firebaseApp),
        firestore: getFirestore(firebaseApp),
      };
    } catch (e) {
      console.error('serviceAccountKey.json not found or invalid, initializing admin SDK without explicit credentials. This may lead to runtime errors if default credentials are not available.');
      // Initialize without credentials, relying on the environment.
      // This will cause errors if the environment is not configured, but it prevents a startup crash.
      const firebaseApp = initializeApp();
      return {
        firebaseApp,
        auth: getAuth(firebaseApp),
        firestore: getFirestore(firebaseApp),
      };
    }
}
