'use client';

import { useState } from 'react';
import { useFirestore, useFirebaseStorage, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import type { Banner } from '@/lib/types';
import Image from 'next/image';

export function BannerManagement() {
  const firestore = useFirestore();
  const storage = useFirebaseStorage();
  const { toast } = useToast();

  const bannersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'banners'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: banners, isLoading: isLoadingBanners, error } = useCollection<Banner>(bannersQuery);

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !storage || !file || !title) {
      toast({ title: 'Error', description: 'Por favor, completa el título y selecciona una imagen.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);

    try {
      const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(firestore, 'banners'), {
        title,
        imageUrl: downloadURL,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Éxito', description: 'El banner ha sido subido correctamente.' });
      setTitle('');
      setFile(null);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo subir el banner.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!firestore || !storage) return;

    try {
        // Delete the document from Firestore
        await deleteDoc(doc(firestore, 'banners', banner.id));

        // Delete the image from Storage
        const imageRef = ref(storage, banner.imageUrl);
        await deleteObject(imageRef);

        toast({ title: 'Éxito', description: 'Banner eliminado correctamente.' });
    } catch (err) {
        toast({ title: 'Error', description: 'No se pudo eliminar el banner.', variant: 'destructive' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Banners</CardTitle>
        <CardDescription>Añade o elimina banners promocionales de la página principal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="bannerTitle">Título del Banner</Label>
                <Input id="bannerTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: ¡Nueva función!" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="bannerImage">Imagen del Banner</Label>
                <Input id="bannerImage" type="file" onChange={handleFileChange} required />
            </div>
          <Button type="submit" disabled={isUploading}>{isUploading ? 'Subiendo...' : 'Subir Banner'}</Button>
        </form>

        <div className="space-y-4">
            <h3 className="text-lg font-medium">Banners Activos</h3>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Imagen</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoadingBanners && <TableRow><TableCell colSpan={3} className="text-center">Cargando banners...</TableCell></TableRow>}
                    {banners?.map((banner) => (
                        <TableRow key={banner.id}>
                            <TableCell>
                                <Image src={banner.imageUrl} alt={banner.title} width={100} height={50} className="rounded-md object-cover" />
                            </TableCell>
                            <TableCell className="font-medium">{banner.title}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(banner)}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {error && <p className="text-red-500">Error al cargar los banners: {error.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
