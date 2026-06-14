import { BrandsManager } from "@/components/settings/brands-manager";
import {
  parametresCrudFlags,
  requireSettingsPageAccess,
} from "@/lib/rbac/settings-page-auth";

export default async function SettingsBrandsPage() {
  const perms = await requireSettingsPageAccess("parametres.view");
  const flags = parametresCrudFlags(perms);

  return <BrandsManager {...flags} />;
}
