'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
    const [isLoadingRole, setIsLoadingRole] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isUserLoading || !firestore) return;

        if (!user) {
            router.push('/login');
            return;
        }

        const fetchUserRole = async () => {
            try {
                const userDocRef = doc(firestore, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const roles = data.roles || [];

                    // ONE-TIME FIX: If the admin user has the wrong role, correct it.
                    if (user.email === 'admin@informed.com' && !roles.includes('Admin')) {
                        console.warn('Incorrect admin profile found. Forcing role update.');
                        await setDoc(userDocRef, { roles: ['Admin'] }, { merge: true });
                        setUserRole('Admin'); // Immediately set role for redirection
                    } 
                    // Standard role check
                    else if (roles.includes('Admin')) {
                        setUserRole('Admin');
                    } else if (roles.includes('Doctor')) {
                        setUserRole('Doctor');
                    } else if (roles.includes('Patient')) {
                        setUserRole('Patient');
                    } else {
                        throw new Error('El usuario no tiene un rol asignado.');
                    }
                } else {
                    // Self-healing for new users
                    console.warn('User profile document not found. Creating a default profile.');
                    const roleToAssign = user.email === 'admin@informed.com' ? 'Admin' : 'Patient';
                    const newUserProfile = {
                        uid: user.uid,
                        email: user.email,
                        name: user.displayName || (roleToAssign === 'Admin' ? 'Admin User' : 'Nuevo Usuario'),
                        roles: [roleToAssign],
                        createdAt: serverTimestamp(),
                    };
                    await setDoc(userDocRef, newUserProfile);
                    setUserRole(roleToAssign);
                }
            } catch (err: any) {
                console.error("Error handling user role:", err);
                setError(err.message || 'No se pudo cargar la información del perfil.');
            } finally {
                setIsLoadingRole(false);
            }
        };

        fetchUserRole();

    }, [user, isUserLoading, firestore, router]);

    // Handle redirection for Admin role
    useEffect(() => {
        if (userRole === 'Admin') {
            router.replace('/admin/dashboard');
        }
    }, [userRole, router]);

    if (isLoadingRole || isUserLoading || userRole === 'Admin') {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-red-500 p-4 bg-red-100 rounded-md container mx-auto my-8">Error: {error}</div>;
    }

    // Render the correct dashboard based on the role
    switch (userRole) {
        case 'Doctor':
            return <DoctorDashboard />;
        case 'Patient':
            return <PatientDashboard />;
        default:
            return <div className="text-center p-8">No se pudo determinar el rol del usuario.</div>;
    }
}
