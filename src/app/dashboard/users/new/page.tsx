import { redirect } from "next/navigation";

export default function UsersNewLegacyRedirect() {
  redirect("/dashboard/settings/users/new");
}
