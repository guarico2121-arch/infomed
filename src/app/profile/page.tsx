
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile, AnyUserProfile } from '@/lib/types';

import DoctorDashboard from '@/components/dashboards/DoctorDashboard';
import PatientDashboard from '@/components/dashboards/PatientDashboard';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="text-red-500 p-4 bg-red-100 rounded-md container mx-auto my-8">Error: {message}</div>
);

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [profile, setProfile] = useState<AnyUserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isUserLoading) {
            return; // Espera a que la autenticación se resuelva.
        }

        if (!user) {
            router.replace('/login'); // Si no hay usuario, redirige al login.
            return;
        }

        if (!firestore) {
            setError('Servicio de base de datos no disponible.');
            setIsLoading(false);
            return;
        }

        const fetchUserProfile = async () => {
            const userDocRef = doc(firestore, 'users', user.uid);
            try {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const userProfile = docSnap.data() as UserProfile;
                    
                    // El Guardián de Rol: si no hay rol, se redirige a la selección.
                    if (!userProfile.role) {
                        router.replace('/onboarding/select-role');
                        return; // Detiene la ejecución aquí.
                    }

                    setProfile(userProfile as AnyUserProfile);

                } else {
                    setError('Tu perfil no fue encontrado. Contacta a soporte si esto es un error.');
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
                setError('Ocurrió un error inesperado al cargar tu perfil.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();

    }, [user, isUserLoading, firestore, router]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorDisplay message={error} />;
    }

    if (!profile) {
        // Esto solo debería mostrarse brevemente o si hay un error no capturado.
        return <LoadingSpinner />;
    }

    // Enrutamiento final basado en el rol del perfil ya cargado.
    switch (profile.role) {
        case 'Admin':
            router.replace('/admin/dashboard');
            return <LoadingSpinner />; // Muestra un loader mientras redirige.
        case 'Doctor':
            return <DoctorDashboard />;
        case 'Patient':
            return <PatientDashboard />;
        default:
            // Esto captura roles nulos o inesperados que se hayan colado.
            return <ErrorDisplay message={`Rol de usuario no reconocido: ${profile.role}.`} />;
    }
}
