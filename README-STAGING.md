# SOFISMART — Déploiement TEST / STAGING

Guide pour déployer une instance **totalement indépendante** de la production, destinée aux tests utilisateurs, démonstrations clients et validation fonctionnelle.

## Architecture des environnements

```
DEV (local)  →  TEST / STAGING (Vercel + Neon)  →  PRODUCTION
```

| Environnement | Base de données | Hébergement | Données |
|---------------|-----------------|-------------|---------|
| DEV | Docker local :5433 | `npm run dev` | Demo locale |
| STAGING | Neon PostgreSQL (projet séparé) | Vercel Preview | Seed staging |
| PRODUCTION | Neon / serveur dédié | Vercel / Docker | Réelles |

**Règle absolue :** ne jamais partager `DATABASE_URL`, `AUTH_SECRET` ou données entre staging et production.

---

## 1. Installation locale (staging)

```bash
git clone <repo>
cd sofismart
npm install
cp .env.staging.example .env.staging
# Éditer DATABASE_URL et AUTH_SECRET
npm run prisma:migrate:deploy
npm run seed:staging
npm run demo:documents
npm run staging
```

Ouvrir : [http://localhost:3000/about-test](http://localhost:3000/about-test)  
Santé : [http://localhost:3000/health](http://localhost:3000/health)

---

## 2. Variables d'environnement

| Fichier | Usage |
|---------|--------|
| `.env.example` | Template développement local |
| `.env.staging.example` | Template staging → copier en `.env.staging` |
| `.env.production.example` | Template production |

Variables clés staging :

```env
APP_ENV=staging
APP_NAME=SOFISMART TEST
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_NAME=SOFISMART TEST
SEED_MODE=staging
WHATSAPP_ENABLED=false
EMAIL_ENABLED=true
EMAIL_TEST_MODE=true
EMAIL_LOG_ONLY=true
UPLOAD_STORAGE=local
ENABLE_DEBUG_MODE=true
ENABLE_MOCK_NOTIFICATIONS=true
```

> `AUTH_SECRET` est utilisé par NextAuth (alias accepté : `NEXTAUTH_SECRET`).

---

## 3. Déploiement Vercel

1. Créer un projet Vercel lié au dépôt GitHub
2. Environnement **Preview** ou projet dédié `sofismart-staging`
3. Importer les variables depuis `.env.staging.example`
4. Région recommandée : `cdg1` (Paris) — configurée dans `vercel.json`
5. Build : `prisma generate && next build` (automatique)

**Limitation Vercel :** le stockage local (`public/uploads`) est **éphémère**. Les fichiers uploadés peuvent disparaître au redeploiement. Pour staging long terme, prévoir S3 (`UPLOAD_STORAGE=s3`).

---

## 4. Neon PostgreSQL (staging)

1. Créer un **projet Neon séparé** (ex. `sofismart-staging`)
2. Copier la connection string avec `?sslmode=require`
3. Coller dans `DATABASE_URL` (Vercel + `.env.staging`)

```bash
npx prisma migrate deploy
npm run seed:staging
```

---

## 5. Migrations Prisma

```bash
npx prisma generate
npx prisma migrate deploy
```

Schéma : `prisma/schema.prisma` — PostgreSQL compatible Neon.

---

## 6. Seed staging

```bash
npm run seed:staging
```

Crée :

- 10 fournisseurs
- 20 clients
- 50 véhicules
- 10 achats validés
- 10 ventes
- Profil société « SOFISMART TEST »

---

## 7. Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@test.sofismart.ma | Admin123* |
| Commercial | commercial@test.sofismart.ma | Test123* |
| Magasinier | magasinier@test.sofismart.ma | Test123* |
| Comptable | comptable@test.sofismart.ma | Test123* |
| Directeur | directeur@test.sofismart.ma | Test123* |

---

## 8. Identification visuelle

En staging (`NEXT_PUBLIC_APP_ENV=staging`) :

- Bandeau orange : **ENVIRONNEMENT TEST — DONNÉES NON CONTRACTUELLES**
- Header : **SOFISMART TEST** + badge **STAGING**
- Footer : **Version TEST**

---

## 9. Notifications simulées

| Canal | Comportement staging |
|-------|---------------------|
| WhatsApp | `WHATSAPP_ENABLED=false` → logs simulés (statut SENT) |
| Email | `EMAIL_TEST_MODE=true` + `EMAIL_LOG_ONLY=true` → journalisation sans envoi réel |
| Email (option) | `EMAIL_TEST_RECIPIENT=votre@email.com` → redirection vers une seule adresse |

---

## 10. Documents & PDF TEST

```bash
npm run demo:documents
```

Fichiers dans `/public/demo-documents/` :

- facture-achat-demo.pdf
- bon-sortie-demo.pdf
- bon-livraison-demo.pdf
- facture-vente-demo.pdf
- proforma-demo.pdf

Bouton **Générer PDF TEST** sur `/about-test`.

---

## 11. Scripts npm

| Script | Description |
|--------|-------------|
| `npm run staging` | Dev avec `.env.staging` |
| `npm run seed:staging` | Seed base staging |
| `npm run demo:documents` | PDF de démonstration |
| `npm run test:deployment` | lint + type-check + build |
| `npm run build` | Build production |

---

## 12. Limitations environnement test

- Données fictives, non contractuelles
- Uploads non persistants sur Vercel (filesystem)
- WhatsApp réel désactivé
- Emails réels désactivés par défaut (mode simulation)
- OCR factures : optionnel, ressources lourdes
- Ne pas saisir de données clients réelles

---

## Workflow GitHub → Vercel → Neon

```
Push branche staging
    ↓
Vercel build + deploy preview
    ↓
Neon PostgreSQL (staging)
    ↓
Tests / démo clients
    ↓
Validation → merge → production
```

Voir aussi : [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)
