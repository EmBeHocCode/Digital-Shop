import { Category } from "@/types/domain";

export const categories: Category[] = [
  {
    id: "cat-vps",
    name: "VPS",
    slug: "vps",
    description: "Máy chủ ảo ổn định cho website, bot và game server.",
    icon: "server",
    children: [
      {
        id: "cat-vps-basic",
        name: "VPS Basic",
        slug: "vps-basic",
        description: "Gói VPS phổ thông",
        icon: "server"
      },
      {
        id: "cat-vps-gaming",
        name: "VPS Gaming",
        slug: "vps-gaming",
        description: "VPS hiệu năng cho game",
        icon: "gamepad"
      },
      {
        id: "cat-vps-premium",
        name: "VPS Premium",
        slug: "vps-premium",
        description: "VPS cao cấp cho production",
        icon: "rocket"
      }
    ]
  },
  {
    id: "cat-cloud",
    name: "Cloud",
    slug: "cloud",
    description: "Cloud server, GPU cloud và cloud gaming linh hoạt.",
    icon: "cloud",
    children: [
      {
        id: "cat-cloud-server",
        name: "Cloud Server",
        slug: "cloud-server",
        description: "Cloud máy chủ linh hoạt",
        icon: "cloud"
      },
      {
        id: "cat-cloud-gpu",
        name: "Cloud GPU",
        slug: "cloud-gpu",
        description: "Cloud GPU cho AI và render",
        icon: "microchip"
      },
      {
        id: "cat-cloud-gaming",
        name: "Cloud Gaming",
        slug: "cloud-gaming",
        description: "Cloud gaming độ trễ thấp",
        icon: "gamepad"
      }
    ]
  },
  {
    id: "cat-gift-card",
    name: "Gift Card",
    slug: "gift-card",
    description: "Gift card quốc tế, nhận mã tự động sau thanh toán.",
    icon: "gift",
    children: [
      {
        id: "cat-steam",
        name: "Steam Wallet",
        slug: "steam-wallet",
        description: "Nạp Steam Wallet",
        icon: "gift"
      },
      {
        id: "cat-google-play",
        name: "Google Play",
        slug: "google-play",
        description: "Gift card Google Play",
        icon: "gift"
      },
      {
        id: "cat-app-store",
        name: "App Store",
        slug: "app-store",
        description: "Gift card App Store",
        icon: "gift"
      },
      {
        id: "cat-psn",
        name: "PSN",
        slug: "psn",
        description: "PlayStation Network",
        icon: "gift"
      },
      {
        id: "cat-xbox",
        name: "Xbox",
        slug: "xbox",
        description: "Xbox gift card",
        icon: "gift"
      },
      {
        id: "cat-nintendo",
        name: "Nintendo",
        slug: "nintendo",
        description: "Nintendo eShop",
        icon: "gift"
      }
    ]
  },
  {
    id: "cat-game-card",
    name: "Thẻ Game",
    slug: "the-game",
    description: "Thẻ game và coin nạp nhanh cho thị trường Việt Nam.",
    icon: "ticket",
    children: [
      {
        id: "cat-garena",
        name: "Garena",
        slug: "garena",
        description: "Thẻ Garena",
        icon: "ticket"
      },
      {
        id: "cat-zing",
        name: "Zing",
        slug: "zing",
        description: "Thẻ Zing",
        icon: "ticket"
      },
      {
        id: "cat-vcoin",
        name: "Vcoin",
        slug: "vcoin",
        description: "Thẻ Vcoin",
        icon: "ticket"
      },
      {
        id: "cat-sohacoin",
        name: "SohaCoin",
        slug: "sohacoin",
        description: "Thẻ SohaCoin",
        icon: "ticket"
      },
      {
        id: "cat-funcard",
        name: "Funcard",
        slug: "funcard",
        description: "Thẻ Funcard",
        icon: "ticket"
      }
    ]
  }
];
