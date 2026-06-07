import { EmailLogsTable } from "@/components/notifications/email-logs-table";

export default function EmailLogsPage() {
  return (
    <article className="space-y-6">
      <header>
        <h2 className="font-display text-2xl text-navy-950">Historique emails</h2>
        <p className="mt-1 text-sm text-navy-600">
          Emails transactionnels et notifications envoyés par SOFISMART.
        </p>
      </header>
      <EmailLogsTable />
    </article>
  );
}
