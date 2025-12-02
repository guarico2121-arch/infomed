import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-primary', className)}>
      <HeartPulse className="h-8 w-8" />
      <span className="font-headline text-2xl font-bold tracking-tight">
        InfoMed
      </span>
    </div>
  );
}