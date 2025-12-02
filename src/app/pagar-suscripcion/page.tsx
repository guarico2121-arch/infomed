'use client';

import { useState } from 'react';
import { useFirestore, useFirebaseStorage } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function PagarSuscripcionPage() {
  const firestore = useFirestore();
  const storage = useFirebaseStorage();
  const { toast } = useToast();

  const [doctorId, setDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !storage || !file || !doctorId || !doctorName) {
      toast({ title: 'Error', description: 'Por favor completa todos los campos y selecciona un archivo.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const storageRef = ref(storage, `payment_screenshots/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(firestore, 'subscription_payments'), {
        doctorId,
        doctorName,
        paymentScreenshotUrl: downloadURL,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });

      toast({ title: 'Éxito', description: 'Tu comprobante de pago ha sido enviado. Será revisado por un administrador.' });
      setDoctorId('');
      setDoctorName('');
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('paymentScreenshot') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo enviar el comprobante.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Enviar Comprobante de Pago</CardTitle>
          <CardDescription>Completa el formulario para registrar tu pago de suscripción. Un administrador lo revisará y activará tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="doctorName">Nombre Completo del Doctor</Label>
                <Input
                id="doctorName"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Ej: Dr. Juan Pérez"
                required
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="doctorId">ID de Doctor</Label>
                <Input
                id="doctorId"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                placeholder="El ID único de tu perfil"
                required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="paymentScreenshot">Captura de Pantalla del Pago</Label>
                <Input id="paymentScreenshot" type="file" onChange={handleFileChange} required />
            </div>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Enviando...' : 'Enviar Comprobante'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
