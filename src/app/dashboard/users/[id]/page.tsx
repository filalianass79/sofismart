import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function UsersIdLegacyRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/settings/users/${id}`);
}
