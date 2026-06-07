import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function RolePermissionsRedirect({ params }: Props) {
  await params;
  redirect("/dashboard/settings/roles");
}
