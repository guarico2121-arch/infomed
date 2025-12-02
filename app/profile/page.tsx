'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import PatientDashboard from '@/components/dashboards/PatientDashboard';
import DoctorDashboard from '@/components/dashboards/DoctorDashboard';

export default function ProfilePage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!auth || !firestore) return;

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userDocRef = doc(firestore, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        const roles = data.roles; // The field is `roles`, an array.

                        if (roles && Array.isArray(roles) && roles.length > 0) {
                            // Determine the primary role for redirection.
                            if (roles.includes('Admin')) {
                                setUserRole('Admin');
                            } else if (roles.includes('Doctor')) {
                                setUserRole('Doctor');
                            } else if (roles.includes('Patient')) {
                                setUserRole('Patient');
                            } else {
                                throw new Error('El rol en la base de datos es desconocido.');
                            }
                        } else {
                            // **THIS IS THE CRITICAL FALLBACK**
                            // If `roles` field does not exist, throw the error.
                            throw new Error('El usuario no tiene un rol asignado.');
                        }
                    } else {
                        // This case should ideally not happen in a normal flow.
                        throw new Error('No se encontró el documento del usuario.');
                    }
                } catch (e: any) {
                    console.error("Error handling user role:", e);
                    setError(e.message || 'Ocurrió un error al verificar tu perfil.');
                    toast({
                        title: 'Error de Perfil',
                        description: e.message || 'No se pudo cargar la información de tu perfil. Por favor, contacta a soporte.',
                        variant: 'destructive',
                    });
                    setIsLoading(false);
                }
            } else {
                // If no user is logged in, redirect to login.
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [auth, firestore, router, toast]);

    useEffect(() => {
        if (userRole) {
            // Once a role is confirmed, perform the corresponding action.
            if (userRole === 'Admin') {
                router.push('/admin/dashboard');
            } else {
                // For Doctor and Patient, we can stop loading and render their dashboard.
                setIsLoading(false);
            }
        }
    }, [userRole, router]);

    if (isLoading) {
        return (
            <div className="container mx-auto p-4">
                <Skeleton className="h-24 w-full mb-4" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto my-8 flex items-center justify-center">
                <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                   <p className="font-bold">Error: {error}</p>
                   <p className="text-sm">No pudimos cargar tu perfil. Si el problema persiste, intenta iniciar sesión de nuevo o contacta a soporte.</p>
                </div>
            </div>
        );
    }

    // Render the appropriate dashboard based on the role.
    if (userRole === 'Patient') {
        return <PatientDashboard />;
    }

    if (userRole === 'Doctor') {
        return <DoctorDashboard />;
    }

    // Fallback while redirecting or if role is not yet determined.
    return null;
}
