'use client';

import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import type { Banner } from '@/lib/types';
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import { Skeleton } from '@/components/ui/skeleton';

interface BannerCarouselProps {
  banners: Banner[] | null;
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const carouselPlugins = [
    Autoplay({ delay: 5000, stopOnInteraction: true }),
    Fade(),
  ];

  if (!banners) {
    return (
      <div className="w-full">
        <Skeleton className="aspect-[3/1] w-full" />
      </div>
    );
  }

  if (banners.length === 0) {
    return null; // No renderizar nada si no hay banners activos
  }

  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      plugins={carouselPlugins}
      className="w-full"
    >
      <CarouselContent>
        {banners.map((banner) => (
          <CarouselItem key={banner.id}>
            <div className="relative aspect-[2/1] md:aspect-[3/1] lg:aspect-[4/1] w-full">
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                <h2 className="font-headline text-2xl md:text-4xl lg:text-5xl font-bold">{banner.title}</h2>
                {banner.subtitle && <p className="mt-2 text-base md:text-xl">{banner.subtitle}</p>}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:inline-flex" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:inline-flex" />
    </Carousel>
  );
}
