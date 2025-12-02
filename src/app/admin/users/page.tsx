'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const adminsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'roles_admin') : null),
    [firestore]
  );
  const { data: admins, isLoading: adminsLoading } = useCollection(adminsQuery);

  const adminUids = useMemo(() => new Set(admins?.map(a => a.id)), [admins]);

  const handleRoleChange = async (user: UserProfile & { id: string }, isAdmin: boolean) => {
    if (!firestore) return;
    const adminRoleRef = doc(firestore, 'roles_admin', user.id);
    try {
      if (isAdmin) {
        await setDoc(adminRoleRef, { isAdmin: true });
        toast({ title: 'Rol actualizado', description: `${user.name} ahora es administrador.` });
      } else {
        await deleteDoc(adminRoleRef);
        toast({ title: 'Rol actualizado', description: `${user.name} ya no es administrador.` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el rol.', variant: 'destructive' });
    }
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const isLoading = usersLoading || adminsLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
        <CardDescription>Asigna roles de administrador a los usuarios del sistema.</CardDescription>
        <Input
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm mt-4"
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Administrador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">Cargando...</TableCell>
              </TableRow>
            )}
            {!isLoading && filteredUsers?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name || 'N/A'}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={adminUids.has(user.id)}
                    onCheckedChange={(isChecked) => handleRoleChange(user, isChecked)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
