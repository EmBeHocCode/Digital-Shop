import type { Review } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatDate } from "@/utils/format";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="h-full">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-ink">{review.title}</p>
          <p className="mt-1 text-sm text-muted">{review.userName}</p>
        </div>
        <RatingStars rating={review.rating} />
      </div>
      <p className="mt-4 text-sm leading-7 text-muted">{review.content}</p>
      <p className="mt-4 text-xs text-muted">{formatDate(review.createdAt)}</p>
    </Card>
  );
}
