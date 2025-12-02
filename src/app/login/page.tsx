
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;

    setIsLoading(true);
    const auth = getAuth();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Inicio de Sesión Exitoso',
        description: 'Bienvenido de nuevo.',
      });
      router.push('/profile'); // Redirige al perfil, que manejará el rol.
      router.refresh();
    } catch (error: any) {
      let description = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = 'El correo electrónico o la contraseña son incorrectos.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'La dirección de correo electrónico no es válida.';
      }
       toast({
        title: 'Error al Iniciar Sesión',
        description,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center pt-2">
            Accede a tu cuenta de InfoMed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                  <label htmlFor="password">Contraseña</label>
                  <div className="text-sm">
                      <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                          ¿Olvidaste tu contraseña?
                      </Link>
                  </div>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            ¿No tienes una cuenta?{
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                 Regístrate aquí
              </Link>
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
