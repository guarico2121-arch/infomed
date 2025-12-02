'use client';

import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Doctor } from '@/lib/types';

// Placeholder components - we will create these next
const DoctorProfileHeader = ({ doctor }: { doctor: Doctor }) => (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold">{doctor.name}</h2>
        <p className="text-gray-600">{doctor.specialty}</p>
    </div>
);

const DoctorStatsCards = ({ doctor }: { doctor: Doctor }) => (
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-gray-500 text-sm">Tarifa por Consulta</h3>
            <p className="text-2xl font-bold">${doctor.cost}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-gray-500 text-sm">Años de Experiencia</h3>
            <p className="text-2xl font-bold">{doctor.experienceYears}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-gray-500 text-sm">Ubicación</h3>
            <p className="text-2xl font-bold">{doctor.city}</p>
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

export default function DoctorDashboard() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isUserLoading || !user || !firestore) {
            return;
        }

        const fetchDoctorProfile = async () => {
            try {
                const doctorDocRef = doc(firestore, 'doctor_profiles', user.uid);
                const docSnap = await getDoc(doctorDocRef);

                if (docSnap.exists()) {
                    setDoctorProfile(docSnap.data() as Doctor);
                } else {
                    setError('No se encontró un perfil de doctor para este usuario.');
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar el perfil. Es posible que la conexión a la red esté fallando.');
            }
            finally {
                setIsLoading(false);
            }
        };

        fetchDoctorProfile();
    }, [user, isUserLoading, firestore]);

    if (isLoading || isUserLoading) {
        return <div>Cargando dashboard...</div>;
    }

    if (error) {
        return <div className="text-red-500 p-4 bg-red-100 rounded-md">{error}</div>;
    }

    if (!doctorProfile) {
        return <div>No hay perfil de doctor disponible.</div>;
    }

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
