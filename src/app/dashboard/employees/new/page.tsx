import { redirect } from "next/navigation";

export default function EmployeesNewLegacyRedirect() {
  redirect("/dashboard/settings/employees/new");
}
