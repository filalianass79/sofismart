# WhatsApp Production — SOFISMART

Guide de déploiement du module notifications WhatsApp via **Meta WhatsApp Cloud API**.

## 1. Prérequis Meta Business

1. Créer un compte [Meta Business Suite](https://business.facebook.com).
2. Créer une application sur [developers.facebook.com](https://developers.facebook.com).
3. Ajouter le produit **WhatsApp** à l'application.
4. Lier un numéro de téléphone professionnel (Phone Number ID).

## 2. Récupérer les identifiants

| Variable | Où la trouver |
|----------|----------------|
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp → API Setup → Phone number ID |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WhatsApp → API Setup → WhatsApp Business Account ID |
| `WHATSAPP_ACCESS_TOKEN` | Token système ou utilisateur permanent (System User recommandé en prod) |
| `WHATSAPP_VERIFY_TOKEN` | Chaîne secrète que vous définissez pour le webhook |
| `WHATSAPP_APP_SECRET` | Paramètres app → Basic → App Secret (signature webhook) |

## 3. Variables `.env.production`

```env
WHATSAPP_ENABLED=true
WHATSAPP_PROVIDER=meta
WHATSAPP_API_VERSION=v20.0
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_DEFAULT_COUNTRY_CODE=212
WHATSAPP_TEST_MODE=false
WHATSAPP_MAX_RETRIES=3
WHATSAPP_RETRY_DELAY_SECONDS=60
```

**Ne jamais** exposer `WHATSAPP_ACCESS_TOKEN` côté frontend.

## 4. Webhook Meta

URL de callback (production) :

```text
https://app.sofismart.com/api/whatsapp/webhook
```

- **Verify token** : valeur de `WHATSAPP_VERIFY_TOKEN`
- Abonnements : `messages` (statuts sent, delivered, read, failed)

Nginx est déjà configuré dans `nginx/sofismart.conf`.

## 5. Templates WhatsApp (Meta)

En production, créez et faites **approuver** ces templates dans Meta Business Manager (langue `fr`) :

| Clé SOFISMART | Nom Meta suggéré |
|---------------|------------------|
| `sale_validation_request` | Demande validation vente |
| `sale_validated_warehouse` | Vente validée dépôt |
| `exit_voucher_generated` | Bon de sortie généré |
| `delivery_confirmed` | Livraison confirmée |
| `purchase_validation_request` | Demande validation achat |
| `payment_overdue_alert` | Alerte paiement retard |

Synchronisez les noms Meta dans **Paramètres → WhatsApp** ou via seed :

```bash
docker compose --env-file .env.production --profile migrate run --rm migrator npx tsx prisma/seed-whatsapp-only.ts
```

Si le template Meta n'est pas encore approuvé, SOFISMART envoie un **message texte** de repli (mode test ou fenêtre 24h).

## 6. Salariés — consentement

Chaque salarié doit avoir dans sa fiche :

- **Téléphone WhatsApp** (format `2126XXXXXXXX`)
- **Notifications WhatsApp activées**
- **Consentement WhatsApp** coché

Sans consentement + numéro, aucun WhatsApp n'est envoyé.

## 7. Test d'envoi

1. **Paramètres → WhatsApp** dans l'application
2. Vérifier le statut provider (Connecté)
3. Envoyer un test au numéro `2126XXXXXXXX`

Ou en CLI :

```bash
curl -X POST https://app.sofismart.com/api/whatsapp/send-test \
  -H "Cookie: ..." \
  -H "Content-Type: application/json" \
  -d '{"phone":"212600000000","message":"Test SOFISMART"}'
```

## 8. Événements métier intégrés

| Événement | Destinataires typiques |
|-----------|------------------------|
| `SALE_VALIDATION_REQUEST` | Gérant, Admin, Directeur |
| `SALE_VALIDATED` | Magasinier, Commercial |
| `EXIT_VOUCHER_GENERATED` | Magasinier du dépôt |
| `DELIVERY_CONFIRMED` | Commercial, Gérant |
| `PURCHASE_VALIDATION_REQUEST` | Gérant, Admin |
| `PAYMENT_OVERDUE` | Comptable, Gérant |

Les échecs WhatsApp **ne bloquent jamais** validation vente, achat, bon de sortie, etc.

## 9. Logs et retry

- **Logs** : `/dashboard/notifications/whatsapp-logs`
- Retry automatique : `WHATSAPP_MAX_RETRIES` (défaut 3)
- Retry manuel : bouton dans les logs (permission `whatsapp.edit`)

## 10. Dépannage

| Problème | Solution |
|----------|----------|
| Aucun message reçu | Vérifier consentement salarié + `WHATSAPP_ENABLED=true` |
| Erreur template | Template Meta non approuvé → message texte de repli |
| Webhook 403 | `WHATSAPP_VERIFY_TOKEN` incorrect |
| Signature invalide | Configurer `WHATSAPP_APP_SECRET` |
| Mode test actif | `WHATSAPP_TEST_MODE=false` en production |

## 11. Architecture

```text
src/lib/whatsapp/
  whatsapp.provider.ts       # Configuration
  meta-whatsapp.provider.ts  # Meta Cloud API (text + template)
  whatsapp-template.service.ts
  whatsapp.service.ts        # Envoi + logs + retry
  whatsapp-dispatcher.ts     # Événements métier
  whatsapp-queue.ts          # Queue async non bloquante
```

Documentation complémentaire : `docs/WHATSAPP.md`
