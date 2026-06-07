import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EmployeesIdLegacyRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/settings/employees/${id}`);
}
