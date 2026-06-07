import { redirect } from "next/navigation";

export default function NewUserRedirect() {
  redirect("/dashboard/settings/users");
}
