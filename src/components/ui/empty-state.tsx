import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaLink = "/products"
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaLink?: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-primary">
        <FontAwesomeIcon icon={faBoxOpen} className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-ink">{title}</h3>
        <p className="max-w-md text-sm text-muted">{description}</p>
      </div>
      {ctaLabel ? <Button href={ctaLink}>{ctaLabel}</Button> : null}
    </Card>
  );
}
