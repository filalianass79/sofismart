import { auth } from "@/auth";
import { DashboardShell } from "@/components/sidebar/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const roleCode = session?.user?.roleCode ?? session?.user?.role;

  return (
    <DashboardShell
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
        roleLabel: roleCode?.replace(/_/g, " "),
      }}
    >
      {children}
    </DashboardShell>
  );
}
