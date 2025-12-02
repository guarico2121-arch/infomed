import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DoctorStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}

export function DoctorStatCard({
  icon: Icon,
  label,
  value,
  className,
}: DoctorStatCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 text-center",
        className
      )}
    >
      <Icon className="h-6 w-6 text-primary" />
      <p className="text-sm font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
