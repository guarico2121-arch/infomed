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
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, QuerySnapshot, DocumentData } from 'firebase/firestore';
import type { Doctor, Rating } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// The adapter now correctly maps all fields from the fetched data to the Doctor type,
// ensuring data consistency for the DoctorCard.
const DoctorProfileAdapter = ({ profile, ratingData }: { profile: Doctor, ratingData: { average: number, count: number } }) => {
  const doctorData: Doctor = {
    ...profile, // Spread all properties from the fetched profile
    rating: ratingData.average || 0,
    reviews: ratingData.count || 0,
    // Ensure essential fields have fallbacks, although the query should prevent this.
    uid: profile.uid,
    id: profile.id,
    slug: profile.id,
    name: profile.name || 'Doctor Sin Nombre',
    specialty: profile.specialty || 'Sin Especialidad',
    image: profile.image || "", // Use the correct 'image' field from the Doctor type
  };
  return <DoctorCard doctor={doctorData} />;
};


export default function SearchPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  
  // State to hold the fetched data
  const [doctorProfiles, setDoctorProfiles] = useState<Doctor[]>([]);
  const [allRatings, setAllRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // **CRITICAL FIX**: Fetch directly from server, bypassing local cache.
        // We now fetch doctors and ratings, ensuring data is always fresh.
        const doctorProfilesQuery = query(
          collection(firestore, 'doctor_profiles'),
          where('subscriptionStatus', 'in', ['Active_Paid', 'Free_Trial'])
        );
        
        const doctorSnapshot = await getDocs(doctorProfilesQuery);
        const fetchedDoctors = doctorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Doctor[];
        setDoctorProfiles(fetchedDoctors);

        const ratingsQuery = collection(firestore, 'ratings');
        const ratingSnapshot = await getDocs(ratingsQuery);
        const fetchedRatings = ratingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Rating[];
        setAllRatings(fetchedRatings);

      } catch (error) {
        console.error("Error fetching doctor profiles or ratings:", error);
        // Optionally, set an error state to show a message to the user
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firestore]);


  const doctorsWithRatings = useMemo(() => {
    if (isLoading || doctorProfiles.length === 0) return [];

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
        ? { average: parseFloat((ratingInfo.total / ratingInfo.count).toFixed(1)), count: ratingInfo.count }
        : { average: 0, count: 0 };
      return { ...profile, ratingData };
    });

  }, [doctorProfiles, allRatings, isLoading]);

  const filteredDoctors = useMemo(() => {
    if (!doctorsWithRatings) return [];
    
    return doctorsWithRatings.filter(doc => 
        (doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCity === 'all' || !selectedCity || doc.city === selectedCity)
    );
  }, [searchTerm, selectedCity, doctorsWithRatings]);


  const allCities = useMemo(() => {
      if (!doctorProfiles) return [];
      // Create a unique list of cities from the profiles
      const cities = new Set(doctorProfiles.map(doc => doc.city).filter(Boolean));
      return Array.from(cities);
  }, [doctorProfiles]);


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
               {/* The search is now performed automatically on filter change */}
              <Button className="w-full" disabled>
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
                <div key={i} className="rounded-lg border bg-card overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <div className="p-4">
                        <Skeleton className="h-5 w-3/4 rounded" />
                        <Skeleton className="mt-2 h-4 w-1/2 rounded" />
                        <Skeleton className="mt-4 h-4 w-1/4 rounded" />
                    </div>
              </div>
            ))}
            {!isLoading && filteredDoctors.map((profile) => (
              <DoctorProfileAdapter key={profile.id} profile={profile} ratingData={profile.ratingData} />
            ))}
             {!isLoading && filteredDoctors.length === 0 && (
              <div className="col-span-full text-center py-16">
                <h3 className="text-xl font-semibold">No se encontraron resultados</h3>
                <p className="text-muted-foreground mt-2">Intenta ajustar tus filtros de búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
