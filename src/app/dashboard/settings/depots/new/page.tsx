import { redirect } from "next/navigation";

export default function NewDepotRedirect() {
  redirect("/dashboard/settings/depots");
}
