'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useFirebaseStorage, useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

import type { Doctor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Upload, X, Plus, Trash2, Clock, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const weekDays = [
  { id: 0, name: 'Domingo' },
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
];

const profileFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  specialty: z.string().min(3, { message: 'La especialidad es requerida.' }),
  experienceYears: z.coerce.number().min(0, { message: 'La experiencia debe ser un número positivo.' }),
  biography: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  googleMapsUrl: z.string().url({ message: 'Por favor, introduce una URL válida de Google Maps.' }).optional().or(z.literal('')),
  cost: z.coerce.number().min(0, { message: 'El costo debe ser un número positivo.' }),
  availability: z.object({
    '0': z.array(z.object({ startTime: z.string(), endTime: z.string() })).optional(),
    '1': z.array(z.object({ startTime: z.string(), endTime: z.string() })).optional(),
    '2': z.array(z.object({ startTime: z.string(), endTime: z.string() })).optional(),
    '3': z.array(z.object({ startTime: z.string(), endTime: z.string() })).optional(),
    '4': z.array(z.object({ startTime: z.string(), endTime: z.string() })).optional(),
    '5': z.array(z.object({ startTime: z.string(), endTime: z.string() })).optional(),
    '6': z.array(z.object({ startTime: z.string(), endTime: z.string() })).optional(),
  }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function DoctorProfileForm({ doctor }: { doctor: Doctor }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useFirebaseStorage();
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(doctor.profilePictureUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: doctor.name || '',
      specialty: doctor.specialty || '',
      experienceYears: doctor.experienceYears || 0,
      biography: doctor.biography || '',
      address: doctor.address || '',
      city: doctor.city || '',
      googleMapsUrl: doctor.googleMapsUrl || '',
      cost: doctor.cost || 0,
      availability: doctor.availability || {},
    },
  });

  const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "availability.1" // Defaulting to Monday, will be adapted
  });

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!firestore || !doctor.id) return;
    setIsSubmitting(true);

    try {
      let downloadURL = doctor.profilePictureUrl;

      // Upload new profile picture if one was selected
      if (profilePictureFile && storage) {
        const storageRef = ref(storage, `doctor_profile_pictures/${doctor.id}/${profilePictureFile.name}`);
        await uploadBytes(storageRef, profilePictureFile);
        downloadURL = await getDownloadURL(storageRef);
      }

      // Update Firestore document
      const doctorRef = doc(firestore, 'doctor_profiles', doctor.id);
      await updateDoc(doctorRef, {
        ...data,
        profilePictureUrl: downloadURL,
      });

      // Update auth profile if name changed
      if (auth?.currentUser && auth.currentUser.displayName !== data.name) {
          await updateProfile(auth.currentUser, { displayName: data.name });
      }

      toast({
        title: '¡Perfil Actualizado!',
        description: 'Tu información ha sido guardada correctamente.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al actualizar tu perfil. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-12">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Tu Perfil Profesional</CardTitle>
                        <CardDescription>Esta es la información que los pacientes verán. Mantenla actualizada.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row items-start gap-8">
                            <div className="flex-shrink-0">
                                <Label>Foto de Perfil</Label>
                                <div
                                    className="relative mt-2 w-40 h-40 rounded-full border-4 border-muted overflow-hidden group cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {profilePicturePreview ? (
                                        <Image
                                        src={profilePicturePreview}
                                        alt="Foto de perfil"
                                        fill
                                        className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <Upload className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleProfilePictureChange}
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/webp"
                                />
                            </div>
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                        <FormLabel>Nombre Completo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Dr. Juan Pérez" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                <FormField
                                    control={form.control}
                                    name="specialty"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Especialidad</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Cardiología" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                <FormField
                                    control={form.control}
                                    name="experienceYears"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Años de Experiencia</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <FormField
                            control={form.control}
                            name="biography"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Biografía</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="Habla un poco sobre tu trayectoria, enfoque y lo que te apasiona de tu especialidad..."
                                    className="min-h-[120px]"
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Ubicación y Consulta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Dirección del Consultorio</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Av. Principal, Torre Médica, Piso 5" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Ciudad</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Caracas" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                                control={form.control}
                                name="googleMapsUrl"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>URL de Google Maps</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Pega aquí el enlace para compartir de Google Maps" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        <FormField
                            control={form.control}
                            name="cost"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Costo de la Consulta (USD)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                        <Input type="number" placeholder="50.00" className="pl-8" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/> Horario de Disponibilidad</CardTitle>
                        <CardDescription>Define los bloques de tiempo en los que aceptas citas. Los pacientes podrán reservar en estos horarios.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {weekDays.map(day => {
                            const fieldName = `availability.${day.id}` as const;
                            return (
                                <AvailabilityDay
                                    key={day.id}
                                    dayName={day.name}
                                    control={form.control}
                                    fieldName={fieldName}
                                    />
                            )
                        })}
                    </CardContent>
                </Card>
                
                <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
}

function AvailabilityDay({ dayName, control, fieldName }) {
    const { fields, append, remove } = useFieldArray({ control, name: fieldName });

    return (
         <div className="grid grid-cols-[120px_1fr] items-start gap-4 p-3 rounded-lg border">
            <Label className="font-semibold pt-3">{dayName}</Label>
            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                         <FormField
                            control={control}
                            name={`${fieldName}.${index}.startTime`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                         <span>-</span>
                         <FormField
                            control={control}
                            name={`${fieldName}.${index}.endTime`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ startTime: '09:00', endTime: '17:00' })}
                    className="w-full"
                    >
                    <Plus className="mr-2 h-4 w-4" /> Añadir Bloque
                </Button>
            </div>
        </div>
    )
}
