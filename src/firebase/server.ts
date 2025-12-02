
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

  // When deployed to App Hosting, the Admin SDK automatically discovers credentials.
  // The service account key is only needed for local development.
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const firebaseApp = initializeApp();
    return {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: getFirestore(firebaseApp),
    };
  } else {
    // We are in a local or non-production environment.
    // Dynamically import the service account key to avoid build errors in production.
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
      console.error('serviceAccountKey.json not found, initializing admin SDK without it for local development. This may lead to runtime errors.');
      const firebaseApp = initializeApp();
      return {
        firebaseApp,
        auth: getAuth(firebaseApp),
        firestore: getFirestore(firebaseApp),
      };
    }
  }
}
