import { redirect } from "next/navigation";

export default function UsersLegacyRedirect() {
  redirect("/dashboard/settings/users");
}
