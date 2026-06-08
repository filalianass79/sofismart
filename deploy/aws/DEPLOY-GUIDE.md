# Guide pas à pas — Déploiement AWS SOFISMART

## Étape 0 — Prérequis (15 min)

### 0.1 Compte AWS
- Créer un compte sur [aws.amazon.com](https://aws.amazon.com)
- Activer la facturation (carte bancaire requise)

### 0.2 Installer les outils (Windows)

```powershell
winget install Amazon.AWSCLI
winget install Docker.DockerDesktop
```

Redémarrer le terminal après installation.

### 0.3 Configurer AWS CLI

```powershell
aws configure
```

| Prompt | Valeur |
|--------|--------|
| AWS Access Key ID | Clé IAM (voir 0.4) |
| AWS Secret Access Key | Secret IAM |
| Default region | `eu-west-3` |
| Default output format | `json` |

### 0.4 Créer un utilisateur IAM pour le déploiement

Console AWS → **IAM** → **Users** → **Create user**

1. Nom : `sofismart-deploy`
2. Permissions : attacher `AdministratorAccess` (démarrage rapide)  
   *Ou politiques minimales : CloudFormation, ECS, ECR, RDS, S3, IAM, ELB, SecretsManager, Logs*
3. **Security credentials** → **Create access key** → CLI
4. Copier Access Key + Secret dans `aws configure`

Vérifier :

```powershell
aws sts get-caller-identity
```

---

## Étape 1 — Déployer l'infrastructure (1 clic)

Depuis la racine du projet :

```powershell
cd c:\Users\DELL\APP-SOFISMART\sofismart
.\deploy\aws\setup-aws.ps1 -Phase infra
```

**Ce script crée automatiquement :**

| Ressource | Détail |
|-----------|--------|
| RDS PostgreSQL 16 | `db.t4g.micro`, 20 Go, backups 7j |
| S3 | `sofismart-prod-uploads-{accountId}` |
| ECR | Repository `sofismart` |
| ECS Cluster | `sofismart-prod` |
| ALB | Load balancer HTTP port 80 |
| Secrets Manager | `sofismart/prod` (DATABASE_URL, AUTH_SECRET…) |
| IAM Roles | Execution + Task (accès S3) |

⏱ **Durée : 10–15 minutes** (RDS est le plus long)

Les mots de passe générés sont sauvegardés dans :
`%TEMP%\sofismart-aws-creds.json` — **conservez ce fichier en lieu sûr !**

---

## Étape 2 — Build & déployer l'application

**Docker Desktop doit être démarré.**

```powershell
.\deploy\aws\setup-aws.ps1 -Phase app
```

Ce script :
1. Build l'image Docker SOFISMART
2. Push vers Amazon ECR
3. Démarre le service ECS Fargate
4. Exécute les migrations Prisma (`RUN_MIGRATIONS_ON_START=true`)
4. Crée l'admin (`RUN_SEED_ON_START=true`, `SEED_MODE=production`)

⏱ **Durée : 10–20 minutes**

À la fin, vous obtenez l'URL :

```
http://sofismart-alb-XXXXXXXX.eu-west-3.elb.amazonaws.com
```

Testez : `http://VOTRE-ALB/api/health` → `"status":"ok"`

---

## Étape 3 — Tout en une commande

```powershell
.\deploy\aws\setup-aws.ps1 -Phase all
```

---

## Étape 4 — Vérifier le déploiement

```powershell
.\deploy\aws\setup-aws.ps1 -Phase status
```

Ou manuellement :

```powershell
# Health check
$alb = aws cloudformation describe-stacks --stack-name sofismart-prod --region eu-west-3 `
  --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" --output text
Invoke-WebRequest "http://$alb/api/health"

# Logs ECS
aws logs tail /ecs/sofismart-prod --follow --region eu-west-3
```

---

## Étape 5 — Connexion administrateur

Après le premier déploiement, l'admin est créé via le seed production.

Par défaut (à configurer dans Secrets Manager ou variables ECS) :

- Email : `admin@sofismart.ma`
- Mot de passe : défini via `SEED_ADMIN_PASSWORD` dans le secret

Pour définir le mot de passe admin, mettez à jour le secret :

```powershell
aws secretsmanager update-secret --secret-id sofismart/prod --region eu-west-3 `
  --secret-string '{"SEED_ADMIN_PASSWORD":"VotreMotDePasse12!","SEED_ADMIN_EMAIL":"admin@sofismart.ma",...}'
```

Puis redéployez avec `RUN_SEED_ON_START=true` une fois.

---

## Étape 6 — Domaine & HTTPS (optionnel)

### 6.1 Certificat ACM

Console → **Certificate Manager** (région **eu-west-3**)
- Demander un certificat pour `app.sofismart.ma`
- Validation DNS (Route 53 ou votre registrar)

### 6.2 Listener HTTPS sur l'ALB

Console → **EC2** → **Load Balancers** → `sofismart-alb`
- Ajouter listener **HTTPS:443** avec le certificat ACM
- Rediriger HTTP → HTTPS

### 6.3 DNS

Route 53 ou votre registrar :
```
app.sofismart.ma  CNAME  sofismart-alb-XXXX.eu-west-3.elb.amazonaws.com
```

### 6.4 Mettre à jour les URLs

```powershell
aws secretsmanager update-secret --secret-id sofismart/prod --region eu-west-3 `
  --secret-string (Get-Content .env.aws.production.json -Raw)
```

Variables à changer :
```
APP_URL=https://app.sofismart.ma
NEXTAUTH_URL=https://app.sofismart.ma
```

Redéployer ECS :
```powershell
aws ecs update-service --cluster sofismart-prod --service sofismart-app `
  --force-new-deployment --region eu-west-3
```

---

## Étape 7 — CloudFront pour les fichiers S3 (optionnel)

1. Console **CloudFront** → Create distribution
2. Origin : bucket `sofismart-prod-uploads-{accountId}`
3. Domaine : `cdn.sofismart.ma`
4. Mettre à jour `AWS_S3_PUBLIC_BASE_URL` dans le secret

---

## Coûts estimés (eu-west-3)

| Service | Coût mensuel estimé |
|---------|---------------------|
| RDS db.t4g.micro | ~15–20 € |
| ECS Fargate 1 vCPU / 2 Go | ~25–35 € |
| ALB | ~20 € |
| S3 + transfert | ~2–5 € |
| **Total démarrage** | **~60–80 €/mois** |

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `aws configure` non fait | Étape 0.3 |
| Docker non démarré | Lancer Docker Desktop |
| ECS service unhealthy | `aws logs tail /ecs/sofismart-prod --follow` |
| RDS connexion refusée | Vérifier security groups (ECS → RDS port 5432) |
| 502 Bad Gateway | Attendre 2–3 min (démarrage conteneur) |
| Image ECR introuvable | Relancer `-Phase app` |

---

## Commandes utiles

```powershell
# Redéployer après modification code
.\deploy\aws\setup-aws.ps1 -Phase app

# Migrations manuelles
$env:DATABASE_URL="postgresql://..." 
npx prisma migrate deploy

# Supprimer toute l'infra (ATTENTION)
aws cloudformation delete-stack --stack-name sofismart-prod --region eu-west-3
```

---

## Fichiers du projet

| Fichier | Rôle |
|---------|------|
| `deploy/aws/setup-aws.ps1` | Script principal |
| `deploy/aws/cloudformation/sofismart-prod.yaml` | Infrastructure IaC |
| `.env.aws.example` | Variables production |
| `README-AWS-PRODUCTION.md` | Documentation complète |
| `AWS-DEPLOYMENT-CHECKLIST.md` | Checklist go-live |
