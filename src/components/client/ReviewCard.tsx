import * as React from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/shared/common";
import { useAddReview, useReview } from "@/hooks/api";
import { useAuth } from "@/providers/AuthProvider";
import { cn, formatDate } from "@/lib/utils";
import type { Reservation } from "@/types";

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={cn("transition", onChange && "hover:scale-110")}
          aria-label={`${n} estrela(s)`}
        >
          <Star className={cn("h-6 w-6", (hover || value) >= n ? "fill-gold text-gold" : "text-muted-foreground/40")} />
        </button>
      ))}
    </div>
  );
}

export function ReviewCard({ reservation }: { reservation: Reservation }) {
  const { userId, profile } = useAuth();
  const { data: existing, isLoading } = useReview(reservation.id);
  const addReview = useAddReview();
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");

  if (reservation.status !== "completed" || isLoading) return null;

  if (existing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sua avaliação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Stars value={existing.rating} />
          {existing.comment && <p className="text-sm text-muted-foreground">"{existing.comment}"</p>}
          <p className="text-xs text-muted-foreground">Enviada em {formatDate(existing.created_at)}</p>
        </CardContent>
      </Card>
    );
  }

  const submit = async () => {
    if (!userId || !profile) return;
    try {
      await addReview.mutateAsync({
        reservation_id: reservation.id,
        user_id: userId,
        client_name: profile.full_name,
        city: reservation.city,
        rating,
        comment,
      });
      toast.success("Obrigado pela sua avaliação!");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Card className="border-gold/40">
      <CardHeader>
        <CardTitle className="text-base">Avalie esta locação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Stars value={rating} onChange={setRating} />
        <Textarea
          rows={2}
          placeholder="Conte como foi sua experiência (opcional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button variant="gold" onClick={submit} disabled={addReview.isPending}>
          {addReview.isPending ? <Spinner className="text-navy-900" /> : "Enviar avaliação"}
        </Button>
      </CardContent>
    </Card>
  );
}
