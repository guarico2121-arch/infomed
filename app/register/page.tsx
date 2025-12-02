'use client';

import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Eye, EyeOff, User, BriefcaseMedical } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';


export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [healthRegistryNumber, setHealthRegistryNumber] = useState('');
  const [medicalFederationNumber, setMedicalFederationNumber] = useState('');
  
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({ title: 'Las contraseñas no coinciden', description: 'Por favor, verifica tu contraseña.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    
    if (!auth || !firestore) {
      toast({ title: "Error de inicialización", description: "El servicio no está listo, intente de nuevo.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const fullName = `${firstName} ${lastName}`.trim();
      await updateProfile(user, { displayName: fullName });

      const userDocRef = doc(firestore, 'users', user.uid);
      const userData = {
        id: user.uid,
        name: fullName,
        firstName,
        lastName,
        email: user.email,
        role: role,
        country: 'Venezuela',
        language: 'es',
        currency: 'USD',
      };
      await setDoc(userDocRef, userData);

      if (role === 'DOCTOR') {
        const doctorProfileRef = doc(firestore, 'doctor_profiles', user.uid);
        const doctorProfileData = {
          id: user.uid,
          userId: user.uid,
          name: fullName,
          email: user.email,
          specialty: '',
          experienceYears: 0,
          healthRegistryNumber: healthRegistryNumber.trim(),
          medicalFederationNumber: medicalFederationNumber.trim(),
          biography: '',
          address: '',
          googleMapsUrl: '',
          contactPhone: '',
          profilePictureUrl: '',
          cost: 0,
          subscriptionStatus: 'Trial',
        };
        await setDoc(doctorProfileRef, doctorProfileData);
      }

      toast({ title: '¡Registro exitoso!', description: 'Tu cuenta ha sido creada. Ahora completa tu perfil.' });
      router.push('/profile');

    } catch (error: any) {
      console.error(error);
      let description = 'Hubo un problema al crear tu cuenta. Por favor, intenta de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este correo electrónico ya está en uso. Por favor, inicia sesión o usa un correo diferente.';
      } else if (error.code === 'auth/weak-password') {
        description = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
      }
      toast({ title: 'Error en el registro', description, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Crear una Cuenta</CardTitle>
          <CardDescription>Únete a InfoMed Central para encontrar especialistas o para ofrecer tus servicios.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="grid gap-4">
             <div className="grid gap-2">
                <Label>¿Qué tipo de cuenta necesitas?</Label>
                <RadioGroup defaultValue="PATIENT" onValueChange={(value: 'PATIENT' | 'DOCTOR') => setRole(value)} className="grid grid-cols-2 gap-4">
                    <Label htmlFor="role-patient" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", role === 'PATIENT' && "border-primary")}>
                         <User className="mb-3 h-6 w-6" />
                         Soy Paciente
                         <RadioGroupItem value="PATIENT" id="role-patient" className="sr-only" />
                    </Label>
                     <Label htmlFor="role-doctor" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", role === 'DOCTOR' && "border-primary")}>
                         <BriefcaseMedical className="mb-3 h-6 w-6" />
                         Soy Profesional
                         <RadioGroupItem value="DOCTOR" id="role-doctor" className="sr-only" />
                    </Label>
                </RadioGroup>
            </div>

            {role === 'DOCTOR' && (
                <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
                     <div className="grid gap-2 md:col-span-2"><p className='text-sm font-medium text-foreground'>Credenciales Profesionales</p></div>
                    <div className="grid gap-2">
                        <Label htmlFor="healthRegistryNumber">N° de Sanidad</Label>
                        <Input id="healthRegistryNumber" placeholder="Ej: 12.345" value={healthRegistryNumber} onChange={e => setHealthRegistryNumber(e.target.value)} disabled={isLoading} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="medicalFederationNumber">N° Colegiado</Label>
                        <Input id="medicalFederationNumber" placeholder="Ej: 67.890" value={medicalFederationNumber} onChange={e => setMedicalFederationNumber(e.target.value)} disabled={isLoading} required />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">Nombres</Label>
                <Input id="first-name" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Apellidos</Label>
                <Input id="last-name" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" placeholder="nombre@ejemplo.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff /> : <Eye />}<span className="sr-only">{showPassword ? 'Ocular' : 'Mostrar'} contraseña</span>
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <div className="relative">
                <Input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isLoading} />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff /> : <Eye />}<span className="sr-only">{showConfirmPassword ? 'Ocular' : 'Mostrar'} contraseña</span>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Creando Cuenta...' : 'Crear Cuenta'}</Button>
             <p className="text-sm text-muted-foreground">¿Ya tienes una cuenta?{' '}<Link href="/login" className="font-semibold text-primary hover:underline">Inicia sesión</Link></p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
