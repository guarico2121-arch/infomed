'use client';

import Link from 'next/link';
import { DoctorCard } from "@/components/doctor-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, ChevronLeft } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Doctor, Rating } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// This component maps Firestore data to the DoctorCard component props
const DoctorProfileAdapter = ({ profile, ratingData }: { profile: Partial<Doctor>, ratingData: { average: number, count: number } }) => {
  const doctorData: Doctor = {
    id: profile.id!,
    slug: profile.id!,
    name: profile.name || 'Doctor',
    specialty: profile.specialty || 'N/A',
    experienceYears: profile.experienceYears || 0,
    location: profile.location || 'Ubicación no disponible',
    city: 'Caracas', // Placeholder, needs to be in profile
    rating: ratingData.average || 0,
    reviews: ratingData.count || 0,
    bio: profile.bio || '',
    isFeatured: true, // Placeholder
    image: profile.profilePictureUrl || "",
    availability: profile.availability || {},
    insurances: [], // Placeholder
    googleMapsUrl: profile.googleMapsUrl || '',
    cost: profile.cost || 0,
  };
  return <DoctorCard doctor={doctorData} />;
};


export default function SearchPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  
  const doctorProfilesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'doctor_profiles'),
        where('subscriptionStatus', 'in', ['Active', 'Trial'])
      );
  }, [firestore]);
  
  const { data: doctorProfiles, isLoading: areDoctorsLoading } = useCollection<Doctor>(doctorProfilesQuery);

  const allRatingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'ratings');
  }, [firestore]);
  
  const { data: allRatings, isLoading: areRatingsLoading } = useCollection<Rating>(allRatingsQuery);

  const doctorsWithRatings = useMemo(() => {
    if (!doctorProfiles || !allRatings) return null;

    const ratingsMap = new Map<string, { total: number; count: number }>();
    allRatings.forEach(rating => {
      const current = ratingsMap.get(rating.doctorId) || { total: 0, count: 0 };
      current.total += rating.rating;
      current.count += 1;
      ratingsMap.set(rating.doctorId, current);
    });

    return doctorProfiles.map(profile => {
      const ratingInfo = ratingsMap.get(profile.id);
      const ratingData = ratingInfo 
        ? { average: ratingInfo.total / ratingInfo.count, count: ratingInfo.count }
        : { average: 0, count: 0 };
      return { ...profile, ratingData };
    });

  }, [doctorProfiles, allRatings]);

  const filteredDoctors = useMemo(() => {
    if (!doctorsWithRatings) return [];
    
    return doctorsWithRatings.filter(doc => 
        (doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCity === 'all' || !selectedCity || doc.city === selectedCity)
    );
  }, [searchTerm, selectedCity, doctorsWithRatings]);


  const allCities = ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay']; // Placeholder

  const isLoading = areDoctorsLoading || areRatingsLoading;

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 rounded-lg border bg-card p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label htmlFor="search-input" className="mb-2 block text-sm font-medium">Nombre o especialidad</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-input"
                  placeholder="Ej: Cardiología, Dra. Mendoza..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="city-select" className="mb-2 block text-sm font-medium">Ciudad</label>
              <Select onValueChange={setSelectedCity} value={selectedCity}>
                <SelectTrigger id="city-select">
                  <SelectValue placeholder="Todas las ciudades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  {allCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <SearchIcon className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </div>
        </div>

        <div>
           <div className="mb-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href="/">
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Volver</span>
              </Link>
            </Button>
            <h1 className="font-headline text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Resultados de Búsqueda
            </h1>
          </div>
          {isLoading ? (
             <p className="mt-2 text-muted-foreground">Buscando profesionales...</p>
          ) : (
            <p className="mt-2 text-muted-foreground">
              {filteredDoctors?.length || 0} profesionales encontrados
            </p>
          )}


          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-[4/3] w-full animate-pulse rounded-t-lg bg-muted"></div>
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                  <Skeleton className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
            {!isLoading && filteredDoctors?.map((profile) => (
              <DoctorProfileAdapter key={profile.id} profile={profile} ratingData={profile.ratingData} />
            ))}
             {!isLoading && filteredDoctors?.length === 0 && (
              <div className="col-span-full text-center py-16">
                <p className="text-muted-foreground">No se encontraron doctores que coincidan con tu búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
