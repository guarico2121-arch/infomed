'use client';

import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, User as UserIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const isProfilePage = pathname.startsWith('/profile');
  
  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile } = useDoc(userProfileRef);
  const isDoctor = userProfile?.roles?.includes('DOCTOR');


  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };
  
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.substring(0, 2).toUpperCase();
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  if (isProfilePage) {
    return null; // Don't render header on profile dashboard
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4">
           <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Menú Principal</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 p-4">
                     <Link href="/" aria-label="Volver a la página principal">
                      <Logo />
                    </Link>
                    <nav className="flex flex-col gap-4 text-lg font-medium">
                      <Link href="/search" className="text-muted-foreground hover:text-primary">
                        Buscar
                      </Link>
                      <Link href="#for-doctors" className="text-muted-foreground hover:text-primary">
                        Para Médicos
                      </Link>
                      <Link href="#" className="text-muted-foreground hover:text-primary">
                        Comunidad
                      </Link>
                    </nav>
                    <div className="mt-auto flex flex-col gap-2">
                      {user ? (
                         <>
                          <Button variant="outline" asChild>
                            <Link href="/profile">Mi Perfil</Link>
                          </Button>
                          <Button variant="ghost" onClick={handleSignOut}>Cerrar Sesión</Button>
                         </>
                      ) : (
                        <>
                          <Button variant="ghost" asChild><Link href="/login">Iniciar Sesión</Link></Button>
                          <Button variant="default" asChild><Link href="/register">Registrarse</Link></Button>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
           </div>
           <Link href="/" aria-label="Volver a la página principal" className="hidden md:block">
            <Logo />
          </Link>
        </div>

        <div className="relative hidden flex-grow max-w-md md:flex">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar especialistas, clínicas, servicios..."
            className="w-full rounded-full bg-muted pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {isUserLoading ? (
            <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.photoURL || undefined} alt="Avatar de usuario" />
                    <AvatarFallback>{getInitials(user.displayName, user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'Mi Cuenta'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/register">Registrarse</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
