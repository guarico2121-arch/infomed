
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || isLoading) return;

    setIsLoading(true);
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
      toast({
        title: 'Correo Enviado',
        description: `Se ha enviado un enlace para restablecer tu contraseña a ${email}. Revisa tu bandeja de entrada.`,
      });
    } catch (error: any) {
      let description = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
      if (error.code === 'auth/user-not-found') {
        description = 'No se encontró ninguna cuenta con esa dirección de correo electrónico.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'La dirección de correo electrónico no es válida.';
      }
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Recuperar Contraseña</CardTitle>
          <CardDescription className="text-center pt-2">
            {isSent
              ? 'Revisa tu correo para continuar con el proceso.'
              : 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSent ? (
            <div className="text-center">
                <p className="mb-4">Si no recibes el correo en unos minutos, revisa tu carpeta de spam o intenta de nuevo.</p>
                 <Button onClick={() => router.push('/login')} className="w-full">Volver a Iniciar Sesión</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Enlace de Recuperación
              </Button>
            </form>
          )}
           <div className="mt-4 text-center text-sm">
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Recordé mi contraseña
              </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
