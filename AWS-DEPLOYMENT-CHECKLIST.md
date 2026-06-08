# SOFISMART — Checklist déploiement AWS Production

## Infrastructure AWS

- [ ] VPC avec subnets publics (ALB) et privés (ECS, RDS)
- [ ] NAT Gateway pour sortie internet ECS
- [ ] RDS PostgreSQL 16 créé (accès privé uniquement)
- [ ] Security groups : ALB → ECS:3000, ECS → RDS:5432
- [ ] Bucket S3 `sofismart-prod-uploads` créé
- [ ] CloudFront devant S3 configuré
- [ ] ACM certificat HTTPS pour le domaine
- [ ] Route 53 pointe vers ALB
- [ ] Secrets Manager `sofismart/prod` rempli
- [ ] ECR repository `sofismart` créé
- [ ] ECS cluster + service Fargate opérationnel
- [ ] CloudWatch logs `/ecs/sofismart-prod`

## IAM

- [ ] Rôle execution ECS (ECR pull + logs + secrets)
- [ ] Rôle task ECS (S3 uploads — voir `deploy/aws/iam-task-policy.json`)
- [ ] Utilisateur CI/CD GitHub Actions (ECR push + ECS deploy)

## Application

- [ ] `DATABASE_URL` RDS testé
- [ ] `npx prisma migrate deploy` exécuté
- [ ] Seed production (`SEED_MODE=production`) — premier déploiement
- [ ] `AUTH_SECRET` unique (≠ staging, ≠ Vercel)
- [ ] `APP_URL` / `NEXTAUTH_URL` = domaine HTTPS réel
- [ ] `UPLOAD_STORAGE=s3` + test upload document
- [ ] CloudFront sert `/uploads/*`
- [ ] `/api/health` → status OK via ALB
- [ ] Login administrateur production OK

## E-mail & notifications

- [ ] Amazon SES vérifié (domaine + DKIM) ou SMTP configuré
- [ ] `EMAIL_TEST_MODE=false`
- [ ] Test envoi email transactionnel
- [ ] WhatsApp configuré si requis (webhook public HTTPS)

## Sécurité

- [ ] Aucun secret dans le code ou GitHub (sauf secrets chiffrés)
- [ ] RDS non exposé sur internet
- [ ] S3 bucket non public (accès via CloudFront OAC)
- [ ] `ENABLE_DEBUG_MODE=false`
- [ ] Backups RDS automatiques activés (7+ jours)

## Qualité build

- [ ] `npm run lint` OK
- [ ] `npm run type-check` OK
- [ ] `docker build` OK
- [ ] Image pushée sur ECR
- [ ] ECS rolling deploy sans erreur

## Fonctionnel

- [ ] Véhicules, achats, ventes, proformas
- [ ] Génération PDF (facture, bon sortie, livraison)
- [ ] Upload documents → S3
- [ ] Permissions RBAC par rôle
- [ ] Responsive mobile

---

**URL production :** _______________  
**Date go-live :** _______________  
**Responsable :** _______________
