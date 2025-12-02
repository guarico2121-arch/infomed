'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { SubscriptionPayment } from '@/lib/types';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusStyles: { [key: string]: string } = {
    pending: 'border-transparent bg-yellow-100 text-yellow-800',
    approved: 'border-transparent bg-green-100 text-green-800',
    rejected: 'border-transparent bg-red-100 text-red-800',
};

export default function AdminApprovalsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const paymentsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'subscription_payments') : null),
    [firestore]
  );
  const { data: payments, isLoading } = useCollection<SubscriptionPayment>(paymentsQuery);

  const handleApproval = async (payment: SubscriptionPayment, newStatus: 'approved' | 'rejected') => {
    if (!firestore) return;

    const paymentRef = doc(firestore, 'subscription_payments', payment.id);
    const doctorRef = doc(firestore, 'doctor_profiles', payment.doctorId);

    try {
      await updateDoc(paymentRef, { status: newStatus });
      if (newStatus === 'approved') {
        await updateDoc(doctorRef, { subscriptionStatus: 'Active' });
      }
      toast({ title: 'Éxito', description: `El pago ha sido ${newStatus === 'approved' ? 'aprobado' : 'rechazado'}.` });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado del pago.', variant: 'destructive' });
    }
  };

  const filteredPayments = (status: string) => payments?.filter(p => p.status === status) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aprobación de Pagos de Suscripción</CardTitle>
        <CardDescription>Revisa y aprueba los pagos de suscripción pendientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
            <TabsList>
                <TabsTrigger value="pending">Pendientes</TabsTrigger>
                <TabsTrigger value="approved">Aprobados</TabsTrigger>
                <TabsTrigger value="rejected">Rechazados</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
                {renderPaymentsTable(filteredPayments('pending'), isLoading, handleApproval)}
            </TabsContent>
             <TabsContent value="approved">
                {renderPaymentsTable(filteredPayments('approved'), isLoading, handleApproval)}
            </TabsContent>
             <TabsContent value="rejected">
                {renderPaymentsTable(filteredPayments('rejected'), isLoading, handleApproval)}
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function renderPaymentsTable(
    payments: SubscriptionPayment[], 
    isLoading: boolean, 
    handleApproval: (payment: SubscriptionPayment, newStatus: 'approved' | 'rejected') => void
) {
    return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doctor</TableHead>
              <TableHead>Fecha de Envío</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Comprobante</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Cargando pagos...</TableCell>
              </TableRow>
            )}
            {!isLoading && payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.doctorName}</TableCell>
                <TableCell>{payment.submittedAt?.toDate().toLocaleDateString()}</TableCell>
                <TableCell><Badge className={statusStyles[payment.status]}>{payment.status}</Badge></TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Ver Captura</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Comprobante de Pago</DialogTitle>
                      </DialogHeader>
                      <div className="relative h-[600px]">
                        <Image src={payment.paymentScreenshotUrl} alt="Comprobante de pago" layout="fill" objectFit="contain" />
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell className="text-right space-x-2">
                    {payment.status === 'pending' && (
                        <>
                            <Button size="sm" onClick={() => handleApproval(payment, 'approved')}>Aprobar</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleApproval(payment, 'rejected')}>Rechazar</Button>
                        </>
                    )}
                </TableCell>
              </TableRow>
            ))}
             {!isLoading && payments.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No hay pagos en esta categoría.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
    )
}
