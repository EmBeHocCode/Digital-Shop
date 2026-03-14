import { prisma } from "@/lib/prisma";
import { runSafeDbQuery } from "@/services/db-utils";
import { mapPrismaFaq, mapPrismaSupportTicket } from "@/services/sql-mappers";

export async function getFaqs() {
  return runSafeDbQuery([], async () => {
    const faqs = await prisma.faqItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });

    return faqs.map(mapPrismaFaq);
  });
}

export async function getSupportTickets() {
  return runSafeDbQuery([], async () => {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    });

    return tickets.map(mapPrismaSupportTicket);
  });
}

export async function getRecentTickets(limit = 5) {
  return runSafeDbQuery([], async () => {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit
    });

    return tickets.map(mapPrismaSupportTicket);
  });
}

export async function getTicketsByUser(userId: string) {
  return runSafeDbQuery([], async () => {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    });

    return tickets.map(mapPrismaSupportTicket);
  });
}

export async function createSupportTicket(input: {
  userId: string;
  subject: string;
  category: string;
  content: string;
}) {
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: input.userId,
      subject: input.subject,
      category: input.category,
      content: input.content,
      status: "OPEN",
      priority: "MEDIUM",
      messages: {
        create: {
          senderType: "USER",
          body: input.content
        }
      }
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  return mapPrismaSupportTicket(ticket);
}
