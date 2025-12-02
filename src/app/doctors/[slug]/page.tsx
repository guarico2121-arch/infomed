'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  ChevronLeft,
  Heart,
  BriefcaseMedical,
  Users,
  MapPin,
  DollarSign,
  Send,
  Lock,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppointmentScheduler } from '@/components/appointment-scheduler';
import { DoctorStatCard } from '@/components/doctor-stat-card';
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
        rating: ratingData?.average ?? 0,
        reviews: ratingData?.count ?? 0,
        bio: profile.biography || '',
        isFeatured: profile.isFeatured || false,
        image: profile.profilePictureUrl || "",
        availability: profile.availability || {},
        insurances: profile.insurances || [],
        googleMapsUrl: profile.googleMapsUrl || '',
        cost: profile.cost || 0,
        posts: [], // Posts are loaded separately now
    };
}

function Comment({ rating }) {
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(
      () => (firestore && rating.patientId ? doc(firestore, 'users', rating.patientId) : null),
      [firestore, rating.patientId]
    );
    const { data: author, isLoading } = useDoc(userProfileRef);

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
                                    className={cn(
                                        "h-4 w-4",
                                        i < rating.rating ? "text-yellow-400" : "text-muted-foreground/30"
                                    )}
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

function StarRatingInput({ rating, setRating, disabled=false }) {
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
              className={cn(
                "h-6 w-6 transition-colors",
                starValue <= (hover || rating)
                  ? "text-yellow-400"
                  : "text-muted-foreground/30"
              )}
              fill="currentColor"
            />
          </button>
        );
      })}
    </div>
  );
}


function CommentsFeed({ doctorId, doctorName }) {
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
      return query(
        collection(firestore, `ratings`),
        where('doctorId', '==', doctorId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
    }, [firestore, doctorId]);
    const { data: ratings, isLoading } = useCollection<Rating>(ratingsQuery);

    const handlePostComment = async () => {
        if (!completedAppointmentId) {
             toast({ title: 'No se puede enviar la reseña', description: 'Debes tener una cita completada para poder calificar.', variant: 'destructive' });
             return;
        }
        if (!comment.trim()) {
            toast({ title: 'El comentario está vacío', variant: 'destructive' });
            return;
        }
        if (rating === 0) {
            toast({ title: 'Debes seleccionar una calificación', variant: 'destructive' });
            return;
        }

        if (!user || !firestore) return;
        
        setIsSubmitting(true);
        try {
            const ratingsCollection = collection(firestore, 'ratings');
            const ratingData = {
                doctorId: doctorId,
                patientId: user.uid,
                comment: comment,
                rating: rating,
                createdAt: serverTimestamp(),
                appointmentId: completedAppointmentId,
            };

            await addDoc(ratingsCollection, ratingData).catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: ratingsCollection.path,
                    operation: 'create',
                    requestResourceData: ratingData,
                }));
                throw error;
            });

            toast({ title: '¡Comentario enviado!', description: 'Gracias por tu opinión.' });
            setComment('');
            setRating(0);
            setCanReview(false); // Prevent multiple reviews for the same appointment for now

        } catch(error) {
             if (error.name !== 'FirebaseError') {
                toast({
                    title: 'Error al enviar comentario',
                    description: 'Hubo un problema. Intenta de nuevo.',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const shouldShowFeed = ratings && ratings.length > 0;
    const shouldShowEmptyState = !isLoading && (!ratings || ratings.length === 0);

    return (
        <div className="space-y-6">
            {user && canReview && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Deja una reseña</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                         <Avatar className="h-10 w-10 border">
                            <AvatarImage src={user.photoURL || undefined} />
                            <AvatarFallback>
                                {user.displayName?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="w-full space-y-4">
                             <Textarea
                                placeholder={`Comparte tu experiencia con ${doctorName}...`}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 p-2 shadow-none text-base"
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
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground flex items-center justify-center gap-3">
                        <Lock className="h-5 w-5" />
                        <span>Debes completar una cita con este doctor para poder dejar una reseña.</span>
                    </CardContent>
                </Card>
             )}


            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-28 w-full rounded-lg" />
                    <Skeleton className="h-28 w-full rounded-lg" />
                </div>
            )}

            {shouldShowFeed && ratings.map(rating => <Comment key={rating.id} rating={rating} />)}
            
            {shouldShowEmptyState && (
                <Card className="my-6">
                    <CardContent className="p-6 text-center text-muted-foreground">
                        Este doctor aún no tiene reseñas.
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function DoctorStatuses({ doctorId }) {
    const firestore = useFirestore();
    const now = new Date();

    const statusesQuery = useMemoFirebase(() => {
        if (!firestore || !doctorId) return null;
        return query(
            collection(firestore, `doctor_profiles/${doctorId}/statuses`),
            where('expiresAt', '>', Timestamp.fromDate(now)),
            orderBy('expiresAt', 'desc'),
            limit(8)
        )
    }, [firestore, doctorId]);

    const { data: statuses, isLoading } = useCollection<Status>(statusesQuery);
    
    if (isLoading) {
       return (
         <div className="my-6">
            <h2 className="font-headline text-xl font-bold mb-4">Estados Recientes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                ))}
            </div>
        </div>
       )
    }

    if (!statuses || statuses.length === 0) {
        return null;
    }

    return (
        <div className="my-6">
             <h2 className="font-headline text-xl font-bold mb-4">Estados Recientes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {statuses.map(status => (
                    <div key={status.id} className="relative aspect-square rounded-lg overflow-hidden group">
                        <Image src={status.mediaUrl} alt={status.caption || 'Estado del doctor'} fill className="object-cover" />
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

  const doctorProfileRef = useMemoFirebase(
    () => (firestore && slug ? doc(firestore, 'doctor_profiles', slug) : null),
    [firestore, slug]
  );
  
  const { data: doctorProfile, isLoading: isDoctorLoading } = useDoc(doctorProfileRef);

  const ratingsQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(
        collection(firestore, 'ratings'), 
        where('doctorId', '==', slug)
    );
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
        <div className="bg-background">
            <div className="relative h-[40svh] w-full animate-pulse bg-muted/50">
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                     <Skeleton className="h-10 w-10 rounded-full" />
                     <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                 <div className="absolute bottom-0 left-0 p-6">
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="mt-4 h-9 w-48 rounded-md" />
                    <Skeleton className="mt-2 h-5 w-32 rounded-md" />
                </div>
            </div>
            <div className="container mx-auto -mt-8 px-4 pb-16">
                 <div className="relative z-10 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                 </div>
                 <div className="my-6 space-y-4">
                    <Skeleton className="h-6 w-32 rounded-md" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                 </div>
                 <Skeleton className="h-96 w-full rounded-lg" />
            </div>
        </div>
    );
  }

  // After loading, if doctor data is still null, it means the document doesn't exist.
  if (!doctor) {
    notFound();
    return null;
  }

  return (
    <div className="bg-background pb-24">
      <div className="relative h-[40svh] w-full bg-muted">
        {doctor.image && (
          <Image
            src={doctor.image}
            alt={`Foto de ${doctor.name}`}
            fill
            className="object-cover"
            data-ai-hint="doctor portrait"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/80 backdrop-blur-sm" asChild>
            <Link href="/search">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-white/80 backdrop-blur-sm">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 p-6 text-foreground">
            {doctor.rating > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary backdrop-blur-sm">
                    <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                    <span>{doctor.rating.toFixed(1)} ({doctor.reviews})</span>
                </div>
            )}
          <h1 className="mt-2 font-headline text-3xl font-bold">
            {doctor.name}
          </h1>
          <p className="text-base font-medium text-muted-foreground">
            {doctor.specialty}
          </p>
        </div>
      </div>

      <div className="container mx-auto -mt-8 px-4 pb-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <div className="relative z-10 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <DoctorStatCard
                        icon={BriefcaseMedical}
                        label="Experiencia"
                        value={`${doctor.experienceYears}+ Años`}
                        />
                    <DoctorStatCard
                        icon={Users}
                        label="Pacientes"
                        value="0"
                        />
                    <DoctorStatCard
                        icon={Star}
                        label="Reseñas"
                        value={`${doctor.reviews}`}
                        />
                    <DoctorStatCard
                        icon={DollarSign}
                        label="Consulta"
                        value={`$${doctor.cost.toFixed(2)}`}
                    />
                </div>
                
                <DoctorStatuses doctorId={doctor.id} />

                {doctor.bio && (
                    <Card className="my-6">
                        <CardHeader>
                        <CardTitle className="text-xl font-headline">Sobre el Doctor</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                        <p className="text-muted-foreground">{doctor.bio}</p>
                        </CardContent>
                    </Card>
                )}
                
                <div className="my-6">
                    <CommentsFeed doctorId={doctor.id} doctorName={doctor.name} />
                </div>
            </div>

            <div className="lg:col-span-1 lg:sticky top-24 self-start">
                {(doctor.location && doctor.location !== 'Ubicación no especificada') && (
                    <div className="mb-6">
                    <h2 className="font-headline text-xl font-bold">Ubicación</h2>
                    <div className="mt-2 rounded-lg border bg-card p-4">
                        <p className="font-semibold">{doctor.location}</p>
                        {doctor.city && doctor.city !== 'Ciudad no especificada' && <p className="text-sm text-muted-foreground">{doctor.city}, Venezuela</p>}
                        {doctor.googleMapsUrl && (
                        <a 
                            href={doctor.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                        >
                            <MapPin className="h-4 w-4" />
                            Ver en Google Maps
                        </a>
                        )}
                    </div>
                    </div>
                )}
                
                <AppointmentScheduler doctor={doctor} />
            </div>
        </div>

      </div>
    </div>
  );
}
