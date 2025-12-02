'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

import DoctorDashboard from '@/components/dashboards/DoctorDashboard';
import PatientDashboard from '@/components/dashboards/PatientDashboard';

// A consistent loading spinner
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Primary guard: Wait for user authentication to be resolved
        if (isUserLoading) {
            return; 
        }

        // If no user is logged in after loading, redirect to login
        if (!user) {
            router.push('/login');
            return;
        }

        // Guard for Firestore availability
        if (!firestore) {
            setIsLoading(false);
            setError('Servicio de base de datos no disponible.');
            return;
        }

        const fetchUserProfile = async () => {
            const userDocRef = doc(firestore, 'users', user.uid);
            try {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setProfile(docSnap.data() as UserProfile);
                } else {
                    setError('El perfil de usuario no fue encontrado en la base de datos.');
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
                setError('Ocurrió un error al cargar tu perfil.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();

    }, [user, isUserLoading, firestore, router]);

    // Render states based on the hook's progress

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-red-500 p-4 bg-red-100 rounded-md container mx-auto my-8">Error: {error}</div>;
    }

    if (!profile || !profile.roles || profile.roles.length === 0) {
        // This is the definitive error state. It only triggers if the profile is loaded but has no roles.
        return <div className="text-red-500 p-4 bg-red-100 rounded-md container mx-auto my-8">Error: El usuario no tiene un rol asignado.</div>;
    }

    // Role-based routing and rendering
    // The role is checked *after* the profile has been successfully loaded.
    const primaryRole = profile.roles.map(role => role.toLowerCase())[0]; // Get the primary role

    if (primaryRole.includes('admin')) {
        router.replace('/admin/dashboard');
        return <LoadingSpinner />; // Show loader while redirecting
    }

    if (primaryRole.includes('doctor')) {
        return <DoctorDashboard />;
    }

    if (primaryRole.includes('patient')) {
        return <PatientDashboard />;
    }

    // Fallback if role is something unexpected
    return <div className="text-red-500 p-4 bg-red-100 rounded-md container mx-auto my-8">Error: Rol de usuario no reconocido.</div>;
}
