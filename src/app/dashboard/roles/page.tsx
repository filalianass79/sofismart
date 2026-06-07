import { redirect } from "next/navigation";

export default function RolesLegacyRedirect() {
  redirect("/dashboard/settings/roles");
}
