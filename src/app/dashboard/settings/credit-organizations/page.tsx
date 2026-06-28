import { CreditOrganizationsManager } from "@/components/settings/credit-organizations-manager";
import {
  parametresCrudFlags,
  requireSettingsPageAccess,
} from "@/lib/rbac/settings-page-auth";

export default async function SettingsCreditOrganizationsPage() {
  const perms = await requireSettingsPageAccess("parametres.view");
  const flags = parametresCrudFlags(perms);

  return <CreditOrganizationsManager {...flags} />;
}
