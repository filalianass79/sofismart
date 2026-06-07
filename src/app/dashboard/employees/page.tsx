import { redirect } from "next/navigation";

export default function EmployeesLegacyRedirect() {
  redirect("/dashboard/settings/employees");
}
