# Déploiement SOFISMART — production

## Prérequis

- **Node.js** 20 LTS
- **PostgreSQL** 14+ (ou conteneur Docker)
- **npm** 10+
- Domaine HTTPS recommandé (reverse proxy : Nginx, Caddy, Traefik)

## 1. Variables d'environnement

Copier le modèle :

```bash
cp .env.production.example .env
```

Renseigner au minimum :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Chaîne PostgreSQL |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `APP_URL` / `NEXTAUTH_URL` | URL publique HTTPS |
| `SEED_MODE` | `production` au premier déploiement |
| `SEED_ADMIN_EMAIL` | Email administrateur initial |
| `SEED_ADMIN_PASSWORD` | Mot de passe fort (12+ caractères) |

Ne jamais committer `.env`.

## 2. Installation (sans Docker)

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
SEED_MODE=production npm run prisma:seed
npm run build
npm run start
```

L’application écoute sur le port **3000** (`next start -p 3000` si besoin).

### Windows (PowerShell)

```powershell
$env:SEED_MODE="production"
npm run db:seed
```

## 3. Déploiement Docker

```bash
cp .env.production.example .env
# Ajouter POSTGRES_PASSWORD=... dans .env pour docker-compose.prod.yml

docker compose -f docker-compose.prod.yml up -d --build
```

Puis, dans le conteneur ou en local avec `DATABASE_URL` pointant vers `db` :

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

Le volume `sofismart_uploads` persiste les fichiers (`public/uploads`).

## 4. Vercel + PostgreSQL externe

1. Créer une base (Neon, Supabase, Railway, etc.).
2. Définir les variables dans le projet Vercel (`DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `APP_URL`).
3. Build : `npm run build` (déjà dans la config Vercel).
4. Exécuter les migrations depuis CI ou en local :

   ```bash
   DATABASE_URL="..." npm run prisma:migrate:deploy
   SEED_MODE=production SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run prisma:seed
   ```

**Note :** le stockage fichiers local (`public/uploads`) n’est pas persistant sur Vercel — prévoir S3 / Supabase Storage pour la production serverless.

**Import facture achat (OCR)** : nécessite un serveur Node.js avec disque persistant (Docker/VPS). Non compatible Vercel serverless. Prévoir un timeout proxy ≥ 120 s pour `POST /api/purchases/invoice-import*`. Voir [docs/INVOICE-IMPORT.md](./docs/INVOICE-IMPORT.md).

## 5. Migrations Prisma

| Commande | Usage |
|----------|--------|
| `npm run prisma:migrate` | Développement (crée des migrations) |
| `npm run prisma:migrate:deploy` | Production (applique sans prompt) |
| `npm run db:push` | Prototype uniquement (éviter en prod) |

## 6. Seed

- **Démo / dev :** `SEED_MODE=demo` (défaut) — comptes test, véhicules, clients.
- **Production :** `SEED_MODE=production` — RBAC + un admin (`SEED_ADMIN_*`).

Après le premier seed production, retirer `SEED_ADMIN_PASSWORD` de `.env` ou changer le mot de passe admin.

## 7. Sauvegarde base de données

```bash
pg_dump "$DATABASE_URL" -Fc -f sofismart_$(date +%Y%m%d).dump
```

Restauration :

```bash
pg_restore -d sofismart --clean sofismart_YYYYMMDD.dump
```

Sauvegarder aussi le volume / dossier `public/uploads`.

## 8. Redémarrage

```bash
# systemd / PM2
pm2 restart sofismart

# Docker
docker compose -f docker-compose.prod.yml restart app
```

## 9. Vérification post-déploiement

Voir [CHECKLIST-PRODUCTION.md](./CHECKLIST-PRODUCTION.md).

## 10. Sécurité

- `AUTH_SECRET` unique par environnement
- HTTPS obligatoire en production
- Limiter l’accès PostgreSQL au réseau applicatif
- Désactiver les comptes démo en production (`SEED_MODE=production` uniquement)
- Mettre à jour les dépendances : `npm audit`

## Dépannage

| Problème | Action |
|----------|--------|
| `DATABASE_URL manquant` | Vérifier `.env` / variables hébergeur |
| Migrations en échec | `prisma migrate deploy` avec la bonne URL |
| PDF / facture | `npm run db:push` si schéma documents absent |
| Uploads perdus au redémarrage | Monter un volume sur `public/uploads` |
| Import facture échoue (OCR) | Vérifier `node_modules/pdfjs-dist`, redémarrer après deploy ; timeout proxy 120 s |
| `nodeRequire is not a function` / worker-script | Redémarrer serveur ; déployer avec Docker (deps OCR copiées) |
