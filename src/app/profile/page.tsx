'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

import DoctorDashboard from '@/components/dashboards/DoctorDashboard';
import PatientDashboard from '@/components/dashboards/PatientDashboard';

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
        if (isUserLoading || !firestore) return;

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
                    const data = docSnap.data();
                    // Normalize roles to lowercase for case-insensitive comparison, respecting SSOT.
                    const roles: string[] = (data?.roles || []).map((role: string) => role.toLowerCase());

                    if (roles.includes('admin')) {
                        setUserRole('Admin');
                    } else if (roles.includes('doctor')) {
                        setUserRole('Doctor');
                    } else if (roles.includes('patient')) {
                        setUserRole('Patient');
                    } else {
                        // This error now only triggers if the roles array is empty or contains no valid roles.
                        setError('El usuario no tiene un rol asignado.');
                    }
                } else {
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

    useEffect(() => {
        if (userRole === 'Admin') {
            router.replace('/admin/dashboard');
        }
    }, [userRole, router]);

    if (isLoading || isUserLoading || userRole === 'Admin') {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-red-500 p-4 bg-red-100 rounded-md container mx-auto my-8">Error: {error}</div>;
    }

    switch (userRole) {
        case 'Doctor':
            return <DoctorDashboard />;
        case 'Patient':
            return <PatientDashboard />;
        default:
            return <LoadingSpinner />;
    }
}
