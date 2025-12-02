'use client';

import { useState, useMemo, useEffect } from "react";
import { format, addDays, getDay, isSameDay, parse, startOfDay, addMinutes, differenceInMinutes, getDaysInMonth, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Doctor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

interface AppointmentSchedulerProps {
  doctor: Doctor;
}

const APPOINTMENT_INTERVAL = 30; // 30 minutes

const generateTimeSlots = (
  startTime: string,
  endTime: string,
  interval: number = APPOINTMENT_INTERVAL
): string[] => {
  const slots: string[] = [];
  const today = new Date();
  let start = parse(startTime, "HH:mm", today);
  const end = parse(endTime, "HH:mm", today);
  const diff = differenceInMinutes(end, start);
  
  if (diff <= 0) return [];

  while (start < end) {
    slots.push(format(start, "HH:mm"));
    start = addMinutes(start, interval);
  }

  return slots;
};

export function AppointmentScheduler({ doctor }: AppointmentSchedulerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const dateParam = searchParams.get('date');
    const timeParam = searchParams.get('time');

    if (dateParam) {
      const date = parse(dateParam, 'yyyy-MM-dd', new Date());
      if (isValid(date)) {
        setSelectedDate(startOfDay(date));
        setCurrentMonth(date);
      }
    }
    if (timeParam) {
      // Basic validation for time format HH:mm
      if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(timeParam)) {
        setSelectedTime(timeParam);
      }
    }
  }, [searchParams]);


  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Selección incompleta",
        description: "Por favor, selecciona una fecha y una hora para agendar.",
        variant: "destructive",
      });
      return;
    }

    if (isUserLoading || !firestore) return;

    if (!user) {
        const date = format(selectedDate, 'yyyy-MM-dd');
        const time = selectedTime;
        const callbackUrl = `/doctors/${doctor.slug}?date=${date}&time=${time}`;
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
    }
    
    if (user.uid === doctor.id) {
        toast({
            title: "Acción no permitida",
            description: "No puedes agendar una cita contigo mismo.",
            variant: "destructive"
        });
        return;
    }

    setIsBooking(true);

    try {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const appointmentStart = new Date(selectedDate);
        appointmentStart.setHours(hours, minutes, 0, 0);

        const appointmentEnd = addMinutes(appointmentStart, APPOINTMENT_INTERVAL);

        const appointmentData = {
            doctorId: doctor.id,
            patientId: user.uid,
            startTime: Timestamp.fromDate(appointmentStart),
            endTime: Timestamp.fromDate(appointmentEnd),
            status: 'Confirmed',
            cost: doctor.cost,
        };

        const appointmentsCollection = collection(firestore, 'appointments');
        await addDoc(appointmentsCollection, appointmentData).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: appointmentsCollection.path,
                operation: 'create',
                requestResourceData: appointmentData,
            }));
            throw error;
        });

        toast({
            title: "¡Cita Agendada!",
            description: `Tu cita con ${doctor.name} ha sido confirmada para el ${format(selectedDate, "d 'de' MMMM", { locale: es })} a las ${selectedTime}.`,
        });

        setSelectedTime(null);
        setSelectedDate(null);
        // Remove query params after booking
        router.replace(`/doctors/${doctor.slug}`, undefined);

    } catch (error: any) {
        console.error("Error booking appointment:", error);
         if (error.name !== 'FirebaseError') {
            toast({
                title: "Error al agendar",
                description: error.message || "Hubo un problema al crear tu cita. Intenta de nuevo.",
                variant: "destructive",
            });
        }
    } finally {
        setIsBooking(false);
    }
  };

  const today = startOfDay(new Date());

  const firstDayOfMonth = useMemo(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), [currentMonth]);
  const daysInMonth = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  const startingDayOfWeek = useMemo(() => (getDay(firstDayOfMonth) + 6) % 7, [firstDayOfMonth]); // Adjust to make Monday the first day (0)

  const calendarDays = useMemo(() => {
      const dates: (Date | null)[] = [];
      for (let i = 0; i < startingDayOfWeek; i++) {
          dates.push(null); // padding
      }
      for (let i = 1; i <= daysInMonth; i++) {
          dates.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
      }
      return dates;
  }, [startingDayOfWeek, daysInMonth, currentMonth]);

  const availableTimes = useMemo(() => {
    if (!selectedDate || !doctor.availability) return [];

    const dayIndex = (getDay(selectedDate) + 6) % 7; // Monday = 0, Sunday = 6
    const availabilityForDay = doctor.availability[dayIndex] || [];

    let allSlots: string[] = [];
    availabilityForDay.forEach(slot => {
        allSlots = [...allSlots, ...generateTimeSlots(slot.startTime, slot.endTime)];
    });
    
    return [...new Set(allSlots)].sort();

  }, [selectedDate, doctor.availability]);

  const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const prevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));

  return (
    <div className="bg-card p-6 rounded-2xl shadow-lg w-full max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-muted"><ChevronLeft className="h-5 w-5" /></button>
            <h3 className="font-bold text-lg capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h3>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-muted"><ChevronRight className="h-5 w-5" /></button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="font-medium text-muted-foreground">{day}</div>
            ))}
            {calendarDays.map((day, index) => (
                <div key={index} className="flex justify-center">
                    {day ? (
                        <button
                            onClick={() => setSelectedDate(startOfDay(day))}
                            disabled={day < today}
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                selectedDate && isSameDay(day, selectedDate) 
                                    ? "bg-primary text-primary-foreground"
                                    : day >= today 
                                        ? "hover:bg-muted"
                                        : "text-muted-foreground"
                            )}
                        >
                            {format(day, 'd')}
                        </button>
                    ) : <div />}
                </div>
            ))}
        </div>

        <div className="mt-6">
            <h4 className="font-semibold mb-3">Elige una hora</h4>
            {selectedDate && availableTimes.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                    {availableTimes.map(time => (
                        <Button
                            key={time}
                            variant={selectedTime === time ? 'default' : 'outline'}
                            onClick={() => setSelectedTime(time)}
                            className={cn("w-full", selectedTime === time && "bg-primary text-primary-foreground")}
                        >
                            {time}
                        </Button>
                    ))}
                </div>
            ) : (
                <div className="text-center text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                    {selectedDate ? "No hay horarios disponibles para este día." : "Selecciona una fecha para ver los horarios."}
                </div>
            )}
        </div>

        <div className="mt-8">
            <Button 
                size="lg"
                className="w-full h-12 text-base font-bold rounded-full bg-primary shadow-lg hover:bg-primary/90"
                disabled={!selectedTime || isBooking || isUserLoading}
                onClick={handleBooking}
            >
                {isUserLoading ? 'Cargando...' : (isBooking ? "Agendando..." : (user ? "Confirmar Cita" : "Continuar para Agendar"))}
            </Button>
        </div>
    </div>
  );
}

const addMonths = (date: Date, months: number) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
}

const subMonths = (date: Date, months: number) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() - months);
    return newDate;
}
