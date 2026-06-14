import { cn } from "@/lib/utils";

export function Logo({ className, variant = "dark" }: { className?: string; variant?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-bold", className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-lg navy-gradient">
        <span className="absolute h-4 w-4 rounded-full border-2 border-gold" />
        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
      </span>
      <span className={cn("text-lg leading-none", variant === "light" ? "text-white" : "text-foreground")}>
        Radiance<span className="text-gold"> Laser</span>
      </span>
    </span>
  );
}
