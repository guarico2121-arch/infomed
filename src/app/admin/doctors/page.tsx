'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import type { Doctor } from '@/lib/types';
import { EditDoctorDialog } from '@/components/admin/edit-doctor-dialog';

export default function AdminDoctorsPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);

  const doctorsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'doctor_profiles') : null),
    [firestore]
  );
  const { data: doctors, isLoading } = useCollection<Doctor>(doctorsQuery);

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    return doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.city && doctor.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [doctors, searchTerm]);

  const handleEditClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Doctores</CardTitle>
        <CardDescription>Edita los perfiles de los doctores registrados en la plataforma.</CardDescription>
        <Input
          placeholder="Buscar por nombre, especialidad o ciudad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm mt-4"
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Suscripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Cargando...</TableCell>
              </TableRow>
            )}
            {!isLoading && filteredDoctors?.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell>{doctor.name}</TableCell>
                <TableCell>{doctor.specialty}</TableCell>
                <TableCell>{doctor.city}</TableCell>
                <TableCell>{doctor.subscriptionStatus}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(doctor)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <EditDoctorDialog
        doctor={selectedDoctor}
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Card>
  );
}
