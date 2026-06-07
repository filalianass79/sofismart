# Module Gestion des Achats — SOFISMART

## Vue d'ensemble

Le module Achats couvre le cycle complet d'acquisition d'un véhicule : fournisseur, facture, identification véhicule, frais, paiements fournisseur, documents et entrée en stock.

## Pages

| URL | Description |
|-----|-------------|
| `/dashboard/purchases` | Liste avec filtres et actions |
| `/dashboard/purchases/new` | Assistant stepper (6 étapes) |
| `/dashboard/purchases/[id]` | Détail achat |
| `/dashboard/purchases/[id]/edit` | Modification / brouillon |

## API

- `GET/POST /api/purchases` — liste (filtres query) et création
- `GET/PUT/DELETE /api/purchases/[id]`
- `GET /api/purchases/[id]/summary`
- `GET/POST /api/suppliers` — `GET/PUT/DELETE /api/suppliers/[id]`
- `POST /api/payments` — `PUT/DELETE /api/payments/[id]`
- `POST /api/uploads` — `DELETE /api/documents/files/[id]`

## Stepper (6 étapes)

1. **Fournisseur** — sélection ou création (modal)
2. **Facture** — HT/TVA/TTC, frais multiples, prix de revient
3. **Véhicule** — identification partielle autorisée
4. **Paiements** — lignes multiples, reste à payer
5. **Documents** — upload PDF/JPG/PNG/WEBP
6. **Récapitulatif** — validation ou brouillon

## Règles métier

- Référence auto : `ACH-YYYY-####`
- Prix de revient = prix total achat + frais
- Statut paiement calculé (UNPAID / PARTIAL / PAID)
- Validation → mouvement de stock `INITIAL` + véhicule au dépôt
- Suppression interdite si véhicule vendu

## Comptes démo

Après `npm run db:seed` : `admin@sofismart.ma` / `SofiSmart2026!`

## Commandes

```bash
docker compose up -d
npx prisma db push
npm run db:seed
npm run dev
```
