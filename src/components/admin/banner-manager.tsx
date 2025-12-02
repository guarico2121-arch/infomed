'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Trash2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';

export function BannerManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const bannersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'banners'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: banners, isLoading: areBannersLoading } = useCollection(bannersQuery);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleUploadBanner = async () => {
    if (!title || !imageFile || !firestore) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor, añade un título y una imagen para el banner.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload image to Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `banners/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Create document in Firestore
      const bannerData = {
        title,
        subtitle,
        imageUrl: downloadURL,
        isActive: true,
        createdAt: serverTimestamp(),
      };
      const bannersCollection = collection(firestore, 'banners');
      await addDoc(bannersCollection, bannerData).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: bannersCollection.path,
            operation: 'create',
            requestResourceData: bannerData
        }));
        throw error;
      });

      toast({
        title: '¡Banner subido!',
        description: 'El nuevo banner ha sido añadido y está activo.',
      });
      resetForm();

    } catch (error: any) {
        if (error.name !== 'FirebaseError') {
             toast({
                title: 'Error al subir banner',
                description: error.message || 'No se pudo subir el banner. Revisa los permisos de Storage y Firestore.',
                variant: 'destructive',
            });
        }
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleToggleActive = async (bannerId: string, currentStatus: boolean) => {
    if (!firestore) return;
    const bannerRef = doc(firestore, 'banners', bannerId);
    const newStatus = { isActive: !currentStatus };
    try {
        await updateDoc(bannerRef, newStatus).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: bannerRef.path,
                operation: 'update',
                requestResourceData: newStatus
            }));
            throw error;
        });
    } catch (error: any) {
        if (error.name !== 'FirebaseError') {
            toast({ title: 'Error al actualizar', variant: 'destructive'});
        }
    }
  };
  
  const handleDeleteBanner = async (bannerId: string) => {
    if (!firestore) return;
    if (!window.confirm('¿Estás seguro de que quieres eliminar este banner? Esta acción no se puede deshacer.')) return;
    
    const bannerRef = doc(firestore, 'banners', bannerId);
    try {
        await deleteDoc(bannerRef).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: bannerRef.path,
                operation: 'delete',
            }));
            throw error;
        });
        toast({ title: 'Banner eliminado' });
    } catch (error: any) {
         if (error.name !== 'FirebaseError') {
            toast({ title: 'Error al eliminar', variant: 'destructive'});
        }
    }
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <h3 className="font-semibold text-lg mb-4">Subir Nuevo Banner</h3>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="banner-title">Título</Label>
            <Input
              id="banner-title"
              placeholder="Ej: Descuentos de Verano"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="banner-subtitle">Subtítulo (Opcional)</Label>
            <Input
              id="banner-subtitle"
              placeholder="Ej: Hasta 40% OFF"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              disabled={isUploading}
            />
          </div>
          <div className="grid gap-2">
            <Label>Imagen del Banner</Label>
            <Card
              className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="p-4 text-center">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Vista previa del banner"
                    width={300}
                    height={150}
                    className="w-full h-auto aspect-video object-cover rounded-md"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground h-32">
                    <UploadCloud className="h-8 w-8" />
                    <p className="text-sm">Haz clic para seleccionar una imagen</p>
                    <p className="text-xs">(Recomendado: 1200x400px)</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              disabled={isUploading}
            />
          </div>
          <Button onClick={handleUploadBanner} disabled={isUploading || !imageFile || !title} className="w-full">
            {isUploading ? 'Subiendo...' : 'Subir Banner'}
          </Button>
        </div>
      </div>
      <div className="md:col-span-2">
         <h3 className="font-semibold text-lg mb-4">Banners Actuales</h3>
         <div className="space-y-4">
            {areBannersLoading && Array.from({length: 2}).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            {banners?.map(banner => (
                <Card key={banner.id} className="p-3">
                    <div className="flex items-center gap-4">
                        {banner.imageUrl ? (
                             <Image
                                src={banner.imageUrl}
                                alt={banner.title}
                                width={160}
                                height={90}
                                className="w-40 h-auto aspect-video object-cover rounded-md bg-muted"
                            />
                        ) : (
                            <div className="w-40 h-auto aspect-video rounded-md bg-muted flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                       <div className="flex-grow">
                           <p className="font-semibold">{banner.title}</p>
                           <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                       </div>
                       <div className="flex flex-col items-center gap-2">
                           <Switch 
                            checked={banner.isActive}
                            onCheckedChange={() => handleToggleActive(banner.id, banner.isActive)}
                            aria-label="Activar banner"
                           />
                           <span className="text-xs">{banner.isActive ? 'Activo' : 'Inactivo'}</span>
                       </div>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteBanner(banner.id)}>
                            <Trash2 className="h-5 w-5 text-destructive" />
                       </Button>
                    </div>
                </Card>
            ))}
             {!areBannersLoading && banners?.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No hay banners subidos.</p>
             )}
         </div>
      </div>
    </div>
  );
}
