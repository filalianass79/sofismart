import { redirect } from "next/navigation";

export default function AuditLogsLegacyRedirect() {
  redirect("/dashboard/settings/audit-logs");
}
