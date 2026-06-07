# WhatsApp — SOFISMART

## Configuration

1. Copier les variables depuis `.env.example`.
2. Choisir le fournisseur : `WHATSAPP_PROVIDER=meta` ou `twilio`.
3. En développement : `WHATSAPP_TEST_MODE=true` (aucun appel API réel).
4. En production : `WHATSAPP_ENABLED=true` et tokens valides.

### Meta Cloud API

- Créer une application Meta Business et activer WhatsApp.
- Renseigner `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`.
- Webhook : `GET/POST {APP_URL}/api/whatsapp/webhook`.

### Twilio

- `WHATSAPP_PROVIDER=twilio`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`

## Paramétrage applicatif

**Paramètres → Notifications** : activer interne / WhatsApp par événement, rôles destinataires, test d’envoi.

**Préférences utilisateur** : `GET/PUT /api/me/notification-preferences` — consentement `whatsappOptIn`, numéro de substitution.

## Événements intégrés

- Validation / demande de validation vente
- Bon de sortie généré
- Livraison confirmée
- (extensible via `dispatchNotificationEvent`)

## Logs

`/dashboard/notifications/whatsapp-logs` — historique, statuts, relance manuelle.

## Sécurité

- Tokens uniquement côté serveur.
- Les échecs WhatsApp ne bloquent pas les transactions métier.
- Numéros masqués dans l’UI admin.
