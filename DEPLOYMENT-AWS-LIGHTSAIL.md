# SOFISMART — Déploiement AWS Lightsail (Ubuntu + Docker)

> **Débutant ?** Commencez par **[GUIDE-DEPLOIEMENT-DEBUTANT.md](./GUIDE-DEPLOIEMENT-DEBUTANT.md)** — guide pas à pas avec votre IP `15.237.23.163` et le domaine `app.sofismart.com`.

Guide complet pour héberger SOFISMART en production sur un serveur **AWS Lightsail** avec Docker, PostgreSQL, Nginx et HTTPS.

---

## Architecture

```
Internet
   ↓
Nginx (443 HTTPS) — Ubuntu hôte
   ↓
Docker : app (Next.js :3000)
   ↓
Docker : db (PostgreSQL 16)
   ↓
Volumes persistants (DB + uploads)
```

| Composant   | Technologie                       |
| ----------- | --------------------------------- |
| Serveur     | AWS Lightsail Ubuntu 22.04+       |
| Application | Next.js 15 (standalone Docker)    |
| Base        | PostgreSQL 16 (conteneur)         |
| Proxy       | Nginx + Let's Encrypt (Certbot)   |
| Fichiers    | Volume Docker `sofismart_uploads` |

---

## 1. Créer l'instance Lightsail

1. Console [AWS Lightsail](https://lightsail.aws.amazon.com)
2. **Create instance**
3. Plateforme : **Linux/Ubuntu 22.04 LTS**
4. Plan : **2 Go RAM minimum** (recommandé 4 Go pour OCR/PDF)
5. Nom : `sofismart-prod`
6. Télécharger la clé SSH

### Ouvrir les ports (Networking → Firewall)

| Port | Protocole | Usage                     |
| ---- | --------- | ------------------------- |
| 22   | TCP       | SSH                       |
| 80   | TCP       | HTTP (Certbot + redirect) |
| 443  | TCP       | HTTPS                     |

---

## 2. Préparer le serveur

```bash
ssh -i votre-cle.pem ubuntu@VOTRE_IP_LIGHTSAIL

# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Nginx + Certbot
sudo apt install -y nginx certbot python3-certbot-nginx git

# Reconnexion SSH pour le groupe docker
exit
```

Reconnectez-vous en SSH.

---

## 3. Cloner le projet

```bash
cd /opt
sudo git clone https://github.com/filalianass79/sofismart.git
sudo chown -R ubuntu:ubuntu sofismart
cd sofismart
```

---

## 4. Configurer l'environnement

```bash
cp .env.production.example .env.production
nano .env.production
```

**Variables obligatoires à modifier :**

```env
APP_URL=https://app.sofismart.com
NEXTAUTH_URL=https://app.sofismart.com
AUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_SECRET=<même valeur>
POSTGRES_PASSWORD=<mot de passe fort>
SEED_ADMIN_PASSWORD=<12+ caractères>
QR_SECRET=<openssl rand -hex 32>
```

Générer des secrets :

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 32      # QR_SECRET
```

---

## 5. Déployer avec Docker

```bash
chmod +x scripts/*.sh
./scripts/deploy-production.sh
```

Ou manuellement :

```bash
docker compose --env-file .env.production up -d --build
```

Vérifier :

```bash
curl http://127.0.0.1:3000/api/health
docker compose --env-file .env.production logs -f app
```

Après le premier déploiement réussi, le script désactive automatiquement :

```
RUN_MIGRATIONS_ON_START=false
RUN_SEED_ON_START=false
```

---

## 6. Configurer Nginx

### Étape A — HTTP seul (avant SSL)

```bash
sudo cp nginx/sofismart-http-only.conf /etc/nginx/sites-available/sofismart
sudo ln -sf /etc/nginx/sites-available/sofismart /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### Étape B — DNS

Chez votre registrar, créer un enregistrement **A** :

```
app.sofismart.com  →  IP_PUBLIQUE_LIGHTSAIL
```

### Étape C — Certificat SSL

```bash
sudo certbot --nginx -d app.sofismart.com
```

### Étape D — Configuration HTTPS finale

```bash
sudo cp nginx/sofismart.conf /etc/nginx/sites-available/sofismart
sudo nginx -t && sudo systemctl reload nginx
```

Renouvellement automatique (cron Certbot) :

```bash
sudo certbot renew --dry-run
```

---

## 7. Connexion administrateur

Après le premier seed (`RUN_SEED_ON_START=true`) :

| Champ        | Valeur                                        |
| ------------ | --------------------------------------------- |
| URL          | https://app.sofismart.com/login               |
| Email        | `admin@sofismart.com` (ou `SEED_ADMIN_EMAIL`) |
| Mot de passe | valeur de `SEED_ADMIN_PASSWORD`               |

---

## 8. WhatsApp webhook

Meta doit pouvoir joindre :

```
https://app.sofismart.com/api/whatsapp/webhook
```

Variables dans `.env.production` :

```env
WHATSAPP_ENABLED=true
WHATSAPP_VERIFY_TOKEN=<votre_token>
WHATSAPP_ACCESS_TOKEN=<token_meta>
WHATSAPP_PHONE_NUMBER_ID=<id>
```

---

## 9. Sauvegardes

### Sauvegarde manuelle

```bash
./scripts/backup-db.sh
```

Fichiers dans `backups/` :

- `sofismart_db_YYYYMMDD_HHMMSS.sql.gz`
- `sofismart_uploads_YYYYMMDD_HHMMSS.tar.gz`

### Cron quotidien (2h du matin)

```bash
crontab -e
```

```
0 2 * * * cd /opt/sofismart && ./scripts/backup-db.sh >> /var/log/sofismart-backup.log 2>&1
```

### Restauration

```bash
./scripts/restore-db.sh backups/sofismart_db_20260101_020000.sql.gz backups/sofismart_uploads_20260101_020000.tar.gz
```

---

## 10. Mise à jour application

```bash
cd /opt/sofismart
git pull origin main
docker compose --env-file .env.production build --no-cache
docker compose --env-file .env.production up -d
```

---

## 11. Commandes utiles

```bash
# Logs
docker compose --env-file .env.production logs -f app

# État
docker compose --env-file .env.production ps

# Migrations manuelles
docker compose --env-file .env.production exec app npx prisma migrate deploy

# Shell base
docker compose --env-file .env.production exec db psql -U sofismart_user -d sofismart

# Redémarrer
docker compose --env-file .env.production restart app
```

---

## 12. Développement local (séparé)

Le développement local utilise `docker-compose.dev.yml` (PostgreSQL seul) :

```bash
docker compose -f docker-compose.dev.yml up -d
npm run dev
```

---

## 13. Coûts Lightsail estimés

| Plan       | RAM  | Prix/mois |
| ---------- | ---- | --------- |
| Minimum    | 2 Go | ~12 $     |
| Recommandé | 4 Go | ~24 $     |
| Confort    | 8 Go | ~44 $     |

---

## 14. Dépannage

| Problème             | Solution                                       |
| -------------------- | ---------------------------------------------- |
| 502 Bad Gateway      | `docker compose logs app` — attendre démarrage |
| DB connexion refusée | Vérifier `DATABASE_URL` et healthcheck db      |
| Upload échoue        | Vérifier `client_max_body_size 50M` dans Nginx |
| SSL erreur           | `sudo certbot renew`                           |
| QR pointe localhost  | Vérifier `APP_URL` dans `.env.production`      |
| WhatsApp webhook 401 | Vérifier `WHATSAPP_VERIFY_TOKEN`               |

---

## Fichiers du projet

| Fichier                             | Rôle                            |
| ----------------------------------- | ------------------------------- |
| `docker-compose.yml`                | Production Lightsail (app + db) |
| `docker-compose.dev.yml`            | Dev local (db seul)             |
| `Dockerfile`                        | Image production Next.js        |
| `.env.production.example`           | Template variables              |
| `nginx/sofismart.conf`              | Nginx HTTPS                     |
| `nginx/sofismart-http-only.conf`    | Nginx avant SSL                 |
| `scripts/deploy-production.sh`      | Déploiement automatisé          |
| `scripts/backup-db.sh`              | Sauvegarde                      |
| `scripts/restore-db.sh`             | Restauration                    |
| `LIGHTSAIL-DEPLOYMENT-CHECKLIST.md` | Checklist go-live               |
