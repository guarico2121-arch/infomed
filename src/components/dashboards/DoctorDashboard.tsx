'use client';

import { useUser, useFirestore } from '@/firebase';
// FIX: Imported Timestamp type
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Doctor } from '@/lib/types';
import DoctorProfileForm from '../forms/DoctorProfileForm';

// A simple loading spinner component
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

// --- Reusable smaller components for displaying profile data ---
const DoctorProfileHeader = ({ doctor }: { doctor: Doctor }) => (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold">{doctor.name}</h2>
        <p className="text-gray-600">{doctor.specialty || 'Especialidad no especificada'}</p>
    </div>
);

const DoctorStatsCards = ({ doctor }: { doctor: Doctor }) => (
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-gray-500 text-sm">Tarifa por Consulta</h3>
            <p className="text-2xl font-bold">${doctor.cost || 'N/A'}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-gray-500 text-sm">Años de Experiencia</h3>
            <p className="text-2xl font-bold">{doctor.experienceYears || 'N/A'}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-gray-500 text-sm">Ubicación</h3>
            <p className="text-2xl font-bold">{doctor.city || 'N/A'}</p>
        </div>
    </div>
);

const AgendaView = () => (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Próximas Citas</h3>
        <p className="text-gray-500">Aquí se mostrará la agenda del médico...</p>
    </div>
);

const PostManager = () => (
    <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Publicaciones Recientes</h3>
        <p className="text-gray-500">Aquí se mostrará el gestor de posts...</p>
    </div>
);

// --- Main DoctorDashboard Component ---
export default function DoctorDashboard() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
    const [profileExists, setProfileExists] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isUserLoading || !user || !firestore) {
            return; // Wait until user and firestore are available
        }

        const fetchDoctorProfile = async () => {
            const doctorDocRef = doc(firestore, 'doctor_profiles', user.uid);
            try {
                const docSnap = await getDoc(doctorDocRef);
                if (docSnap.exists()) {
                    setDoctorProfile(docSnap.data() as Doctor);
                    setProfileExists(true);
                } else {
                    // Profile doesn't exist, this is not an error, but a state.
                    setProfileExists(false);
                }
            } catch (err) {
                console.error("Error fetching doctor profile:", err);
                setError('No se pudo cargar el perfil del doctor.');
            }
            finally {
                setIsLoading(false);
            }
        };

        fetchDoctorProfile();
    }, [user, isUserLoading, firestore]);

    const handleProfileCreation = async (profileData: Omit<Doctor, 'uid' | 'email' | 'createdAt'>) => {
        if (!user || !firestore) return;
        setIsLoading(true);
        const doctorDocRef = doc(firestore, 'doctor_profiles', user.uid);
        try {
            const fullProfile: Doctor = {
                ...profileData,
                uid: user.uid,
                email: user.email!,
                createdAt: serverTimestamp() as Timestamp,
            };
            await setDoc(doctorDocRef, fullProfile);
            setDoctorProfile(fullProfile);
            setProfileExists(true);
        } catch (err) {
            console.error("Error creating profile:", err);
            setError("No se pudo guardar el perfil. Por favor, inténtalo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || isUserLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">{error}</div>;
    }

    // If the profile doesn't exist, show the creation form.
    if (!profileExists) {
        return (
            <div className="container mx-auto py-8">
                <h2 className="text-2xl font-bold text-center mb-4">¡Bienvenido, Doctor!</h2>
                <p className="text-center text-gray-600 mb-8">Para empezar, por favor completa tu perfil profesional.</p>
                <DoctorProfileForm onSubmit={handleProfileCreation} />
            </div>
        );
    }
    
    // If profile exists, but data is somehow null (should not happen)
    if (!doctorProfile) {
        return <div className="text-center p-8">Perfil no disponible. Contacta a soporte.</div>;
    }

    // Render the full dashboard if the profile exists
    return (
        <div className="container mx-auto py-8 bg-gray-50">
            <DoctorProfileHeader doctor={doctorProfile} />
            <DoctorStatsCards doctor={doctorProfile} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AgendaView />
                <PostManager />
            </div>
        </div>
    );
}
