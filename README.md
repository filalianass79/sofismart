# SOFISMART — Gestion véhicules (SaaS interne)

Application web **Next.js 15 (App Router)**, **PostgreSQL**, **Prisma 7**, **NextAuth.js v5** (identifiants + JWT), **Tailwind CSS**. Charte visuelle : **navy**, **or**, **rouge Maroc** (accents), fond **crème** — alignée sur l’identité SOFISMART.

## Architecture

| Couche | Rôle |
|--------|------|
| `src/app/(pages)` | UI : dashboard, modules métier, login |
| `src/app/api/*` | API REST CRUD + rapports + upload |
| `src/auth.ts` | NextAuth (Credentials, session JWT, rôle dans le token) |
| `src/middleware.ts` | Protection routes (JWT via `getToken`, compatible Edge — **sans** Prisma) |
| `src/lib/prisma.ts` | Client Prisma + adaptateur `@prisma/adapter-pg` |
| `src/lib/permissions.ts` | Matrice rôles → permissions |
| `prisma/schema.prisma` | Modèle relationnel (User, Vehicle, Purchase, Sale, Depot, Payment, etc.) |

**Rôles** : `ADMIN`, `COMMERCIAL`, `DEPOT_MANAGER`, `ACCOUNTANT` — permissions par module (voir `src/lib/permissions.ts`).

**Calculs métier** : prix de revient = prix d’achat + frais (`src/lib/finance.ts`, appliqué dans `POST /api/purchases`). Marge vente = prix net − prix de revient (`POST /api/sales`).

## Prérequis

- Node.js 20+
- PostgreSQL 14+ (ou Docker : `docker compose up -d` à la racine — base `sofismart`, user/mot de passe `postgres` / `postgres`, **port hôte `5433`** pour éviter un conflit avec un PostgreSQL déjà installé sur `5432`)

## Installation

```bash
cd sofismart
cp .env.example .env
# Éditer .env : DATABASE_URL (Docker : postgresql://postgres:postgres@localhost:5433/sofismart?schema=public),
# AUTH_SECRET (32+ caractères), NEXTAUTH_URL
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Ouvrir [http://localhost:3001](http://localhost:3001) — redirection vers `/login`.

### Comptes démo (après seed)

| Email | Mot de passe | Rôle |
|-------|----------------|------|
| `admin@sofismart.ma` | `SofiSmart2026!` | Administrateur |
| `commercial@sofismart.ma` | `SofiSmart2026!` | Commercial |

### Dépannage (Prisma / login : « Authentication failed… »)

- **Cause fréquente sous Windows** : un PostgreSQL déjà installé écoute sur `5432`. L’app se connecte alors à **ce** serveur avec le mot de passe Docker (`postgres`), ce qui provoque l’erreur. Ce projet expose Docker sur le port **`5433`** ; gardez `DATABASE_URL` avec `@localhost:5433/`.
- Après changement du mot de passe dans `docker-compose.yml`, il faut recréer le volume : `docker compose down -v`, puis `docker compose up -d`, puis `npx prisma migrate dev`.
- Si vous n’utilisez pas Docker : mettez dans `.env` l’URL de **votre** instance (port et mot de passe réels).

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Production |
| `npm run type-check` | Vérification TypeScript |
| `npm run lint` | ESLint |
| `npm run prisma:migrate:deploy` | Migrations en production |
| `npm run db:migrate` | Migrations Prisma (dev) |
| `npm run db:seed` | Données de démonstration (`SEED_MODE=demo`) |
| `npm run db:generate` | Régénère le client Prisma |

**Déploiement :** voir [DEPLOYMENT.md](./DEPLOYMENT.md) et [CHECKLIST-PRODUCTION.md](./CHECKLIST-PRODUCTION.md).

## API principales (authentification requise)

- `GET/POST /api/vehicles` — `GET/PATCH/DELETE /api/vehicles/[id]`
- `GET/POST /api/depots` — `PATCH/DELETE /api/depots/[id]`
- `GET/POST /api/clients`, `GET/POST /api/suppliers`
- `GET/POST /api/purchases` — création transactionnelle véhicule + achat + frais
- `GET/POST /api/sales` — vente + statut véhicule **SOLD** + marge
- `POST /api/payments` — règle le statut de paiement des ventes
- `POST /api/stock/transfer` — transfert entre dépôts + historique
- `GET /api/reports/pdf?type=stock|sales` — PDF (jsPDF)
- `GET /api/reports/excel?type=stock|sales` — Excel (SheetJS)
- `POST /api/uploads` — `multipart/form-data` (`file`, `category`, …)
- `GET /api/documents`

## Sécurité & production

- Modèles : `.env.example` (dev), `.env.production.example` (prod).
- `AUTH_SECRET` ≥ 32 caractères ; premier déploiement : `SEED_MODE=production` + `SEED_ADMIN_*`.
- Rate limiting login (8 tentatives / 15 min par email).
- Uploads : PDF, JPG, PNG, WEBP — taille max `MAX_UPLOAD_BYTES` (défaut 10 Mo).
- Docker : `docker compose -f docker-compose.prod.yml up -d --build`.
- En serverless (Vercel), prévoir un stockage objet pour les uploads.

## Structure des dossiers (extrait)

```
src/app/dashboard/     # Pages métier + layout sidebar
src/app/api/           # Routes API
src/components/        # UI réutilisable (sidebar, providers)
src/lib/               # prisma, auth helpers, finance, permissions
prisma/schema.prisma
prisma/seed.ts
```

## Module Magasinier (`/warehouse/dashboard`)

Compte démo magasinier : `magasin@sofismart.ma` / `SofiSmart2026!`

### Workflow

1. **Connexion** — le rôle `MAGASINIER` est redirigé vers `/warehouse/dashboard` (dépôt = `employee.depotId`).
2. **Vente validée** — génération automatique du bon de sortie (BSV) ; la vente apparaît en « livraisons en attente ».
3. **Bon de livraison** — le magasinier génère un BLV (PDF + QR) depuis le tableau de bord.
4. **Livraison** — confirmation avec checklist, kilométrage, upload du bon signé (si `signedDeliveryRequired` dans Paramètres > Société).
5. **Finalisation** — `deliveryStatus = DELIVERED`, véhicule `DELIVERED`, mouvement stock `COMPLETED`, notifications commercial + admin.

### API principales

| Route | Description |
|-------|-------------|
| `GET /api/warehouse/dashboard` | Stats + listes agrégées |
| `GET /api/warehouse/pending-deliveries` | Ventes à livrer |
| `POST /api/warehouse/sales/:id/delivery-note/generate` | Créer BLV |
| `POST /api/warehouse/delivery-notes/:id/confirm-delivery` | Confirmer livraison |
| `POST /api/warehouse/delivery-notes/:id/upload-signed` | Joindre bon signé |

Permissions métier `warehouse.*` mappées sur le module RBAC `magasin` (`view`, `validate`).

---

*BY CROWN CAPITAL TRUST — identité visuelle SOFISMART.*
