import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeaderUser } from "@/components/dashboard-header-user";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { StagingAppTitle, StagingFooterNote } from "@/components/staging/staging-chrome";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-navy-950/10 bg-white/90 px-6 py-4 backdrop-blur">
            <div>
              <StagingAppTitle />
              <h1 className="font-display text-lg text-navy-950">Espace professionnel</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <DashboardHeaderUser
                name={session?.user?.name}
                email={session?.user?.email}
                roleLabel={(session?.user?.roleCode ?? session?.user?.role)?.replace(/_/g, " ")}
              />
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
          <StagingFooterNote />
        </div>
      </div>
    </div>
  );
}
