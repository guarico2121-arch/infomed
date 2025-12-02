'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  ChevronLeft,
  Heart,
  Send,
  Lock,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppointmentScheduler } from '@/components/appointment-scheduler';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit, addDoc, serverTimestamp, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Doctor, Rating, Status } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts"
import { ChartContainer } from "@/components/ui/chart"

// --- ADAPTER --- //
const DoctorProfileAdapter = (profile: any, ratingData?: any): Doctor | null => {
    if (!profile) return null;
    return {
        id: profile.id,
        slug: profile.id,
        name: profile.name || 'Doctor Sin Nombre',
        specialty: profile.specialty || 'Sin especialidad',
        experienceYears: profile.experienceYears || 0,
        location: profile.address || 'Ubicación no especificada',
        city: profile.city || 'Ciudad no especificada',
        rating: ratingData?.average,
        reviews: ratingData?.count,
        bio: profile.biography || '',
        isFeatured: profile.isFeatured || false,
        image: profile.profilePictureUrl || "",
        availability: profile.availability || {},
        insurances: profile.insurances || [],
        googleMapsUrl: profile.googleMapsUrl || '',
        cost: profile.cost || 0,
        posts: [],
    };
}

// --- SUB-COMPONENTS --- //

function Comment({ rating }: { rating: Rating }) {
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(
      () => (firestore && rating.patientId ? doc(firestore, 'users', rating.patientId) : null),
      [firestore, rating.patientId]
    );
    const { data: author, isLoading } = useDoc(userProfileRef);
    const timeAgo = rating.createdAt ? formatDistanceToNow(rating.createdAt.toDate(), { addSuffix: true, locale: es }) : 'justo ahora';

    if (isLoading) return <Skeleton className="h-24 w-full" />;

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Avatar className="h-12 w-12 border">
                        <AvatarImage src={author?.photoURL || undefined} />
                        <AvatarFallback>{author?.name?.substring(0, 2).toUpperCase() || 'P'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <p className="font-bold">{author?.name || 'Paciente'}</p>
                                <p className="text-sm text-muted-foreground">·</p>
                                <p className="text-sm text-muted-foreground">{timeAgo}</p>
                            </div>
                             <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={cn("h-4 w-4", i < rating.rating ? "text-yellow-400" : "text-muted-foreground/30")} fill="currentColor" />
                                ))}
                            </div>
                        </div>
                        <p className="whitespace-pre-wrap text-muted-foreground">{rating.comment}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StarRatingInput({ rating, setRating, disabled = false }: { rating: number; setRating: (r: number) => void; disabled?: boolean; }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button type="button" key={starValue} className={cn("cursor-pointer", disabled && "cursor-not-allowed")} onClick={() => !disabled && setRating(starValue)} onMouseEnter={() => !disabled && setHover(starValue)} onMouseLeave={() => !disabled && setHover(0)}>
            <Star className={cn("h-6 w-6 transition-colors", starValue <= (hover || rating) ? "text-yellow-400" : "text-muted-foreground/30")} fill="currentColor" />
          </button>
        );
      })}
    </div>
  );
}

function CommentsFeed({ doctorId, doctorName }: { doctorId: string, doctorName: string }) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [canReview, setCanReview] = useState(false);
    const [completedAppointmentId, setCompletedAppointmentId] = useState<string | null>(null);

    useEffect(() => {
        const checkReviewEligibility = async () => {
            if (isUserLoading || !user || !firestore || !doctorId) return;
            try {
                const appointmentsQuery = query(collection(firestore, 'appointments'), where('patientId', '==', user.uid), where('doctorId', '==', doctorId), where('status', '==', 'Completed'));
                const querySnapshot = await getDocs(appointmentsQuery);
                if (!querySnapshot.empty) {
                    setCanReview(true);
                    setCompletedAppointmentId(querySnapshot.docs[0].id);
                } else {
                    setCanReview(false);
                    setCompletedAppointmentId(null);
                }
            } catch (error) {
                console.error("Error checking review eligibility:", error);
                setCanReview(false);
            }
        };
        checkReviewEligibility();
    }, [user, isUserLoading, firestore, doctorId]);

    const ratingsQuery = useMemoFirebase(() => {
      if (!firestore || !doctorId) return null;
      return query(collection(firestore, `ratings`), where('doctorId', '==', doctorId), orderBy('createdAt', 'desc'), limit(10));
    }, [firestore, doctorId]);
    const { data: ratings, isLoading } = useCollection<Rating>(ratingsQuery);

    const handlePostComment = async () => {
        if (!completedAppointmentId) {
             toast({ title: 'No se puede enviar la reseña', description: 'Debes tener una cita completada para poder calificar.', variant: 'destructive' });
             return;
        }
        if (!comment.trim()) { toast({ title: 'El comentario está vacío', variant: 'destructive' }); return; }
        if (rating === 0) { toast({ title: 'Debes seleccionar una calificación', variant: 'destructive' }); return; }
        if (!user || !firestore) return;
        
        setIsSubmitting(true);
        try {
            const ratingsCollection = collection(firestore, 'ratings');
            const ratingData = { doctorId, patientId: user.uid, comment, rating, createdAt: serverTimestamp(), appointmentId: completedAppointmentId };
            await addDoc(ratingsCollection, ratingData).catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ratingsCollection.path, operation: 'create', requestResourceData: ratingData }));
                throw error;
            });
            toast({ title: '¡Comentario enviado!', description: 'Gracias por tu opinión.' });
            setComment('');
            setRating(0);
            setCanReview(false);
        } catch(error: any) {
             if (error.name !== 'FirebaseError') {
                toast({ title: 'Error al enviar comentario', description: 'Hubo un problema. Intenta de nuevo.', variant: 'destructive' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const shouldShowFeed = ratings && ratings.length > 0;
    const shouldShowEmptyState = !isLoading && (!ratings || ratings.length === 0);

    return (
        <div className="space-y-6">
             <h3 className="font-bold text-lg">Reseñas de Pacientes</h3>
            {user && canReview && (
            <Card>
                <CardHeader><CardTitle className="font-headline text-xl">Deja una reseña</CardTitle></CardHeader>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                         <Avatar className="h-10 w-10 border">
                            <AvatarImage src={user.photoURL || undefined} />
                            <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="w-full space-y-4">
                             <Textarea placeholder={`Comparte tu experiencia con ${doctorName}...`} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 p-2 shadow-none text-base" disabled={isSubmitting}/>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <StarRatingInput rating={rating} setRating={setRating} disabled={isSubmitting} />
                                <Button onClick={handlePostComment} disabled={isSubmitting} className="w-full sm:w-auto">{isSubmitting ? 'Enviando...' : <><Send className="mr-2 h-4 w-4" /> Enviar Reseña</>}</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            )}
             {user && !canReview && !isUserLoading && (
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground flex items-center justify-center gap-3">
                        <Lock className="h-5 w-5" />
                        <span>Debes completar una cita con este doctor para poder dejar una reseña.</span>
                    </CardContent>
                </Card>
             )}
            {isLoading && <div className="space-y-4"><Skeleton className="h-28 w-full rounded-lg" /><Skeleton className="h-28 w-full rounded-lg" /></div>}
            {shouldShowFeed && ratings.map(r => <Comment key={r.id} rating={r} />)}
            {shouldShowEmptyState && <Card className="my-6"><CardContent className="p-6 text-center text-muted-foreground">Este doctor aún no tiene reseñas.</CardContent></Card>}
        </div>
    );
}

function DoctorStatuses({ doctorId, doctorName, doctorImage }: { doctorId: string, doctorName: string, doctorImage: string }) {
    const firestore = useFirestore();
    const now = new Date();

    const statusesQuery = useMemoFirebase(() => {
        if (!firestore || !doctorId) return null;
        return query(collection(firestore, `doctor_profiles/${doctorId}/statuses`), where('expiresAt', '>', Timestamp.fromDate(now)), orderBy('expiresAt', 'desc'), limit(5));
    }, [firestore, doctorId]);

    const { data: statuses, isLoading } = useCollection<Status>(statusesQuery);
    
    if (isLoading) {
       return (
         <div className="space-y-4">
            <h3 className="font-bold text-lg">Actividad Reciente</h3>
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-36 w-full rounded-lg" />
        </div>
       )
    }

    if (!statuses || statuses.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
             <h3 className="font-bold text-lg">Actividad Reciente</h3>
             <div className="space-y-4">
                {statuses.map(status => (
                    <Card key={status.id} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center gap-3 p-4">
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={doctorImage} />
                                <AvatarFallback>{doctorName.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold">{doctorName}</p>
                                 <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(status.createdAt.toDate(), { locale: es, addSuffix: true })}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                            {status.caption && <p className="text-muted-foreground">{status.caption}</p>}
                             {status.mediaUrl && (
                                <div className="relative aspect-[16/9] rounded-lg overflow-hidden border">
                                    <Image src={status.mediaUrl} alt={status.caption || 'Estado del doctor'} fill className="object-cover" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function DoctorStat({ label, value, max = 10, color = "hsl(var(--primary))" }: { label: string; value: number; max?: number, color?: string }) {
    const chartData = [{ name: label, value, fill: color }];

    return (
        <div className="flex flex-col items-center justify-center w-24">
            <ChartContainer config={{}} className="w-20 h-20 mx-auto">
                <RadialBarChart data={chartData} startAngle={90} endAngle={-270} innerRadius="80%" outerRadius="100%" barSize={8} cy="50%">
                    <PolarAngleAxis type="number" domain={[0, max]} tick={false} axisLine={false} />
                    <RadialBar dataKey="value" background={{ fill: 'hsl(var(--muted))' }} cornerRadius={4} isAnimationActive={false} />
                </RadialBarChart>
            </ChartContainer>
             <p className="text-xl font-bold -mt-14">{label === 'Rating' ? value.toFixed(1) : Math.round(value)}</p>
            <p className="text-xs text-muted-foreground mt-10">{label}</p>
        </div>
    );
}

// --- MAIN PAGE COMPONENT --- //

export default function DoctorProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const firestore = useFirestore();

  const doctorProfileRef = useMemoFirebase(() => (firestore && slug ? doc(firestore, 'doctor_profiles', slug) : null),[firestore, slug]);
  const { data: doctorProfile, isLoading: isDoctorLoading } = useDoc(doctorProfileRef);

  const ratingsQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'ratings'), where('doctorId', '==', slug));
  }, [firestore, slug]);
  const { data: ratings, isLoading: areRatingsLoading } = useCollection<Rating>(ratingsQuery);

  const ratingData = useMemo(() => {
    if (areRatingsLoading || !ratings || ratings.length === 0) return { average: 0, count: 0 };
    const totalRating = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = totalRating / ratings.length;
    return { average: averageRating, count: ratings.length };
  }, [ratings, areRatingsLoading]);

  const doctor = useMemo(() => DoctorProfileAdapter(doctorProfile, ratingData), [doctorProfile, ratingData]);

  if (isDoctorLoading) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-10 rounded-full mb-4" />
            <div className="flex flex-col items-center text-center"><Skeleton className="h-24 w-24 rounded-full mb-4" /><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-5 w-32" /></div>
            <div className="my-8 flex flex-wrap justify-around gap-4"><Skeleton className="h-24 w-24 rounded-lg" /><Skeleton className="h-24 w-24 rounded-lg" /><Skeleton className="h-24 w-24 rounded-lg" /><Skeleton className="h-24 w-24 rounded-lg" /></div>
            <div className="my-8"><Skeleton className="h-96 w-full rounded-lg" /></div>
        </div>
    );
  }

  if (!doctor) {
    notFound();
    return null;
  }

  return (
    <div className="bg-background pb-24">
      <div className="container mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" className="rounded-full border" asChild><Link href="/search"><ChevronLeft className="h-5 w-5" /></Link></Button>
            <h2 className="font-bold">Detalles del Doctor</h2>
            <Button variant="ghost" size="icon" className="rounded-full border"><Heart className="h-5 w-5" /></Button>
        </div>

        <div className="flex flex-col items-center text-center">
             <Avatar className="w-28 h-28 border-4 border-background shadow-md mb-4"><AvatarImage src={doctor.image} alt={`Foto de ${doctor.name}`} /><AvatarFallback>{doctor.name.substring(0,2)}</AvatarFallback></Avatar>
            <h1 className="font-headline text-2xl font-bold">{doctor.name}</h1>
            <p className="text-muted-foreground">{doctor.specialty}</p>
            <p className="text-lg font-bold text-primary mt-1">${(doctor.cost ?? 0).toFixed(2)} / Sesión</p>
        </div>

        {/* -- METRICS -- */}
        <div className="my-8 px-4 py-3 bg-card border rounded-xl flex flex-row flex-wrap items-center justify-around gap-x-2 gap-y-4">
            <DoctorStat label="Experiencia" value={doctor.experienceYears ?? 0} max={40} />
            <DoctorStat label="Pacientes" value={0} max={1000} color="hsl(var(--sky-500))" />
            <DoctorStat label="Reseñas" value={doctor.reviews ?? 0} max={500} color="hsl(var(--amber-500))" />
            <DoctorStat label="Rating" value={doctor.rating ?? 0} max={5} color="hsl(var(--yellow-400))" />
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
             <div className="lg:col-span-2 space-y-8">
                <DoctorStatuses doctorId={doctor.id} doctorName={doctor.name} doctorImage={doctor.image} />
                {doctor.bio && (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Sobre el Doctor</h3>
                        <p className="text-muted-foreground">{doctor.bio}</p>
                    </div>
                )}
                 <CommentsFeed doctorId={doctor.id} doctorName={doctor.name} />
            </div>
            <div className="lg:col-span-1 lg:sticky top-24 self-start">
                <AppointmentScheduler doctor={doctor} />
            </div>
        </div>
      </div>
    </div>
  );
}
