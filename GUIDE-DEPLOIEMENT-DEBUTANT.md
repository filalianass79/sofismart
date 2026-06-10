# SOFISMART — Guide de déploiement débutant (AWS Lightsail)

> **Votre configuration actuelle**
>
> | Élément | Valeur |
> |---------|--------|
> | Instance | `sofismart-production` |
> | IP statique | `15.237.23.163` |
> | Région | Paris (eu-west-3a) |
> | OS | Ubuntu |
> | Utilisateur SSH | `ubuntu` |
> | Domaine | `app.sofismart.com` |
> | Ports ouverts | 22, 80, 443 ✓ |

Ce guide vous accompagne **étape par étape**, sans supposer de connaissances techniques avancées.

---

## Vue d'ensemble (ce qu'on va faire)

```
Vous (PC Windows)
    │
    │  SSH (terminal)
    ▼
Serveur Lightsail (Ubuntu)
    ├── Docker
    │   ├── Conteneur APP  → Next.js (port 3000)
    │   └── Conteneur DB   → PostgreSQL (base sofismart)
    ├── Nginx              → reçoit le trafic web (ports 80/443)
    └── Certbot            → certificat SSL gratuit (HTTPS)
```

**Temps estimé :** 45 à 90 minutes la première fois.

---

## ÉTAPE 0 — Ce que vous avez déjà fait ✓

- [x] Abonnement AWS Lightsail
- [x] Instance Ubuntu créée (4 Go RAM — parfait)
- [x] IP statique attachée : `15.237.23.163`
- [x] Ports 22, 80, 443 ouverts dans le firewall
- [x] Nom de domaine `sofismart.com`

**Il reste à faire :** pointer le DNS, installer l'application, configurer HTTPS.

---

## ÉTAPE 1 — Configurer le DNS (chez votre registrar)

Vous devez dire à Internet : « quand quelqu'un tape `app.sofismart.com`, envoie-le vers mon serveur Lightsail ».

1. Connectez-vous au site où vous avez acheté `sofismart.com` (OVH, Namecheap, GoDaddy, Cloudflare…).
2. Allez dans **Gestion DNS** / **Zone DNS**.
3. Ajoutez ou modifiez cet enregistrement :

| Type | Nom / Hôte | Valeur / Cible | TTL |
|------|------------|----------------|-----|
| **A** | `app` | `15.237.23.163` | 300 ou 3600 |

> Si un enregistrement `app` existe déjà avec une autre IP, **modifiez-le** pour mettre `15.237.23.163`.

4. Attendez **5 à 30 minutes** (parfois jusqu'à 2 h).

### Vérifier que le DNS fonctionne

Sur votre PC Windows, ouvrez **PowerShell** et tapez :

```powershell
nslookup app.sofismart.com
```

Vous devez voir l'adresse `15.237.23.163`. Si ce n'est pas le cas, attendez encore un peu.

---

## ÉTAPE 2 — Se connecter au serveur (SSH)

### 2.1 Télécharger la clé SSH

1. Dans Lightsail → votre instance → onglet **Connect**
2. Cliquez sur **Download default key** (fichier `.pem`)
3. Placez-le dans un dossier sûr, par exemple : `C:\Users\DELL\.ssh\lightsail-sofismart.pem`

### 2.2 Se connecter depuis Windows (PowerShell)

```powershell
ssh -i C:\Users\DELL\.ssh\lightsail-sofismart.pem ubuntu@15.237.23.163
```

> Si Windows demande « Are you sure you want to continue connecting? », tapez `yes` puis Entrée.

Vous êtes connecté quand vous voyez quelque chose comme :
```
ubuntu@ip-172-26-2-180:~$
```

**Gardez cette fenêtre ouverte** — c'est votre terminal serveur.

---

## ÉTAPE 3 — Préparer le serveur (une seule fois)

Copiez-collez ces commandes **une par une** dans le terminal SSH :

```bash
# Mettre à jour Ubuntu
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Installer Nginx, Certbot et Git
sudo apt install -y nginx certbot python3-certbot-nginx git curl

# Créer le dossier pour Certbot
sudo mkdir -p /var/www/certbot
```

**Important :** déconnectez-vous et reconnectez-vous pour que Docker fonctionne sans `sudo` :

```bash
exit
```

Puis reconnectez-vous :

```powershell
ssh -i C:\Users\DELL\.ssh\lightsail-sofismart.pem ubuntu@15.237.23.163
```

Vérifiez Docker :

```bash
docker --version
docker compose version
```

Vous devez voir des numéros de version (ex. `Docker version 27.x`).

---

## ÉTAPE 4 — Télécharger le code SOFISMART

```bash
cd /opt
sudo git clone https://github.com/filalianass79/sofismart.git
sudo chown -R ubuntu:ubuntu sofismart
cd sofismart
```

---

## ÉTAPE 5 — Créer le fichier de configuration `.env.production`

C'est le fichier qui contient **tous les secrets** (mots de passe, clés). Il ne doit **jamais** être partagé publiquement.

```bash
cp .env.production.example .env.production
nano .env.production
```

### 5.1 Générer des mots de passe sécurisés

Dans le terminal SSH, exécutez ces commandes et **notez les résultats** dans un carnet sécurisé :

```bash
# Secret d'authentification (copier le résultat)
openssl rand -base64 32

# Secret QR Code
openssl rand -hex 32

# Mot de passe base de données (exemple)
openssl rand -base64 24

# Mot de passe admin (exemple)
openssl rand -base64 16
```

### 5.2 Modifier les valeurs dans nano

Dans l'éditeur `nano`, modifiez au minimum ces lignes :

```env
APP_URL=https://app.sofismart.com
NEXTAUTH_URL=https://app.sofismart.com

AUTH_SECRET=<collez le résultat openssl rand -base64 32>
NEXTAUTH_SECRET=<même valeur que AUTH_SECRET>

POSTGRES_PASSWORD=<mot de passe fort que vous avez généré>
DATABASE_URL=postgresql://sofismart_user:<MÊME_MOT_DE_PASSE>@db:5432/sofismart?schema=public

QR_SECRET=<collez le résultat openssl rand -hex 32>

SEED_ADMIN_EMAIL=admin@sofismart.com
SEED_ADMIN_PASSWORD=<mot de passe admin 12+ caractères>

RUN_MIGRATIONS_ON_START=true
RUN_SEED_ON_START=true
```

> **Attention :** dans `DATABASE_URL`, remplacez `<MÊME_MOT_DE_PASSE>` par le **même** mot de passe que `POSTGRES_PASSWORD`.

**Sauvegarder dans nano :**
- `Ctrl + O` → Entrée (enregistrer)
- `Ctrl + X` (quitter)

### 5.3 E-mail et WhatsApp (optionnel pour commencer)

Vous pouvez laisser SMTP et WhatsApp vides au premier déploiement. L'application fonctionnera sans e-mail/WhatsApp. Configurez-les plus tard.

---

## ÉTAPE 6 — Lancer Docker (application + base de données)

```bash
cd /opt/sofismart
chmod +x scripts/*.sh
./scripts/deploy-production.sh
```

**Ce script fait automatiquement :**
1. Vérifie votre fichier `.env.production`
2. Construit l'image Docker (5 à 15 minutes la première fois)
3. Démarre PostgreSQL + l'application
4. Exécute les migrations de base de données
5. Crée le compte administrateur

### Vérifier que tout tourne

```bash
docker compose --env-file .env.production ps
```

Vous devez voir `sofismart-app` et `sofismart-db` avec le statut **running** ou **healthy**.

Test local sur le serveur :

```bash
curl http://127.0.0.1:3000/api/health
```

Réponse attendue : `{"status":"ok",...}`

---

## ÉTAPE 7 — Configurer Nginx (accès web)

### 7.1 Configuration HTTP temporaire (avant SSL)

```bash
cd /opt/sofismart
sudo cp nginx/sofismart-http-only.conf /etc/nginx/sites-available/sofismart
sudo ln -sf /etc/nginx/sites-available/sofismart /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 7.2 Tester dans le navigateur

Ouvrez : **http://app.sofismart.com**

Vous devez voir la page de connexion SOFISMART (sans le cadenas HTTPS pour l'instant).

---

## ÉTAPE 8 — Activer HTTPS (certificat SSL gratuit)

**Prérequis :** le DNS doit pointer vers `15.237.23.163` (étape 1).

```bash
sudo certbot --nginx -d app.sofismart.com
```

Répondez aux questions :
- E-mail : votre adresse (pour les alertes d'expiration)
- Conditions : `Y` (accepter)
- Partage e-mail : `N` (optionnel)
- Redirection HTTPS : choisir **2** (rediriger tout le HTTP vers HTTPS)

### Installer la config Nginx finale

```bash
cd /opt/sofismart
sudo cp nginx/sofismart.conf /etc/nginx/sites-available/sofismart
sudo nginx -t
sudo systemctl reload nginx
```

### Tester HTTPS

Ouvrez : **https://app.sofismart.com**

Vous devez voir le **cadenas** dans la barre d'adresse.

---

## ÉTAPE 9 — Se connecter à l'application

| Champ | Valeur |
|-------|--------|
| URL | https://app.sofismart.com/login |
| E-mail | `admin@sofismart.com` (ou ce que vous avez mis dans `SEED_ADMIN_EMAIL`) |
| Mot de passe | valeur de `SEED_ADMIN_PASSWORD` |

**Changez ce mot de passe** dès la première connexion : Profil → Changer le mot de passe.

---

## ÉTAPE 10 — Désactiver le seed automatique (sécurité)

Après le premier déploiement réussi, le script `deploy-production.sh` désactive normalement :

```env
RUN_MIGRATIONS_ON_START=false
RUN_SEED_ON_START=false
```

Vérifiez dans `.env.production`. Si c'est encore `true`, modifiez :

```bash
nano .env.production
# Mettre RUN_MIGRATIONS_ON_START=false et RUN_SEED_ON_START=false
docker compose --env-file .env.production up -d
```

---

## Commandes utiles au quotidien

```bash
# Voir les logs de l'application
docker compose --env-file .env.production logs -f app

# Redémarrer l'application
docker compose --env-file .env.production restart app

# État des conteneurs
docker compose --env-file .env.production ps

# Sauvegarde base + fichiers
./scripts/backup-db.sh

# Mettre à jour après un git pull
cd /opt/sofismart
git pull origin main
docker compose --env-file .env.production up -d --build
```

---

## Dépannage (problèmes fréquents)

### « Ce site est inaccessible » / DNS

```powershell
nslookup app.sofismart.com
```

→ Doit retourner `15.237.23.163`. Sinon, vérifiez l'enregistrement A chez votre registrar.

### « 502 Bad Gateway »

L'application n'est pas encore démarrée ou a planté :

```bash
docker compose --env-file .env.production logs app --tail 100
docker compose --env-file .env.production restart app
```

Attendez 1 à 2 minutes après un redémarrage.

### « Permission denied » avec Docker

```bash
sudo usermod -aG docker ubuntu
exit
# Reconnectez-vous en SSH
```

### Build Docker très long ou échoue (mémoire)

Votre instance 4 Go est suffisante. Si le build échoue :

```bash
# Ajouter du swap temporaire
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
# Relancer le build
./scripts/deploy-production.sh
```

### Mot de passe admin oublié

```bash
cd /opt/sofismart
docker compose --env-file .env.production exec app npx tsx scripts/reset-admin-password.ts
```

### Certbot échoue

- Vérifiez que le port 80 est ouvert dans Lightsail (Networking → Firewall)
- Vérifiez que `app.sofismart.com` pointe bien vers `15.237.23.163`
- Utilisez d'abord `sofismart-http-only.conf` (étape 7.1)

---

## Sauvegardes automatiques (recommandé)

Planifier une sauvegarde chaque nuit à 2h :

```bash
crontab -e
```

Ajoutez cette ligne :

```
0 2 * * * cd /opt/sofismart && ./scripts/backup-db.sh >> /var/log/sofismart-backup.log 2>&1
```

Sauvegardes stockées dans `/opt/sofismart/backups/`.

---

## Récapitulatif de votre infrastructure

| Composant | Où ça tourne | Accès |
|-----------|--------------|-------|
| Site web | Nginx → Docker app | https://app.sofismart.com |
| Base PostgreSQL | Docker `sofismart-db` | Interne uniquement (sécurisé) |
| Fichiers uploadés | Volume Docker | Persistant après redémarrage |
| SSL | Let's Encrypt / Certbot | Renouvellement auto |

---

## Besoin d'aide ?

Quand vous bloquez, envoyez-moi :
1. **L'étape** où vous êtes
2. **La commande** exécutée
3. **Le message d'erreur** complet (copier-coller)

Je pourrai vous guider précisément.
