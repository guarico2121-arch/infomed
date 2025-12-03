import Link from 'next/link';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DoctorCard } from '@/components/doctor-card';
import type { Doctor, Banner } from '@/lib/types';
import { initializeFirebaseAdmin } from '@/firebase/server';
import { BannerCarousel } from '@/components/layout/banner-carousel';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

async function getBanners(firestore: any): Promise<Banner[]> {
  try {
    const bannersSnapshot = await firestore
      .collection('banners')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();
    return bannersSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Banner[];
  } catch (error) {
    console.error("Error fetching banners:", error);
    // Return an empty array on error to prevent the page from crashing.
    return [];
  }
}

async function getFeaturedDoctors(firestore: any): Promise<Doctor[]> {
  try {
    const doctorsSnapshot = await firestore
      .collection('doctor_profiles')
      .where('subscriptionStatus', '==', 'Active')
      .limit(8)
      .get();
    return doctorsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Doctor[];
  } catch (error) {
    console.error("Error fetching featured doctors:", error);
    // Return an empty array on error.
    return [];
  }
}

export default async function Home() {
  const { firestore } = initializeFirebaseAdmin();
  const banners = await getBanners(firestore);
  const featuredDoctors = await getFeaturedDoctors(firestore);

  return (
    <div className="flex flex-col bg-muted/20">
      <section id="hero-carousel" className="w-full">
        <BannerCarousel banners={banners} />
      </section>

      <section id="featured" className="w-full py-8 pt-16">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-headline text-2xl font-bold text-primary">
              Médicos Destacados
            </h2>
            <Link
              href="/search"
              className="flex items-center text-sm font-semibold text-primary hover:underline"
            >
              Ver todos <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <Carousel
            opts={{ align: "start", loop: false }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {featuredDoctors.map((profile) => {
                const doctor: Doctor = {
                  ...profile,
                  id: profile.id,
                  slug: profile.id,
                  image: profile.profilePictureUrl || "",
                  rating: 0,
                  reviews: 0,
                };
                return (
                  <CarouselItem key={profile.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <div className="h-full">
                      <DoctorCard doctor={doctor} />
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2" />
          </Carousel>
        </div>
      </section>

      <section id="for-doctors" className="w-full bg-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 items-center gap-8 rounded-xl bg-primary p-8 text-primary-foreground md:grid-cols-2 md:p-12 lg:gap-16 lg:p-16">
            <div className="hidden items-center justify-center md:flex">
              <TrendingUp className="h-32 w-32 text-accent/50 lg:h-48 lg:w-48" />
            </div>
            <div className="space-y-5 text-center md:text-left">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
                Lleva tu consulta al siguiente nivel
              </h2>
              <p className="text-lg text-primary-foreground/90">
                Digitaliza tu perfil, gestiona tu agenda de forma inteligente y llega a miles de nuevos pacientes. En InfoMed Central te damos las herramientas para crecer.
              </p>
              <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-center md:justify-start">
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="bg-white text-primary shadow-lg hover:bg-gray-100"
                >
                  <Link href="/register">Comienza gratis</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Descubre los planes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
