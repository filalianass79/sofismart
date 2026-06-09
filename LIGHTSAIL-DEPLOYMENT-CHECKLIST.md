# SOFISMART — Checklist déploiement AWS Lightsail

## Serveur Lightsail

- [ ] Instance Ubuntu 22.04+ créée (2 Go RAM min, 4 Go recommandé)
- [ ] Ports 22, 80, 443 ouverts dans le firewall Lightsail
- [ ] Clé SSH configurée
- [ ] Docker installé
- [ ] Nginx installé
- [ ] Certbot installé

## Configuration

- [ ] Projet cloné dans `/opt/sofismart`
- [ ] `.env.production` créé depuis `.env.production.example`
- [ ] `AUTH_SECRET` / `NEXTAUTH_SECRET` uniques (32+ chars)
- [ ] `POSTGRES_PASSWORD` fort
- [ ] `SEED_ADMIN_PASSWORD` défini (12+ chars)
- [ ] `APP_URL` = `https://app.sofismart.ma`
- [ ] `QR_SECRET` défini
- [ ] Aucune valeur `CHANGE_ME` restante

## Build & Docker

- [ ] `npm run lint` OK (local)
- [ ] `npm run type-check` OK (local)
- [ ] `npm run build` OK (local)
- [ ] `docker compose --env-file .env.production build` OK
- [ ] `docker compose --env-file .env.production up -d` OK
- [ ] `/api/health` retourne `status: ok`

## Base de données

- [ ] `prisma migrate deploy` exécuté
- [ ] Seed admin production OK
- [ ] `RUN_MIGRATIONS_ON_START=false` après premier deploy
- [ ] `RUN_SEED_ON_START=false` après premier deploy

## Nginx & SSL

- [ ] DNS `app.sofismart.ma` → IP Lightsail
- [ ] Nginx configuré (`nginx/sofismart.conf`)
- [ ] Certbot SSL actif
- [ ] Redirection HTTP → HTTPS
- [ ] `client_max_body_size 50M`

## Fonctionnel

- [ ] Login admin OK
- [ ] Dashboard accessible
- [ ] Clients / fournisseurs / véhicules
- [ ] Achats / ventes / proformas
- [ ] Upload documents OK
- [ ] Génération PDF (bon sortie, livraison, facture, proforma)
- [ ] QR Code utilise `APP_URL` production (pas localhost)
- [ ] Permissions RBAC par rôle
- [ ] Responsive mobile

## Notifications

- [ ] Email SMTP configuré et testé
- [ ] `EMAIL_TEST_MODE=false`
- [ ] WhatsApp webhook accessible (`/api/whatsapp/webhook`)
- [ ] `WHATSAPP_VERIFY_TOKEN` configuré

## Sécurité

- [ ] `.env.production` non versionné (gitignore)
- [ ] App écoute sur `127.0.0.1:3000` uniquement
- [ ] PostgreSQL non exposé publiquement
- [ ] `ENABLE_DEBUG_MODE=false`
- [ ] Headers sécurité Nginx actifs

## Sauvegardes

- [ ] `./scripts/backup-db.sh` testé
- [ ] `./scripts/restore-db.sh` testé (environnement de test)
- [ ] Cron sauvegarde quotidienne configuré
- [ ] Dossier `backups/` créé

---

**URL production :** _______________  
**Date go-live :** _______________  
**Responsable :** _______________
