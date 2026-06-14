"use client";

import type { ReactNode } from "react";
import { DashboardHeaderUser } from "@/components/dashboard-header-user";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { RealtimeNotificationListener } from "@/components/notifications/realtime-notification-listener";
import { StagingAppTitle, StagingFooterNote } from "@/components/staging/staging-chrome";
import { MobileHeader } from "./MobileHeader";
import { MobileSidebar } from "./MobileSidebar";
import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "./sidebar-context";

type DashboardShellProps = {
  children: ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    roleLabel?: string | null;
  };
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col bg-cream-50">
        <div className="flex min-h-0 flex-1">
          <Sidebar className="hidden lg:flex" />
          <MobileSidebar />

          <div className="flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out">
            <MobileHeader
              name={user?.name}
              email={user?.email}
              roleLabel={user?.roleLabel}
            />

            <header className="sticky top-0 z-10 hidden items-center justify-between border-b border-navy-950/10 bg-white/90 px-6 py-4 backdrop-blur lg:flex">
              <div>
                <StagingAppTitle />
                <h1 className="font-display text-lg text-navy-950">Espace professionnel</h1>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <DashboardHeaderUser
                  name={user?.name}
                  email={user?.email}
                  roleLabel={user?.roleLabel}
                />
              </div>
            </header>

            <main className="flex-1 p-4 sm:p-6">{children}</main>
            <RealtimeNotificationListener />
            <StagingFooterNote />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
