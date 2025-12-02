
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, BriefcaseMedical } from 'lucide-react';
import type { Doctor } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DoctorCardProps {
  doctor: Doctor;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const displayRating = doctor.rating ? doctor.rating.toFixed(1) : '-';
  const displayReviews = doctor.reviews || 0;

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="relative p-0">
        <Link href={`/doctors/${doctor.slug}`} className="block">
          {doctor.isFeatured && (
            <Badge className="absolute left-3 top-3 z-10 border-none bg-accent text-accent-foreground">
              Destacado
            </Badge>
          )}
          <div className="aspect-[4/3] w-full bg-muted">
            {doctor.image && (
              <Image
                src={doctor.image}
                alt={`Foto de ${doctor.name}`}
                width={400}
                height={300}
                className="h-full w-full object-cover"
                data-ai-hint="doctor portrait"
              />
            )}
          </div>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <Link href={`/doctors/${doctor.slug}`}>
          <h3 className="font-headline text-lg font-bold text-primary hover:underline">
            {doctor.name}
          </h3>
        </Link>
        <p className="text-sm font-medium text-muted-foreground">{doctor.specialty}</p>
        <div className="mt-2 flex items-center text-sm text-muted-foreground">
          <BriefcaseMedical className="mr-1.5 h-4 w-4 flex-shrink-0" />
          <span>{doctor.experienceYears} años de exp.</span>
        </div>
        <div className="mt-1 flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0" />
          <span>{doctor.city}</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <div className="flex items-center gap-1">
          <Star className="h-5 w-5 text-yellow-400" fill="currentColor" />
          <span className="font-bold">{displayRating}</span>
          <span className="text-sm text-muted-foreground">
            ({displayReviews})
          </span>
        </div>
        <Button asChild>
          <Link href={`/doctors/${doctor.slug}`}>Ver Perfil</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

    