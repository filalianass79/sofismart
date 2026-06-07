# Import facture d'achat (OCR)

## Objectif

Réduire la saisie manuelle lors d'un achat véhicule : import PDF/image → extraction → vérification → validation.

## Workflow

1. **Import** — `/dashboard/purchases/import` — upload PDF, JPG, PNG, WEBP (max 10 Mo).
2. **Extraction** — OCR (Tesseract pour images, `pdf-parse` pour PDF) + analyse texte (regex adaptées factures marocaines).
3. **Vérification** — facture à gauche, formulaire pré-rempli à droite (onglets sur mobile).
4. **Brouillon** — enregistre un achat `DRAFT` + joint la facture comme `PURCHASE_INVOICE`.
5. **Validation** — crée/met à jour l'achat `VALIDATED`, le véhicule et le fournisseur (sans doublon si match ICE/VIN).

## API

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/purchases/invoice-import` | Upload + extraction |
| GET | `/api/purchases/invoice-import/:id` | Résultat structuré |
| POST | `/api/purchases/invoice-import/:id/reprocess` | Relancer OCR |
| POST | `/api/purchases/invoice-import/:id/save-draft` | Brouillon achat |
| POST | `/api/purchases/invoice-import/:id/validate` | Valider achat |
| GET | `/api/suppliers/match?ice=&name=` | Match fournisseur |
| GET | `/api/vehicles/match?vin=&plate=` | Match véhicule |

## Modèles Prisma

- `InvoiceImport` — fichier source, OCR, JSON structuré, lien `purchaseId`
- `InvoiceExtractedField` — champs avec confiance / statut
- `InvoiceLineItem` — lignes facture
- `Document.invoiceImportId` — facture archivée sur l'achat

## Migration

```bash
npm run db:push
# ou
npm run db:migrate:deploy
```

## Dépendances

- `pdf-parse` + `pdfjs-dist` — texte PDF
- `tesseract.js` + `tesseract.js-core` — OCR images (fr+eng)

## Production (Docker / VPS)

- **Stockage** : `public/uploads/invoice-imports/` (volume persistant requis).
- **Variables** : `UPLOAD_DIR=public/uploads`, `MAX_UPLOAD_BYTES=10485760`.
- **Timeout** : extraction jusqu'à 120 s — configurer le reverse proxy (Nginx/Traefik) en conséquence.
- **Docker** : l'image copie les packages OCR dans `node_modules` (voir `Dockerfile`).
- **Non compatible** : Vercel / serverless sans stockage objet et jobs asynchrones.

## Limites actuelles

- Extraction heuristique (pas de ML) : formats de facture très variables → vérification humaine obligatoire.
- Marque/modèle véhicule : résolution catalogue à compléter dans le brouillon si besoin.
- Zones surlignées (bounding boxes) : structure prête, non alimentée par l'OCR local.

## Règles métier

- Pas de validation automatique sans action utilisateur.
- Doublon véhicule (VIN/plaque) → confirmation explicite.
- Fournisseur matché par ICE / nom / téléphone.
- Prix de revient recalculé par `upsertPurchase` (véhicule + frais).
