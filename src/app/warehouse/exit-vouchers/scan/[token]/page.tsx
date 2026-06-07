import { redirect } from "next/navigation";

export default async function LegacyScanVoucherPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/dashboard/warehouse/exit-vouchers/scan/${token}`);
}
