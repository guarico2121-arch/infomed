'use client';

import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // If the docRef is not yet available, reset to a clean non-loading state.
    if (!memoizedDocRef) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // New ref is available, start loading and reset previous state.
    setIsLoading(true);
    setData(null);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // Document doesn't exist. This is not an error, but a valid state.
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
         if (err.code === 'permission-denied') {
            try {
                const auth = getAuth();
                if (!auth.currentUser) {
                    setData(null);
                    setError(null);
                    setIsLoading(false);
                    return;
                }
            } catch {
                // If getAuth() fails, it's an initialization issue. Let the error pass through.
            }
        }

        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)

        errorEmitter.emit('permission-error', contextualError);
      }
    );
    
    return () => {
        unsubscribe();
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
