import { redirect } from "next/navigation";

export default function DepotsNewLegacyRedirect() {
  redirect("/dashboard/settings/depots/new");
}
