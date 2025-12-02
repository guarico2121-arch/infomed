'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getApp, getApps } from 'firebase/app';

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * A dedicated hook to manage and provide the current Firebase user's authentication state.
 * It safely initializes and subscribes to onAuthStateChanged.
 */
export function useUser(): UserHookResult {
  const [userAuthState, setUserAuthState] = useState<UserHookResult>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  useEffect(() => {
    // Ensure Firebase app is initialized before getting auth
    if (getApps().length === 0) {
      // This case should ideally not happen if FirebaseClientProvider is set up correctly,
      // but it's a safe guard.
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Firebase app not initialized.") });
      return;
    }

    const auth: Auth = getAuth(getApp());

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        // Auth state determined
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        // Auth listener error
        console.error("useUser: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  return userAuthState;
}
