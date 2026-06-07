import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClientStats } from "@/lib/services/client-service";
import { ClientDetailView } from "@/components/clients/client-detail-view";
import { getFinancialAccessFromSession } from "@/lib/server/financial-access-session";

type Props = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const financial = await getFinancialAccessFromSession();
  const canViewFinancials = financial?.canViewFinancials ?? false;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      clientDocuments: { orderBy: { createdAt: "desc" } },
      interactions: {
        orderBy: { date: "desc" },
        include: { employee: { select: { name: true } } },
      },
      sales: {
        orderBy: { saleDate: "desc" },
        include: { vehicle: true, payments: true },
      },
    },
  });
  if (!client) notFound();

  const stats = await getClientStats(id);

  const payload = {
    ...client,
    creditLimit: client.creditLimit,
    stats: {
      ...stats,
      lastSaleDate: stats.lastSaleDate?.toISOString() ?? null,
    },
    sales: client.sales.map((s) => ({
      ...s,
      saleDate: s.saleDate.toISOString(),
      payments: s.payments.map((p) => ({
        ...p,
        paidAt: p.paidAt.toISOString(),
      })),
    })),
    clientDocuments: client.clientDocuments.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
    interactions: client.interactions.map((i) => ({
      ...i,
      date: i.date.toISOString(),
    })),
  };

  return (
    <ClientDetailView
      client={
        canViewFinancials
          ? (payload as never)
          : ({
              ...payload,
              stats: { ...payload.stats, totalMargin: 0 },
            } as never)
      }
      canViewFinancials={canViewFinancials}
    />
  );
}
