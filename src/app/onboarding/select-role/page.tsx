
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/lib/types';

export default function SelectRolePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = async (role: 'Doctor' | 'Patient') => {
    if (!user || !firestore || isUpdating) return;

    setIsUpdating(true);
    setSelectedRole(role);

    const userRef = doc(firestore, 'users', user.uid);

    try {
      await updateDoc(userRef, { role: role });
      
      toast({
        title: 'Rol Asignado',
        description: `Tu rol como ${role} ha sido guardado.`,
      });

      // Redirige al perfil. La página de perfil se encargará de mostrar el dashboard correcto.
      router.push('/profile');
      router.refresh();

    } catch (error) {
      console.error("Error updating role: ", error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar tu rol. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
      setIsUpdating(false);
      setSelectedRole(null);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold">Bienvenido a InfoMed</CardTitle>
          <CardDescription className="text-center pt-2">
            Para continuar, elige cómo usarás la plataforma. Esta elección es permanente y definirá tu experiencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-100 transition-colors">
              <h3 className="text-xl font-semibold mb-2">Soy Doctor</h3>
              <p className="text-center text-sm text-gray-600 mb-4">Crearé un perfil profesional, gestionaré mi agenda y publicaré contenido para pacientes.</p>
              <Button
                className="w-full"
                onClick={() => handleRoleSelect('Doctor')}
                disabled={isUpdating}
              >
                {isUpdating && selectedRole === 'Doctor' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Elegir rol de Doctor
              </Button>
          </div>
          <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-100 transition-colors">
              <h3 className="text-xl font-semibold mb-2">Soy Paciente</h3>
              <p className="text-center text-sm text-gray-600 mb-4">Buscaré doctores, agendaré citas y seguiré las publicaciones de mis especialistas de confianza.</p>
              <Button
                className="w-full"
                onClick={() => handleRoleSelect('Patient')}
                disabled={isUpdating}
              >
                {isUpdating && selectedRole === 'Patient' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Elegir rol de Paciente
              </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
