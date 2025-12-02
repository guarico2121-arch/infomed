'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserCheck, DollarSign } from 'lucide-react';
import Link from 'next/link';
import type { SubscriptionPayment } from '@/lib/types';
import { BannerManagement } from '@/components/admin/BannerManagement';

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const doctorsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'doctor_profiles') : null), [firestore]);
  const pendingPaymentsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'subscription_payments'), where('status', '==', 'pending')) : null),
    [firestore]
  );
   const recentPaymentsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'subscription_payments'), orderBy('submittedAt', 'desc'), limit(5)) : null),
    [firestore]
  );

  const { data: users } = useCollection(usersQuery);
  const { data: doctors } = useCollection(doctorsQuery);
  const { data: pendingPayments } = useCollection(pendingPaymentsQuery);
  const { data: recentPayments, isLoading: isLoadingPayments } = useCollection<SubscriptionPayment>(recentPaymentsQuery);

  const stats = [
    { title: 'Usuarios Totales', value: users?.length ?? 0, icon: Users },
    { title: 'Doctores Registrados', value: doctors?.length ?? 0, icon: UserCheck },
    { title: 'Pagos Pendientes', value: pendingPayments?.length ?? 0, icon: DollarSign, href: '/admin/approvals' },
  ];

  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold">Dashboard de Administrador</h1>
            <p className="text-muted-foreground">Un resumen general de la actividad en InfoMed Central.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    {stat.href && <Link href={stat.href} className="text-xs text-muted-foreground hover:underline">Ver todos</Link>}
                </CardContent>
            </Card>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle>Pagos Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Fecha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingPayments && <TableRow><TableCell colSpan={3} className="text-center">Cargando...</TableCell></TableRow>}
                            {recentPayments?.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.doctorName}</TableCell>
                                    <TableCell>{p.status}</TableCell>
                                    <TableCell className="text-right">{p.submittedAt?.toDate().toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <BannerManagement />
        </div>
    </div>
  );
}
