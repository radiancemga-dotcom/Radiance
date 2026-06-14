import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "rounded-lg border border-border bg-background text-foreground shadow-lg",
          description: "text-muted-foreground",
        },
      }}
      richColors
      closeButton
    />
  );
}
