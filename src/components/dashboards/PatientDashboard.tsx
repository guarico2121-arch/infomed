'use client';

import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { UserProfile, Appointment } from '@/lib/types';

// Placeholder components
const PatientInfoCard = ({ profile }: { profile: UserProfile }) => (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold">{profile.name || 'Paciente'}</h2>
        <p className="text-gray-600">Email: {profile.email}</p>
        {profile.bloodType && (
            <p className="mt-4 p-2 bg-blue-50 border-l-4 border-blue-500">
                <span className="font-semibold">Tipo de Sangre:</span> 
                <span className="ml-2 font-mono text-lg">{profile.bloodType}</span>
            </p>
        )}
    </div>
);

const MyAppointments = ({ appointments }: { appointments: Appointment[] }) => (
    <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Mis Citas</h3>
        {appointments.length > 0 ? (
            <ul className="space-y-4">
                {appointments.map(apt => (
                    <li key={apt.id} className="border-b pb-2 flex justify-between items-center">
                        <div>
                           {/* NOTE: We will need to fetch the doctor's name from their ID */}
                            <p className="font-semibold">Cita con Doctor</p>
                            <p className="text-sm text-gray-600">{apt.startTime.toDate().toLocaleString()}</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">{apt.status}</span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-gray-500">No tienes citas programadas.</p>
        )}
    </div>
);

export default function PatientDashboard() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isUserLoading || !user || !firestore) {
            return;
        }

        const fetchPatientData = async () => {
            try {
                // Fetch user profile
                const userDocRef = doc(firestore, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data() as UserProfile);
                } else {
                    throw new Error('No se encontró el perfil del usuario.');
                }

                // Fetch appointments
                const appointmentsQuery = query(
                    collection(firestore, 'appointments'),
                    where('patientId', '==', user.uid)
                );
                const querySnapshot = await getDocs(appointmentsQuery);
                const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
                setAppointments(apps);

            } catch (err) {
                console.error(err);
                setError('Error al cargar tus datos. Es posible que la conexión a la red esté fallando.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatientData();
    }, [user, isUserLoading, firestore]);

    if (isLoading || isUserLoading) {
        return <div>Cargando tu perfil...</div>;
    }

    if (error) {
        return <div className="text-red-500 p-4 bg-red-100 rounded-md">{error}</div>;
    }

    if (!userProfile) {
        return <div>No se pudo cargar el perfil.</div>;
    }

    return (
        <div className="container mx-auto py-8 bg-gray-50">
            <PatientInfoCard profile={userProfile} />
            <MyAppointments appointments={appointments} />
        </div>
    );
}
