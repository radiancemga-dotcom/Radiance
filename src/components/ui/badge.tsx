import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "gold";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const styles = {
    default: "border-transparent bg-primary text-primary-foreground",
    outline: "text-foreground",
    gold: "border-transparent gold-gradient text-gold-foreground",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
