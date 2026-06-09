# Notifications email SOFISMART

Module d'envoi d'emails transactionnels, indépendant des notifications internes et WhatsApp.

## Activation

1. Copier les variables depuis `.env.example` ou `.env.production.example`.
2. Définir `EMAIL_ENABLED=true`.
3. Choisir le provider : `EMAIL_PROVIDER=smtp` ou `resend`.
4. En développement, laisser `EMAIL_TEST_MODE=true` pour simuler les envois sans SMTP.

## SMTP (recommandé pour démarrer)

```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp
EMAIL_TEST_MODE=false
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-utilisateur
SMTP_PASS=votre-mot-de-passe
SMTP_FROM_NAME=SOFISMART
SMTP_FROM_EMAIL=contact@sofismart.com
SMTP_REPLY_TO=contact@sofismart.com
```

Testez la connexion depuis **Paramètres → Email** ou via `POST /api/emails/provider/test-connection`.

## Resend

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxx
SMTP_FROM_EMAIL=onboarding@resend.dev
```

## Architecture

```
src/lib/notifications/email/
├── email-dispatcher.ts      # dispatchEmailEvent — résolution destinataires + templates
├── email-log.service.ts     # journal + retry
├── email.service.ts         # factory provider
├── email-renderer.ts        # layout HTML SOFISMART
├── providers/
│   ├── smtp.provider.ts
│   └── resend.provider.ts
```

Les événements métier passent par `dispatchNotificationEvent` qui déclenche aussi l'email via `buildEmailContextFromNotification`.

## Paramétrage UI

| Page                                      | Description                |
| ----------------------------------------- | -------------------------- |
| `/dashboard/settings/email-notifications` | Provider, test, événements |
| `/dashboard/settings/email-templates`     | Templates HTML             |
| `/dashboard/emails/logs`                  | Historique et retry        |
| `/dashboard/profile`                      | Préférences utilisateur    |

## Seed

```bash
npm run db:seed
```

Crée les `EmailNotificationSetting` et `EmailTemplate` par défaut (`prisma/seed-emails.ts`).

## Pièces jointes

Les PDF locaux (`/uploads/...`) sont lus depuis `UPLOAD_DIR` (défaut `public/uploads`). Activez **Pièces jointes** sur l'événement concerné (ex. `EXIT_VOUCHER_GENERATED`).

## Sécurité

- Clés SMTP/API **uniquement** côté serveur (variables d'environnement).
- `EMAIL_TEST_MODE=true` : aucun envoi réel, statut SENT simulé.
- Les emails de sécurité (`PASSWORD_RESET`, etc.) ignorent la désactivation utilisateur.
- Mot de passe temporaire : contrôlé par `SEND_TEMP_PASSWORD_BY_EMAIL=false` par défaut.

## Permissions RBAC

Module `emails` : `view`, `create`, `edit` (GERANT par défaut).
