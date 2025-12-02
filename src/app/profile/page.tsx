'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

import DoctorDashboard from '@/components/dashboards/DoctorDashboard';
import PatientDashboard from '@/components/dashboards/PatientDashboard';

// A simple loading spinner component
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Wait until we have all dependencies
        if (isUserLoading || !firestore) return;

        // If no user is logged in, redirect to login page
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchUserRole = async () => {
            setIsLoading(true);
            const userDocRef = doc(firestore, 'users', user.uid);

            try {
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists()) {
                    const roles = docSnap.data()?.roles || [];
                    // Find the primary role. We assume one user has one primary role for the dashboard.
                    if (roles.includes('Admin')) {
                        setUserRole('Admin');
                    } else if (roles.includes('Doctor')) {
                        setUserRole('Doctor');
                    } else if (roles.includes('Patient')) {
                        setUserRole('Patient');
                    } else {
                        // Fallback for users with no valid role
                        setError('El usuario no tiene un rol asignado. Contacta a soporte.');
                    }
                } else {
                    // This case should be handled by registration logic, but as a fallback:
                    setError('El perfil de usuario no existe. Contacta a soporte.');
                }
            } catch (err: any) {
                console.error("Error fetching user role:", err);
                setError('No se pudo verificar el rol del usuario.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserRole();

    }, [user, isUserLoading, firestore, router]);

    // Handle redirection for Admin role separately
    useEffect(() => {
        if (userRole === 'Admin') {
            router.replace('/admin/dashboard');
        }
    }, [userRole, router]);

    // Show a loading screen while we determine the role or if the user is an admin being redirected.
    if (isLoading || isUserLoading || userRole === 'Admin') {
        return <LoadingSpinner />;
    }

    // If there was an error determining the role
    if (error) {
        return <div className="text-red-500 p-4 bg-red-100 rounded-md container mx-auto my-8">Error: {error}</div>;
    }

    // Render the correct dashboard based on the determined role
    switch (userRole) {
        case 'Doctor':
            return <DoctorDashboard />;
        case 'Patient':
            return <PatientDashboard />;
        default:
            // This state is temporary while the role is being determined, or if a role is invalid.
            return <LoadingSpinner />;
    }
}
