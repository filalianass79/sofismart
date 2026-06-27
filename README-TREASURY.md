# Module Trésorerie / Gestion de caisse — SOFISMART

## Vue d'ensemble

Module de trésorerie pour gérer les caisses employés, dépôts et caisse principale : mouvements (crédit/débit), transferts avec validation de réception, journal, exports et notifications.

## Accès

| Page | URL |
|------|-----|
| Tableau de bord | `/dashboard/treasury` |
| Liste caisses | `/dashboard/treasury/cashboxes` |
| Nouvelle caisse | `/dashboard/treasury/cashboxes/new` |
| Détail caisse | `/dashboard/treasury/cashboxes/[id]` |
| Journal | `/dashboard/treasury/cashboxes/[id]/journal` |
| Transferts | `/dashboard/treasury/cash-transfers` |

## Permissions RBAC (`caisse.*`)

| Permission | Description |
|------------|-------------|
| `caisse.view` | Voir ses caisses (ou toutes si validate/export) |
| `caisse.create` | Créer caisses, créditer, débiter, transférer |
| `caisse.edit` | Modifier, bloquer, fermer |
| `caisse.validate` | Valider mouvements, accepter/refuser transferts |
| `caisse.export` | Exports PDF / Excel du journal |

## Types de caisse

- **EMPLOYEE** — Caisse personnelle salarié
- **DEPOT** — Caisse rattachée à un dépôt
- **MAIN** — Caisse centrale société
- **TEMPORARY** — Missions, avances, convoyage

## Règles métier

1. Solde = somme des mouvements **VALIDATED** (stocké dans `currentBalance` + `balanceBefore`/`balanceAfter` par mouvement).
2. Transfert : débit immédiat source → crédit destination après **acceptation** du destinataire.
3. Refus transfert → contrepassation (REVERSAL) sur la caisse source.
4. Annulation mouvement validé → contrepassation, jamais de suppression.
5. Opérations transactionnelles Prisma (`$transaction`).

## API

```
GET/POST     /api/treasury/cashboxes
GET/PUT      /api/treasury/cashboxes/:id
POST         /api/treasury/cashboxes/:id/credit|debit|block|close
GET          /api/treasury/cashboxes/:id/journal
GET          /api/treasury/cashboxes/:id/journal/export/pdf|excel
POST         /api/treasury/transfers
GET          /api/treasury/transfers/:id
POST         /api/treasury/transfers/:id/accept|reject
POST         /api/treasury/movements/:id/validate|cancel
GET          /api/treasury/dashboard
GET          /api/treasury/categories
POST         /api/treasury/movements/:id/documents
```

## Migration & seed

```bash
npx prisma migrate deploy
npx prisma db seed   # inclut catégories caisse via seed-treasury.ts
```

Migration : `prisma/migrations/20250611120000_treasury_cashbox_module/`

## Notifications

Événements : `CASH_TRANSFER_PENDING`, `CASH_TRANSFER_ACCEPTED`, `CASH_TRANSFER_REJECTED`, `CASH_MOVEMENT_PENDING`

Canaux : notification interne + WhatsApp/email si configurés dans Paramètres → Notifications.

## Intégration paiements clients / fournisseurs

Lors de la création d'un paiement (`/dashboard/payments/new`) :

- **Encaissement client** (`FROM_CLIENT`) → mouvement **CREDIT** sur la caisse choisie
- **Paiement fournisseur** (`TO_SUPPLIER`) → mouvement **DEBIT** sur la caisse choisie
- Mode **espèces** : caisse **obligatoire**
- Autres modes : caisse **optionnelle** (traçabilité journal)
- À la **validation** d'un paiement en attente avec caisse → mouvement créé automatiquement
- À l'**annulation** → contrepassation du mouvement lié (`relatedPaymentId`)

Fichier : `src/lib/services/payment-cashbox-service.ts`

## Fichiers clés

- `prisma/schema.prisma` — modèles Cashbox, CashMovement, CashTransfer, CashDocument, CashCategory
- `src/lib/services/cashbox-service.ts` — logique transactionnelle
- `src/lib/treasury/cashbox-access.ts` — périmètre d'accès par rôle
- `src/components/treasury/` — interface React
