import { redirect } from "next/navigation";

export default function DepotsLegacyRedirect() {
  redirect("/dashboard/settings/depots");
}
