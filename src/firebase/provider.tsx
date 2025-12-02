'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { initializeFirebase } from './client'; // Import client-side initializer
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth, User } from 'firebase/auth';
import type { FirebaseStorage } from 'firebase/storage';
import { useUser as useAuthUser } from './auth/use-user';

// ... (interfaces remain the same)
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  user: User | null;
  isUserLoading: boolean;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
}

// The provider now initializes Firebase itself.
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const { firebaseApp, auth, firestore, storage } = initializeFirebase();

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
    };
  }, [firebaseApp, firestore, auth, storage]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

// ... (hooks remain the same)
function useFirebaseServices() {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebaseServices must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    return { firebaseApp: null, firestore: null, auth: null, storage: null };
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
  };
}

export const useAuth = (): Auth | null => {
  const { auth } = useFirebaseServices();
  return auth;
};

export const useFirestore = (): Firestore | null => {
  const { firestore } = useFirebaseServices();
  return firestore;
};

export const useFirebaseStorage = (): FirebaseStorage | null => {
    const { storage } = useFirebaseServices();
    return storage;
}

export const useFirebaseApp = (): FirebaseApp | null => {
  const { firebaseApp } = useFirebaseServices();
  return firebaseApp;
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const { firebaseApp, firestore, auth, storage } = useFirebaseServices();
  const { user, isUserLoading } = useAuthUser();

  if (!firebaseApp || !firestore || !auth || !storage) {
    return { firebaseApp: null, firestore: null, auth: null, storage: null, user: null, isUserLoading: true };
  }

  return {
    firebaseApp,
    firestore,
    auth,
    storage,
    user,
    isUserLoading,
  };
};

export const useUser = useAuthUser;

export function useMemoFirebase<T>(factory: () => T | null, deps: React.DependencyList): T | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
