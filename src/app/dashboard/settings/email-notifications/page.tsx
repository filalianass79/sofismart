import { EmailSettingsPanel } from "@/components/notifications/email-settings-panel";

export default function EmailNotificationsSettingsPage() {
  return (
    <article className="space-y-4">
      <header>
        <h3 className="font-display text-xl text-navy-950">Notifications email</h3>
        <p className="mt-1 text-sm text-navy-600">
          Provider, tests et activation des événements email.
        </p>
      </header>
      <EmailSettingsPanel />
    </article>
  );
}
