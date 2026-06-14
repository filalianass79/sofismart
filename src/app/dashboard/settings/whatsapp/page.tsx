import { WhatsAppSettingsPanel } from "@/components/notifications/whatsapp-settings-panel";

export default function WhatsAppSettingsPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-navy-950">WhatsApp — Production</h2>
      <p className="text-sm text-navy-600">
        Configuration Meta WhatsApp Cloud API, templates validés et événements métier.
      </p>
      <WhatsAppSettingsPanel />
    </div>
  );
}
