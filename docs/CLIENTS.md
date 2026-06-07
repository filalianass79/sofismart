# Module Clients — SOFISMART

## Démarrage

```bash
npx prisma db push
npm run db:seed
npm run dev
```

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard/clients` | Liste, recherche, filtres, export Excel |
| `/dashboard/clients/new` | Assistant création (stepper 5 étapes) |
| `/dashboard/clients/[id]` | Fiche détail (6 onglets) |
| `/dashboard/clients/[id]/edit` | Modification |

## Types

- **INDIVIDUAL** — Particulier (civilité, nom, prénom, CIN…)
- **COMPANY** / **RESELLER** — Professionnel (raison sociale, ICE, RC…)

## API

- `GET/POST /api/clients`
- `GET/PUT/DELETE /api/clients/:id`
- `PATCH /api/clients/:id/archive`
- `GET /api/clients/:id/stats|payments|documents|interactions`
- `POST /api/clients/:id/documents`
- Export : `GET /api/reports/excel?type=clients`

## Soldes

Calcul automatique : total ventes − paiements reçus (`FROM_CLIENT`), exposé dans liste et fiche.

## Permissions

`clients.view`, `clients.create`, `clients.edit`, `clients.delete`, `clients.archive`, `clients.upload_documents`
