import { LEGACY_PERMISSION_MAP } from "./definitions";

export type ResolvedPermissions = Set<string>;

export function hasPermission(
  permissions: ResolvedPermissions | string[] | undefined,
  required: string
): boolean {
  if (!permissions) return false;
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  if (set.has("*")) return true;

  if (required.includes(":")) {
    const mapped = LEGACY_PERMISSION_MAP[required];
    if (mapped) return mapped.some((k) => hasPermission(set, k));
    if (required.endsWith(":*")) {
      const mod = required.replace(":*", "").split(":")[0];
      const fr = legacyModule(mod);
      return [...set].some((p) => p.startsWith(`${mod}.`) || p.startsWith(`${fr}.`));
    }
  }

  return set.has(required);
}

function legacyModule(m: string): string {
  const map: Record<string, string> = {
    vehicles: "vehicules",
    purchases: "achats",
    sales: "ventes",
    suppliers: "fournisseurs",
    payments: "paiements",
    reports: "rapports",
    users: "utilisateurs",
  };
  return map[m] ?? m;
}

export function mergePermissions(
  rolePerms: { module: string; action: string; allowed: boolean }[],
  userPerms: { module: string; action: string; allowed: boolean }[]
): ResolvedPermissions {
  const map = new Map<string, boolean>();
  for (const p of rolePerms) {
    if (p.allowed) map.set(`${p.module}.${p.action}`, true);
  }
  for (const p of userPerms) {
    const key = `${p.module}.${p.action}`;
    if (p.allowed) map.set(key, true);
    else map.delete(key);
  }
  return new Set([...map.keys()]);
}

export async function loadUserPermissions(
  prisma: {
    user: {
      findUnique: (args: {
        where: { id: string };
        include: {
          appRole: { include: { rolePermissions: { include: { permission: true } } } };
          userPermissions: { include: { permission: true } };
        };
      }) => Promise<{
        appRole: {
          code: string;
          rolePermissions: { allowed: boolean; permission: { module: string; action: string } }[];
        } | null;
        userPermissions: { allowed: boolean; permission: { module: string; action: string } }[];
      } | null>;
    };
  },
  userId: string
): Promise<ResolvedPermissions> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      appRole: { include: { rolePermissions: { include: { permission: true } } } },
      userPermissions: { include: { permission: true } },
    },
  });
  if (!user?.appRole) return new Set();
  if (user.appRole.code === "ADMIN") return new Set(["*"]);

  const rolePerms = user.appRole.rolePermissions.map((rp) => ({
    module: rp.permission.module,
    action: rp.permission.action,
    allowed: rp.allowed,
  }));
  const userPerms = user.userPermissions.map((up) => ({
    module: up.permission.module,
    action: up.permission.action,
    allowed: up.allowed,
  }));
  return mergePermissions(rolePerms, userPerms);
}
