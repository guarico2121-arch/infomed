'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, ControllerRenderProps } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/firebase"; 
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import type { Doctor } from "@/lib/types";
import { useEffect, useState } from 'react';
import { Loader2, User as UserIcon } from "lucide-react";

// Expanded Zod schema
const profileFormSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  image: z.string().url({ message: "URL de imagen inválida." }).optional(),
  specialty: z.string().min(2, { message: "La especialidad es requerida." }),
  experienceYears: z.coerce.number().min(0, { message: "Los años de experiencia no pueden ser negativos." }),
  cost: z.coerce.number().min(0, { message: "El costo no puede ser negativo." }),
  city: z.string().min(2, { message: "La ciudad es requerida." }),
  location: z.string().optional(),
  googleMapsUrl: z.string().url({ message: "Debe ser una URL válida de Google Maps." }).optional(),
  contactPhone: z.string().optional(),
  instagramUrl: z.string().url({ message: "Debe ser una URL válida de Instagram." }).optional(),
  bio: z.string().max(1000, { message: "La biografía no puede exceder los 1000 caracteres." }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface DoctorProfileFormProps {
  onSubmit: (data: Partial<Doctor>) => Promise<boolean>;
  initialData: Partial<Doctor> | null;
}

export default function DoctorProfileForm({ onSubmit, initialData }: DoctorProfileFormProps) {
  const { user } = useUser(); // CRITICAL FIX: Use the correct hook to get the user object.
  const storage = getStorage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '', /* other defaults */ },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        image: initialData.image || undefined,
        specialty: initialData.specialty || '',
        experienceYears: initialData.experienceYears || 0,
        cost: initialData.cost || 0,
        city: initialData.city || '',
        location: initialData.location || '',
        googleMapsUrl: initialData.googleMapsUrl || '',
        contactPhone: initialData.contactPhone || '',
        instagramUrl: initialData.instagramUrl || '',
        bio: initialData.bio || '',
      });
      setImagePreview(initialData.image || null);
    }
  }, [initialData, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user || !storage) return null;

    const filePath = `doctor-profiles/${user.uid}/${Date.now()}-${imageFile.name}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, imageFile);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          reject(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleFormSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setUploadProgress(0);
    
    let finalData: Partial<Doctor> = { ...data };

    if (imageFile) {
      const newImageUrl = await uploadImage();
      if (newImageUrl) {
        finalData.image = newImageUrl;
      }
    }

    const success = await onSubmit(finalData);
    setIsSubmitting(false);
    if (success) {
      form.reset(finalData as ProfileFormValues); 
      setImageFile(null);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        
        <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
                <AvatarImage src={imagePreview || undefined} alt="Foto de Perfil" />
                <AvatarFallback><UserIcon className="h-10 w-10"/></AvatarFallback>
            </Avatar>
            <div className="grid gap-2 w-full">
                <FormLabel>Foto de Perfil</FormLabel>
                <Input id="picture" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} className="file:text-primary file:font-semibold"/>
                <FormDescription>Sube una foto profesional. Recomendado: 400x400px.</FormDescription>
            </div>
        </div>
        {isSubmitting && imageFile && <Progress value={uploadProgress} className="w-full" />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Completo*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="specialty" render={({ field }) => (<FormItem><FormLabel>Especialidad*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="experienceYears" render={({ field }) => (<FormItem><FormLabel>Años de Experiencia*</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="cost" render={({ field }) => (<FormItem><FormLabel>Costo de Consulta (USD)*</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>Ciudad*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono de Contacto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="instagramUrl" render={({ field }) => (<FormItem><FormLabel>Instagram</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="googleMapsUrl" render={({ field }: { field: ControllerRenderProps<ProfileFormValues, "googleMapsUrl"> }) => (<FormItem className="md:col-span-2"><FormLabel>URL de Google Maps</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="bio" render={({ field }: { field: ControllerRenderProps<ProfileFormValues, "bio"> }) => (<FormItem className="md:col-span-2"><FormLabel>Biografía Profesional</FormLabel><FormControl><Textarea className="resize-y min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>

        <Button type="submit" disabled={isSubmitting || !user} className="w-full md:w-auto">
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar Cambios'}
        </Button>
      </form>
    </Form>
  );
}
