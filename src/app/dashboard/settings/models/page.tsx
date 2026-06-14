import { ModelsManager } from "@/components/settings/models-manager";
import {
  parametresCrudFlags,
  requireSettingsPageAccess,
} from "@/lib/rbac/settings-page-auth";

export default async function SettingsModelsPage() {
  const perms = await requireSettingsPageAccess("parametres.view");
  const flags = parametresCrudFlags(perms);

  return <ModelsManager {...flags} />;
}
