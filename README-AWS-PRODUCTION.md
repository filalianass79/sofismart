# SOFISMART — Déploiement production AWS

Guide pour héberger la version **professionnelle** sur Amazon Web Services, indépendante du staging Vercel/Neon.

## Architecture recommandée

```
Route 53 (DNS)
    ↓
ACM (certificat HTTPS)
    ↓
Application Load Balancer
    ↓
ECS Fargate (conteneur Next.js)
    ├── Amazon RDS PostgreSQL
    ├── Amazon S3 (uploads / documents)
    ├── CloudFront (CDN fichiers — optionnel)
    ├── Secrets Manager (variables sensibles)
    └── Amazon SES (e-mails transactionnels)
```

| Composant       | Service AWS                    | Rôle                                 |
| --------------- | ------------------------------ | ------------------------------------ |
| Application     | **ECS Fargate**                | Next.js standalone (Docker)          |
| Base de données | **RDS PostgreSQL 16**          | Données métier                       |
| Fichiers        | **S3** + CloudFront            | Uploads persistants                  |
| Secrets         | **Secrets Manager**            | `DATABASE_URL`, `AUTH_SECRET`, SMTP… |
| E-mail          | **SES** ou SMTP externe        | Notifications                        |
| CI/CD           | **GitHub Actions** → ECR → ECS | Déploiement automatisé               |

**Région suggérée :** `eu-west-3` (Paris)

---

## 1. Prérequis

- Compte AWS avec droits admin ou équivalent
- AWS CLI configuré (`aws configure`)
- Docker installé en local
- Dépôt GitHub : `filalianass79/sofismart`

---

## 2. Base de données — RDS PostgreSQL

1. Console RDS → **Create database**
2. Engine : PostgreSQL 16
3. Template : Production
4. DB identifier : `sofismart-prod`
5. Master username / password (noter pour `DATABASE_URL`)
6. Instance : `db.t4g.small` minimum (prod réelle : `db.t4g.medium+`)
7. Storage : 20 Go gp3, autoscaling activé
8. VPC : privée, **pas** d'accès public
9. Security group : autoriser port **5432** depuis le security group ECS uniquement

Connection string :

```
postgresql://sofismart:PASSWORD@sofismart-prod.xxxxx.eu-west-3.rds.amazonaws.com:5432/sofismart?schema=public&sslmode=require
```

---

## 3. Stockage — S3 + CloudFront

```bash
aws s3 mb s3://sofismart-prod-uploads --region eu-west-3
```

1. Créer un bucket `sofismart-prod-uploads`
2. Bloquer l'accès public direct
3. Créer une distribution **CloudFront** avec origine S3
4. Domaine CDN : `https://cdn.sofismart.com` → `AWS_S3_PUBLIC_BASE_URL`

Variables :

```env
UPLOAD_STORAGE=s3
AWS_S3_BUCKET=sofismart-prod-uploads
AWS_S3_REGION=eu-west-3
AWS_S3_PUBLIC_BASE_URL=https://cdn.sofismart.com
```

Le rôle IAM ECS (task role) doit avoir `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` sur le bucket (voir `deploy/aws/iam-task-policy.json`).

---

## 4. Secrets Manager

Créer un secret `sofismart/prod` (JSON) :

```json
{
  "DATABASE_URL": "postgresql://...",
  "AUTH_SECRET": "...",
  "APP_URL": "https://app.sofismart.com",
  "NEXTAUTH_URL": "https://app.sofismart.com",
  "AWS_S3_PUBLIC_BASE_URL": "https://cdn.sofismart.com",
  "SMTP_HOST": "email-smtp.eu-west-3.amazonaws.com",
  "SMTP_USER": "...",
  "SMTP_PASS": "..."
}
```

Modèle complet : `.env.aws.example`

---

## 5. Build & push image Docker (ECR)

```bash
chmod +x deploy/aws/push-ecr.sh
./deploy/aws/push-ecr.sh eu-west-3 sofismart
```

Ou manuellement :

```bash
aws ecr create-repository --repository-name sofismart --region eu-west-3
docker build -t sofismart .
# tag + push vers ECR...
```

---

## 6. ECS Fargate

### Cluster

```bash
aws ecs create-cluster --cluster-name sofismart-prod --region eu-west-3
```

### Task definition

1. Remplacer `ACCOUNT_ID` et `REGION` dans `deploy/aws/ecs-task-definition.json`
2. Enregistrer :

```bash
aws ecs register-task-definition --cli-input-json file://deploy/aws/ecs-task-definition.json
```

### Service

- Type : Fargate, 1–2 tâches minimum
- Réseau : subnets privés + NAT Gateway
- Load balancer : ALB cible port 3000
- Health check ALB : `/api/health`

### IAM

- **Execution role** : `AmazonECSTaskExecutionRolePolicy` + lecture Secrets Manager
- **Task role** : politique S3 (`deploy/aws/iam-task-policy.json`)

---

## 7. Premier déploiement — migrations & admin

Option A — tâche one-shot ECS avec :

```env
RUN_MIGRATIONS_ON_START=true
RUN_SEED_ON_START=true
SEED_MODE=production
SEED_ADMIN_EMAIL=admin@sofismart.com
SEED_ADMIN_PASSWORD=VotreMotDePasseFort12!
```

Option B — depuis votre machine (bastion / VPN vers RDS) :

```bash
cp .env.aws.example .env.production
# éditer DATABASE_URL
npx prisma migrate deploy
SEED_MODE=production npm run db:seed
```

Puis remettre `RUN_MIGRATIONS_ON_START=false`.

---

## 8. GitHub Actions (CI/CD)

Secrets GitHub (Settings → Secrets) :

| Secret                  | Description                 |
| ----------------------- | --------------------------- |
| `AWS_ACCESS_KEY_ID`     | Utilisateur IAM déploiement |
| `AWS_SECRET_ACCESS_KEY` | Clé secrète                 |

Workflow : `.github/workflows/aws-production.yml`

Déclenchement : push sur `main` ou manuel (`workflow_dispatch`).

---

## 9. Variables d'environnement production

Fichier modèle : **`.env.aws.example`**

Variables critiques :

| Variable                   | Obligatoire    |
| -------------------------- | -------------- |
| `DATABASE_URL`             | ✓              |
| `AUTH_SECRET`              | ✓ (32+ chars)  |
| `APP_URL` / `NEXTAUTH_URL` | ✓ HTTPS        |
| `UPLOAD_STORAGE=s3`        | ✓              |
| `AWS_S3_BUCKET`            | ✓              |
| `AWS_S3_PUBLIC_BASE_URL`   | ✓ (CloudFront) |
| `EMAIL_ENABLED=true`       | ✓              |
| `ENABLE_DEBUG_MODE=false`  | ✓              |

---

## 10. Alternative : EC2 + Docker Compose

Pour un démarrage plus simple (PME) :

```bash
# Sur EC2 Ubuntu avec Docker
git clone https://github.com/filalianass79/sofismart.git
cp .env.aws.example .env
# UPLOAD_STORAGE=local + volume EBS si pas de S3
docker compose -f docker-compose.prod.yml up -d --build
```

Utiliser RDS externe (pas le conteneur `db` du compose) en production réelle.

---

## 11. Checklist

Voir [AWS-DEPLOYMENT-CHECKLIST.md](./AWS-DEPLOYMENT-CHECKLIST.md)

---

## Séparation des environnements

|             | STAGING          | PRODUCTION AWS      |
| ----------- | ---------------- | ------------------- |
| Hébergement | Vercel           | ECS Fargate         |
| Base        | Neon             | RDS PostgreSQL      |
| Fichiers    | Local (éphémère) | S3 + CloudFront     |
| Domaine     | `*.vercel.app`   | `app.sofismart.com` |
| Données     | Fictives         | Réelles             |

**Ne jamais partager** `DATABASE_URL`, buckets S3 ou secrets entre staging et production.
