import { User } from "@/types/domain";

export const users: User[] = [
  {
    id: "user-01",
    fullName: "Nguyen Minh Anh",
    email: "user@meowmarket.vn",
    phone: "0901234567",
    avatar: "MA",
    role: "USER",
    status: "ACTIVE",
    notificationsEnabled: true,
    joinedAt: "2025-09-12T09:00:00.000Z"
  },
  {
    id: "admin-01",
    fullName: "Tran Bao Chau",
    email: "admin@meowmarket.vn",
    phone: "0987654321",
    avatar: "BC",
    role: "ADMIN",
    status: "ACTIVE",
    notificationsEnabled: true,
    joinedAt: "2025-04-18T09:00:00.000Z"
  }
];
