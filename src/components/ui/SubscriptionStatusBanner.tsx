'use client';

import type { FC } from 'react';
import { useRouter } from 'next/navigation';
import type { Timestamp } from 'firebase/firestore';

interface SubscriptionStatusBannerProps {
  status?: 'Trial' | 'Active' | 'Suspended' | 'Expired' | 'Pending';
  createdAt: Timestamp; // Start of the trial or last subscription period
}

// Helper to calculate days passed since a certain date
const getDaysSince = (date: Timestamp): number => {
  const eventDate = date.toDate();
  const now = new Date();
  const timeDifference = now.getTime() - eventDate.getTime();
  return Math.floor(timeDifference / (1000 * 60 * 60 * 24));
};

const SubscriptionStatusBanner: FC<SubscriptionStatusBannerProps> = ({ status, createdAt }) => {
  const router = useRouter();
  const trialDuration = 30;
  const gracePeriodDays = 5;
  const reactivationFee = 3; // The $3 reactivation fee
  const baseSubscriptionFee = 5; // The base $5 fee

  const handleSubscription = () => {
    router.push('/profile/subscribe');
  };

  const currentStatus = status || 'Trial';
  let bannerContent = null;

  // We need a reference date for expiration calculation. For trial, it's createdAt.
  // For a paid user, this would be the subscription start date.
  const trialDaysRemaining = trialDuration - getDaysSince(createdAt);

  switch (currentStatus) {
    case 'Trial':
      if (trialDaysRemaining > 3) {
        bannerContent = (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
            <p className="font-bold">Período de Prueba Activo</p>
            <p>Te quedan {trialDaysRemaining} día(s). <span className="underline cursor-pointer" onClick={handleSubscription}>Suscríbete ahora</span> por ${baseSubscriptionFee} para no perder acceso.</p>
          </div>
        );
      } else if (trialDaysRemaining > 0 && trialDaysRemaining <= 3) {
        bannerContent = (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
            <p className="font-bold">¡Tu prueba termina en {trialDaysRemaining} día(s)!</p>
            <p>No arriesgues la visibilidad de tu perfil.</p>
             <button onClick={handleSubscription} className="mt-2 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
              Suscribirse Ahora por ${baseSubscriptionFee}
            </button>
          </div>
        );
      } else {
         bannerContent = (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p className="font-bold">Período de Prueba Expirado</p>
            <p>Tu perfil está oculto. Reactívalo ahora para no incurrir en cargos adicionales.</p>
            <button onClick={handleSubscription} className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Reactivar por ${baseSubscriptionFee}
            </button>
          </div>
        );
      }
      break;

    case 'Expired':
      // This assumes 'createdAt' would be updated to the start of a paid subscription.
      // For now, we'll continue using the initial trial start for calculation.
      const daysExpired = Math.abs(trialDaysRemaining);

      bannerContent = (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Suscripción Vencida</p>
          <p>Tu perfil está desactivado. La reactivación tiene un cargo de ${reactivationFee} además del costo de suscripción.</p>
          <button onClick={handleSubscription} className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Reactivar por ${baseSubscriptionFee + reactivationFee}
          </button>
        </div>
      );
      
       if (daysExpired > gracePeriodDays) {
         bannerContent = (
          <div className="bg-black border-l-4 border-red-700 text-white p-4" role="alert">
            <p className="font-bold">ALERTA: MORA EXTENDIDA</p>
            <p>Tu suscripción ha estado vencida por más de {gracePeriodDays} días. Para evitar la **pérdida permanente de tus métricas**, debes reactivar tu cuenta inmediatamente.</p>
            <button onClick={handleSubscription} className="mt-2 bg-red-600 hover:bg-red-800 font-bold py-2 px-4 rounded">
              ¡Reactivar AHORA por ${baseSubscriptionFee + reactivationFee}!
            </button>
          </div>
        );
      }
      break;

    case 'Pending':
      bannerContent = (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">Pago Pendiente de Verificación</p>
          <p>Recibimos tu reporte de pago. Tu perfil se reactivará en las próximas 24 horas tras la aprobación.</p>
        </div>
      );
      break;

    case 'Active':
      // No banner for active, paid users to maintain a clean UI.
      break;
  }

  if (!bannerContent) {
    return null;
  }

  return <div className="my-4 container mx-auto">{bannerContent}</div>;
};

export default SubscriptionStatusBanner;
