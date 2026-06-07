# SOFISMART — Checklist déploiement STAGING

Utiliser cette checklist avant chaque démo client ou validation de release.

## Prérequis infrastructure

- [ ] Projet Neon **staging** créé (séparé de production)
- [ ] Projet Vercel **staging** ou Preview configuré
- [ ] Variables d'environnement importées depuis `.env.staging.example`
- [ ] `AUTH_SECRET` unique (32+ caractères, différent de prod)
- [ ] `APP_URL` / `NEXTAUTH_URL` = URL HTTPS staging réelle
- [ ] `NEXT_PUBLIC_APP_ENV=staging` configuré

## Build & qualité

- [ ] `npm run lint` — OK
- [ ] `npm run type-check` — OK
- [ ] `npm run build` — OK
- [ ] `npm run test:deployment` — OK

## Base de données

- [ ] `npx prisma generate` — OK
- [ ] `npx prisma migrate deploy` — OK
- [ ] `npm run seed:staging` — OK
- [ ] Connexion vérifiée via `/health`

## Authentification

- [ ] Login admin@test.sofismart.ma — OK
- [ ] Login commercial@test.sofismart.ma — OK
- [ ] Login magasinier@test.sofismart.ma — OK
- [ ] Login comptable@test.sofismart.ma — OK
- [ ] Login directeur@test.sofismart.ma — OK
- [ ] Bandeau TEST visible après connexion

## Modules métier

- [ ] Clients — liste, création, recherche
- [ ] Fournisseurs — liste, détail
- [ ] Véhicules — stock, recherche, fiche
- [ ] Achats — liste, création brouillon
- [ ] Ventes — wizard, validation
- [ ] Proformas — création, PDF
- [ ] Paiements — enregistrement
- [ ] Dashboard — KPIs par rôle

## Documents & PDF

- [ ] Bon de sortie — génération PDF
- [ ] Bon de livraison — génération PDF
- [ ] Facture vente — génération PDF
- [ ] Proforma — génération PDF
- [ ] `/demo-documents` — PDF accessibles
- [ ] Bouton « Générer PDF TEST » sur `/about-test`

## Notifications

- [ ] Email simulé (`EMAIL_LOG_ONLY=true`) — logs créés
- [ ] WhatsApp simulé (`WHATSAPP_ENABLED=false`) — logs SENT
- [ ] Pas d'envoi réel vers clients

## Technique

- [ ] QR Code — scan magasin
- [ ] Permissions RBAC — rôles respectés
- [ ] Upload document — OK (local)
- [ ] Responsive — mobile / tablette
- [ ] `/health` — statut OK
- [ ] `/about-test` — infos à jour

## Sécurité & isolation

- [ ] Aucune variable production dans staging
- [ ] Aucune donnée réelle client en base test
- [ ] Webhook WhatsApp (si activé) pointe vers URL staging

---

**Date validation :** _______________  
**Validé par :** _______________  
**URL staging :** _______________
