import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCat } from "@fortawesome/free-solid-svg-icons";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
        <FontAwesomeIcon icon={faCat} className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold uppercase tracking-[0.24em] text-muted">SÀN DỊCH VỤ SỐ</p>
        <p className="text-2xl font-black text-ink">MeowMarket</p>
      </div>
    </Link>
  );
}
