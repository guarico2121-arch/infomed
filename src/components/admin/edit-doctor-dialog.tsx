'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Doctor } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditDoctorDialogProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditDoctorDialog({ doctor, isOpen, onClose }: EditDoctorDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Doctor>>({});

  useEffect(() => {
    if (doctor) {
      setFormData(doctor);
    }
  }, [doctor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (!firestore || !doctor) return;

    const doctorRef = doc(firestore, 'doctor_profiles', doctor.id);

    try {
      await updateDoc(doctorRef, formData);
      toast({ title: 'Perfil actualizado', description: `El perfil de ${doctor.name} ha sido actualizado.` });
      onClose();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el perfil.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Perfil del Doctor</DialogTitle>
          <DialogDescription>Realiza cambios en el perfil del doctor. Haz clic en guardar cuando termines.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nombre</Label>
            <Input id="name" value={formData.name || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="specialty" className="text-right">Especialidad</Label>
            <Input id="specialty" value={formData.specialty || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">Ciudad</Label>
            <Input id="city" value={formData.city || ''} onChange={handleChange} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subscriptionStatus" className="text-right">Suscripción</Label>
            <Select onValueChange={(value) => handleSelectChange('subscriptionStatus', value)} value={formData.subscriptionStatus}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Estado de la suscripción" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Trial">Trial</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
