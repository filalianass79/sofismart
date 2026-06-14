import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ListCard,
  ListCardBody,
  ListCardField,
  ListCardHeader,
  ListDataShell,
  ListDesktopTable,
  ListMobileCards,
} from "@/components/ui/responsive-list";

export type AuditLogRow = {
  id: string;
  createdAt: Date | string;
  action: string;
  module: string;
  targetType: string | null;
  targetId: string | null;
  actorUser: { email: string | null; name: string | null } | null;
};

export function AuditLogsList({ logs }: { logs: AuditLogRow[] }) {
  return (
    <ListDataShell empty={logs.length === 0} emptyMessage="Aucune entrée dans le journal.">
      <>
        <ListDesktopTable>
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Cible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-600">
                    {format(new Date(l.createdAt), "dd/MM/yy HH:mm", { locale: fr })}
                  </td>
                  <td className="px-4 py-3">{l.actorUser?.email ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                  <td className="px-4 py-3">{l.module}</td>
                  <td className="px-4 py-3 text-navy-600">
                    {l.targetType ? `${l.targetType} ${l.targetId?.slice(0, 8) ?? ""}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ListDesktopTable>
        <ListMobileCards>
          {logs.map((l) => (
            <ListCard key={l.id}>
              <ListCardHeader
                title={l.action}
                subtitle={format(new Date(l.createdAt), "dd/MM/yy HH:mm", { locale: fr })}
              />
              <ListCardBody>
                <ListCardField label="Utilisateur" value={l.actorUser?.email ?? "—"} fullWidth />
                <ListCardField label="Module" value={l.module} />
                <ListCardField
                  label="Cible"
                  value={
                    l.targetType ? `${l.targetType} ${l.targetId?.slice(0, 8) ?? ""}` : "—"
                  }
                />
              </ListCardBody>
            </ListCard>
          ))}
        </ListMobileCards>
      </>
    </ListDataShell>
  );
}
