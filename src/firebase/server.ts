
import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

// Define the shape of the service account key for type safety
interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require('../../serviceAccountKey.json');
    const firebaseApp = initializeApp({
        credential: credential.cert(serviceAccount as ServiceAccount)
    });
    return {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: getFirestore(firebaseApp),
    };
  }
}
