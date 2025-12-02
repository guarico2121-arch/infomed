'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  ChevronLeft,
  BriefcaseMedical,
  Users,
  MapPin,
  DollarSign,
  Send,
  Lock,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { FC, Dispatch, SetStateAction } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit, addDoc, serverTimestamp, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Doctor, Rating, Status, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AppointmentScheduler } from '@/components/appointment-scheduler';
import { DoctorStatCard } from '@/components/doctor-stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Adapter to safely convert Firestore doc data to the strict Doctor type.
const DoctorProfileAdapter = (profile: any, ratingData: { average: number; count: number }): Doctor | null => {
    if (!profile) return null;
    
    // This now matches the full Doctor type definition.
    return {
        uid: profile.id, 
        id: profile.id,
        slug: profile.id,
        name: profile.name || 'Doctor Sin Nombre',
        specialty: profile.specialty || 'Sin especialidad',
        experienceYears: profile.experienceYears || 0,
        location: profile.address || 'Ubicación no especificada',
        city: profile.city || 'Ciudad no especificada',
        rating: ratingData?.average ?? 0,
        reviews: ratingData?.count ?? 0,
        bio: profile.biography || '',
        isFeatured: profile.isFeatured || false,
        image: profile.profilePictureUrl || undefined,
        availability: profile.availability || {},
        insurances: profile.insurances || [],
        googleMapsUrl: profile.googleMapsUrl || '',
        cost: profile.cost || 0,
        posts: [],
        email: profile.email || '',
        subscriptionStatus: profile.subscriptionStatus || 'Expired',
        createdAt: profile.createdAt || Timestamp.now(),
    };
}

// Strongly-typed Comment component
const Comment: FC<{ rating: Rating }> = ({ rating }) => {
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(
      () => (firestore && rating.patientId ? doc(firestore, 'users', rating.patientId) : null),
      [firestore, rating.patientId]
    );
    const { data: author, isLoading } = useDoc<UserProfile>(userProfileRef);

    const timeAgo = rating.createdAt ? formatDistanceToNow(rating.createdAt.toDate(), { addSuffix: true, locale: es }) : 'justo ahora';

    if (isLoading) {
        return <Skeleton className="h-24 w-full" />;
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Avatar className="h-12 w-12 border">
                        <AvatarImage src={author?.photoURL || undefined} />
                        <AvatarFallback>
                            {author?.name?.substring(0, 2).toUpperCase() || 'P'}
                        </AvatarFallback>
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
                                    <Star
                                    key={i}
                                    className={cn("h-4 w-4", i < rating.rating ? "text-yellow-400" : "text-muted-foreground/30")}
                                    fill="currentColor"
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="whitespace-pre-wrap text-muted-foreground">
                            {rating.comment}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Star Rating Input
const StarRatingInput: FC<{ rating: number; setRating: Dispatch<SetStateAction<number>>; disabled?: boolean }> = ({ rating, setRating, disabled = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            type="button"
            key={starValue}
            className={cn("cursor-pointer", disabled && "cursor-not-allowed")}
            onClick={() => !disabled && setRating(starValue)}
            onMouseEnter={() => !disabled && setHover(starValue)}
            onMouseLeave={() => !disabled && setHover(0)}
          >
            <Star
              className={cn("h-6 w-6 transition-colors", starValue <= (hover || rating) ? "text-yellow-400" : "text-muted-foreground/30")}
              fill="currentColor"
            />
          </button>
        );
      })}
    </div>
  );
}

// Comments Feed
const CommentsFeed: FC<{ doctorId: string; doctorName: string }> = ({ doctorId, doctorName }) => {
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
                const appointmentsQuery = query(
                    collection(firestore, 'appointments'),
                    where('patientId', '==', user.uid),
                    where('doctorId', '==', doctorId),
                    where('status', '==', 'Completed')
                );
                const querySnapshot = await getDocs(appointmentsQuery);
                if (!querySnapshot.empty) {
                    const reviewQuery = query(
                        collection(firestore, 'ratings'),
                        where('patientId', '==', user.uid),
                        where('doctorId', '==', doctorId)
                    );
                    const reviewSnapshot = await getDocs(reviewQuery);
                    if (reviewSnapshot.empty) {
                        setCanReview(true);
                        setCompletedAppointmentId(querySnapshot.docs[0].id);
                    }
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
        if (!comment.trim() || rating === 0) {
            toast({ title: 'Calificación y comentario requeridos', variant: 'destructive' });
            return;
        }

        if (!user || !firestore) return;
        
        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'ratings'), {
                doctorId,
                patientId: user.uid,
                comment,
                rating,
                createdAt: serverTimestamp(),
                appointmentId: completedAppointmentId,
            });
            toast({ title: '¡Comentario enviado!' });
            setComment('');
            setRating(0);
            setCanReview(false); // User has now reviewed.
        } catch(error) {
             console.error("Error posting comment:", error);
             toast({ title: 'Error al enviar comentario', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {user && canReview && (
            <Card>
                <CardHeader><CardTitle className="font-headline text-xl">Deja una reseña</CardTitle></CardHeader>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                         <Avatar className="h-10 w-10 border">
                            <AvatarImage src={user.photoURL || undefined} />
                            <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="w-full space-y-4">
                             <Textarea
                                placeholder={`Comparte tu experiencia con ${doctorName}...`}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                disabled={isSubmitting}
                            />
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <StarRatingInput rating={rating} setRating={setRating} disabled={isSubmitting} />
                                <Button onClick={handlePostComment} disabled={isSubmitting} className="w-full sm:w-auto">
                                    {isSubmitting ? 'Enviando...' : <><Send className="mr-2 h-4 w-4" /> Enviar Reseña</>}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            )}
            {user && !canReview && !isUserLoading && (
                <Card><CardContent className="p-6 text-center text-muted-foreground flex items-center justify-center gap-3"><Lock className="h-5 w-5" /><span>Debes completar una cita para poder dejar una reseña.</span></CardContent></Card>
            )}
            {isLoading && (
                <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>
            )}
            {ratings?.map(r => <Comment key={r.id} rating={r} />)}
            {!isLoading && ratings?.length === 0 && (
                <Card className="my-6"><CardContent className="p-6 text-center text-muted-foreground">Este doctor aún no tiene reseñas.</CardContent></Card>
            )}
        </div>
    );
}

// Doctor Statuses component
const DoctorStatuses: FC<{ doctorId: string }> = ({ doctorId }) => {
    const firestore = useFirestore();

    const statusesQuery = useMemoFirebase(() => {
        if (!firestore || !doctorId) return null;
        return query(collection(firestore, `doctor_profiles/${doctorId}/statuses`), where('expiresAt', '>', Timestamp.now()), orderBy('expiresAt', 'desc'), limit(8));
    }, [firestore, doctorId]);

    const { data: statuses, isLoading } = useCollection<Status>(statusesQuery);
    
    if (isLoading || !statuses || statuses.length === 0) return null;

    return (
        <div className="my-6">
             <h2 className="font-headline text-xl font-bold mb-4">Estados Recientes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {statuses.map(status => (
                    <div key={status.id} className="relative aspect-square rounded-lg overflow-hidden group">
                        <Image src={status.mediaUrl} alt={status.caption || 'Estado'} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-2 text-white">
                            {status.caption && <p className="text-xs font-semibold line-clamp-2">{status.caption}</p>}
                            <div className="flex items-center gap-1 text-xs opacity-80 mt-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDistanceToNow(status.createdAt.toDate(), { locale: es, addSuffix: true })}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DoctorProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const firestore = useFirestore();

  const doctorProfileRef = useMemoFirebase(() => (firestore && slug ? doc(firestore, 'doctor_profiles', slug) : null), [firestore, slug]);
  const { data: doctorProfile, isLoading: isDoctorLoading } = useDoc(doctorProfileRef);

  const ratingsQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'ratings'), where('doctorId', '==', slug));
  }, [firestore, slug]);
  const { data: ratings, isLoading: areRatingsLoading } = useCollection<Rating>(ratingsQuery);

  const ratingData = useMemo(() => {
    if (areRatingsLoading || !ratings || ratings.length === 0) return { average: 0, count: 0 };
    const totalRating = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = parseFloat((totalRating / ratings.length).toFixed(1));
    return { average: averageRating, count: ratings.length };
  }, [ratings, areRatingsLoading]);

  const doctor = useMemo(() => DoctorProfileAdapter(doctorProfile, ratingData), [doctorProfile, ratingData]);
  const isVerified = doctor?.subscriptionStatus === 'Active';

  if (isDoctorLoading) {
    return <div className="container mx-auto px-4 py-12"><Skeleton className="h-screen w-full" /></div>;
  }

  if (!doctor) {
    notFound();
    return null;
  }

  const nameInitials = doctor.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="bg-background pb-24">
      <div className="container mx-auto px-4 pt-8">
        <header className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-lg text-4xl">
              <AvatarImage src={doctor.image} alt={`Foto de ${doctor.name}`} />
              <AvatarFallback>{nameInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
            <div className="flex items-center gap-3">
                <h1 className="font-headline text-3xl font-bold">{doctor.name}</h1>
                {isVerified && 
                    <div className="flex items-center gap-1 text-blue-500 font-semibold">
                        <ShieldCheck className="h-6 w-6" />
                        <span>Verificado</span>
                    </div>
                }
            </div>
            <p className="text-lg font-medium text-muted-foreground">{doctor.specialty}</p>
            {doctor.rating > 0 && (
                <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                    <span>{doctor.rating} ({doctor.reviews} {doctor.reviews === 1 ? 'reseña' : 'reseñas'})</span>
                </div>
            )}
          </div>
        </header>

        <main className="mt-12">
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <DoctorStatCard icon={BriefcaseMedical} label="Experiencia" value={`${doctor.experienceYears}+ Años`} />
                        <DoctorStatCard icon={Users} label="Pacientes" value="0" />
                        <DoctorStatCard icon={Star} label="Reseñas" value={`${doctor.reviews}`} />
                        <DoctorStatCard icon={DollarSign} label="Consulta" value={`$${doctor.cost.toFixed(2)}`} />
                    </div>
                    <DoctorStatuses doctorId={doctor.id} />
                    {doctor.bio && (
                        <Card className="my-6">
                            <CardHeader><CardTitle className="text-xl font-headline">Sobre el Doctor</CardTitle></CardHeader>
                            <CardContent className="p-6"><p className="text-muted-foreground whitespace-pre-wrap">{doctor.bio}</p></CardContent>
                        </Card>
                    )}
                    <CommentsFeed doctorId={doctor.id} doctorName={doctor.name} />
                </div>
                <aside className="lg:col-span-1 lg:sticky top-24 self-start space-y-6">
                    {(doctor.location && doctor.location !== 'Ubicación no especificada') && (
                        <Card>
                            <CardHeader><CardTitle className="text-lg font-headline">Ubicación</CardTitle></CardHeader>
                            <CardContent>
                                <p className="font-semibold">{doctor.location}</p>
                                {doctor.city && doctor.city !== 'Ciudad no especificada' && <p className="text-sm text-muted-foreground">{doctor.city}, Venezuela</p>}
                                {doctor.googleMapsUrl && (
                                    <a href={doctor.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                                        <MapPin className="h-4 w-4" /> Ver en Google Maps
                                    </a>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    <AppointmentScheduler doctor={doctor} />
                </aside>
            </div>
        </main>
      </div>
    </div>
  );
}
