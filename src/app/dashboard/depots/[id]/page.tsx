import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function DepotsIdLegacyRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/settings/depots/${id}`);
}
