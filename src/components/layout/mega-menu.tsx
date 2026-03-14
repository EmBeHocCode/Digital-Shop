import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloud,
  faGift,
  faHeadset,
  faServer,
  faTags,
  faTicket
} from "@fortawesome/free-solid-svg-icons";
import { Card } from "@/components/ui/card";

const megaMenuItems = [
  {
    title: "VPS",
    href: "/products?type=VPS",
    icon: faServer,
    items: ["VPS Basic", "VPS Gaming", "VPS Premium"]
  },
  {
    title: "Cloud",
    href: "/products?type=CLOUD",
    icon: faCloud,
    items: ["Cloud Server", "Cloud GPU", "Cloud Gaming"]
  },
  {
    title: "Gift Card",
    href: "/products?type=GIFTCARD",
    icon: faGift,
    items: ["Steam Wallet", "Google Play", "App Store"]
  },
  {
    title: "Thẻ Game",
    href: "/products?type=GAMECARD",
    icon: faTicket,
    items: ["Garena", "Zing", "Funcard"]
  },
  {
    title: "Khuyến mãi",
    href: "/products?promotion=true",
    icon: faTags,
    items: ["Deal mới", "Combo cloud", "Gift card nổi bật"]
  },
  {
    title: "Hỗ trợ",
    href: "/support",
    icon: faHeadset,
    items: ["FAQ", "Phiếu hỗ trợ", "Hướng dẫn mua"]
  }
];

export function MegaMenu() {
  return (
    <Card className="grid w-[900px] grid-cols-3 gap-4 bg-white/95 backdrop-blur">
      {megaMenuItems.map((section) => (
        <Link
          key={section.title}
          href={section.href}
          className="rounded-[24px] border border-rose-100 p-5 transition hover:border-primary hover:bg-rose-50/80"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-primary">
              <FontAwesomeIcon icon={section.icon} className="h-4 w-4" />
            </div>
            <p className="text-base font-bold text-ink">{section.title}</p>
          </div>
          <div className="space-y-2 text-sm text-muted">
            {section.items.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </Link>
      ))}
    </Card>
  );
}
