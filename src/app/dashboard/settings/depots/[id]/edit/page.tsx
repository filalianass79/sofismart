import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EditDepotRedirect({ params }: Props) {
  await params;
  redirect("/dashboard/settings/depots");
}
