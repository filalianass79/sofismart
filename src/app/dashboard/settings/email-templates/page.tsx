import { EmailTemplateList } from "@/components/notifications/email-template-list";

export default function EmailTemplatesSettingsPage() {
  return (
    <article className="space-y-4">
      <header>
        <h3 className="font-display text-xl text-navy-950">Templates email</h3>
        <p className="mt-1 text-sm text-navy-600">
          Personnalisez les sujets et contenus HTML des emails automatiques.
        </p>
      </header>
      <EmailTemplateList />
    </article>
  );
}
