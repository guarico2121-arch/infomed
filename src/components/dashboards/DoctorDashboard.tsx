'use client';

import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Doctor } from '@/lib/types';
import DoctorProfileForm from '../forms/DoctorProfileForm';
import SubscriptionStatusBanner from '../ui/SubscriptionStatusBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
    </div>
);

const DoctorStatsCards = ({ doctor }: { doctor: Doctor }) => (
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground font-normal">Tarifa por Consulta</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">${doctor.cost || 0}</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground font-normal">Años de Experiencia</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{doctor.experienceYears || 0}</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground font-normal">Ubicación</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{doctor.city || 'N/A'}</p></CardContent>
        </Card>
    </div>
);

const AgendaView = () => (
    <Card>
        <CardHeader><CardTitle>Próximas Citas</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Aquí se mostrará la agenda del médico...</p></CardContent>
    </Card>
);

const PostManager = () => (
    <Card>
        <CardHeader><CardTitle>Publicaciones Recientes</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Aquí se mostrará el gestor de posts...</p></CardContent>
    </Card>
);

export default function DoctorDashboard() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isUserLoading || !user || !firestore) return;

        const doctorDocRef = doc(firestore, 'doctor_profiles', user.uid);
        const unsubscribe = onSnapshot(doctorDocRef, (docSnap: DocumentSnapshot) => {
            if (docSnap.exists()) {
                setDoctorProfile(docSnap.data() as Doctor);
            } else {
                setDoctorProfile(null); // Explicitly set to null if profile doesn't exist
            }
            setIsLoading(false);
        }, (err: Error) => {
            console.error("Error fetching doctor profile:", err);
            setError('No se pudo cargar el perfil del doctor.');
            setIsLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener
    }, [user, isUserLoading, firestore]);

    const handleProfileUpdate = async (profileData: Partial<Doctor>) => {
        if (!user || !firestore) return false;
        
        const doctorDocRef = doc(firestore, 'doctor_profiles', user.uid);
        try {
            // Use setDoc with merge: true to create or update the document.
            await setDoc(doctorDocRef, profileData, { merge: true });
            
            // If it's a new profile, we need to add the core, non-editable fields.
            if (!doctorProfile) {
                await setDoc(doctorDocRef, {
                    uid: user.uid,
                    email: user.email!,
                    createdAt: serverTimestamp(),
                    subscriptionStatus: 'Trial',
                }, { merge: true });
            }

            toast({ title: "Perfil Actualizado", description: "Tu información ha sido guardada con éxito." });
            return true;
        } catch (err) {
            console.error("Error updating profile:", err);
            toast({ title: "Error al Guardar", description: "No se pudo guardar el perfil. Por favor, inténtalo de nuevo.", variant: 'destructive' });
            return false;
        }
    };

    if (isLoading || isUserLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">{error}</div>;
    }

    return (
        <div className="container mx-auto py-8 bg-muted/20 min-h-screen">
            {doctorProfile && (
                 <SubscriptionStatusBanner 
                    status={doctorProfile.subscriptionStatus}
                    createdAt={doctorProfile.createdAt}
                />
            )}
            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto mb-6">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="edit-profile">Editar Perfil</TabsTrigger>
                </TabsList>
                
                <TabsContent value="dashboard">
                    {doctorProfile ? (
                        <>
                            <DoctorStatsCards doctor={doctorProfile} />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <AgendaView />
                                <PostManager />
                            </div>
                        </>
                    ) : (
                         <Card className="text-center py-12">
                            <CardHeader>
                                <CardTitle>¡Bienvenido, Doctor!</CardTitle>
                                <CardDescription>Aún no tienes un perfil público. Ve a la pestaña "Editar Perfil" para empezar.</CardDescription>
                            </CardHeader>
                         </Card>
                    )}
                </TabsContent>
                
                <TabsContent value="edit-profile">
                     <Card>
                        <CardHeader>
                            <CardTitle>Tu Perfil Público</CardTitle>
                            <CardDescription>Esta es la información que los pacientes verán. Mantenla completa y actualizada.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DoctorProfileForm 
                                onSubmit={handleProfileUpdate} 
                                initialData={doctorProfile} 
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
