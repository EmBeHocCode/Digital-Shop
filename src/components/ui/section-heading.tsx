import { Badge } from "@/components/ui/badge";

export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Badge label={eyebrow} />
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-ink md:text-4xl">{title}</h2>
        <p className="max-w-2xl text-sm leading-7 text-muted md:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}
