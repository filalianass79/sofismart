# Module RH & accès — SOFISMART

## Démarrage

```bash
npm run db:up
npx prisma db push
npm run db:seed
npm run dev
```

Compte admin : `admin@sofismart.com` / `SofiSmart2026!`

## Pages

| Route                                 | Description          |
| ------------------------------------- | -------------------- |
| `/dashboard/employees`                | Liste salariés       |
| `/dashboard/employees/new`            | Création             |
| `/dashboard/users`                    | Comptes utilisateurs |
| `/dashboard/roles`                    | Rôles système        |
| `/dashboard/roles/[id]/permissions`   | Matrice permissions  |
| `/dashboard/profile`                  | Mon profil           |
| `/dashboard/security/change-password` | Changement MDP       |
| `/dashboard/audit-logs`               | Journal d'audit      |

## Permissions

Format : `module.action` (ex. `salaries.create`, `utilisateurs.reset_password`).

Les routes API existantes (`clients:*`, etc.) restent compatibles via le mapping legacy dans `src/lib/permissions.ts`.

## Rôles par défaut

ADMIN, GERANT, DIRECTEUR, COMMERCIAL, COMPTABLE, RESPONSABLE_DEPOT, MAGASINIER, CHAUFFEUR, EMPLOYE — seed dans `prisma/seed-rbac.ts`.

## Sécurité

- Mots de passe hashés (bcrypt, cost 12)
- `passwordMustChange` redirige vers changement MDP
- Salarié archivé → compte désactivé
- Actions sensibles journalisées (`AuditLog`)
