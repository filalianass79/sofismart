# Documents commerciaux SOFISMART

## Types

| Type | Slug prévisualisation | PDF |
|------|----------------------|-----|
| Bon de sortie | `/dashboard/documents/preview/exit-voucher/{id}` | `/api/exit-vouchers/{id}/pdf` |
| Bon de livraison | `/dashboard/documents/preview/delivery-note/{id}` | `/api/warehouse/delivery-notes/{id}/pdf` |
| Facture de vente | `/dashboard/documents/preview/sales-invoice/{saleId}` | `/api/sales/{id}/invoice/pdf` |

## Prévisualisation

- Format A4 centré, zoom, impression navigateur
- Onglets : Aperçu, Informations, Historique
- Actions : télécharger, imprimer, envoyer (notification), régénérer PDF

## API

- `GET /api/documents/[type]/[id]/preview` — données JSON du document
- `POST /api/documents/[type]/[id]/generate-pdf` — régénération
- `POST /api/documents/[type]/[id]/send` — notification utilisateur
- `POST /api/documents/[type]/[id]/downloaded` — historique
- `POST /api/documents/[type]/[id]/printed` — historique
- `GET /api/documents/[type]/[id]/history` — journal
- `GET /api/documents/qr?url=...` — image QR pour l’aperçu web

## QR codes sécurisés

- Bon de sortie : `/dashboard/warehouse/exit-vouchers/scan/{secureToken}`
- Bon de livraison : `/dashboard/warehouse/delivery-notes/scan/{qrToken}`

## Base de données

Modèles `DocumentTemplate`, `GeneratedDocument`, `DocumentHistory` — alimentés à chaque génération PDF.

Après migration :

```bash
npx prisma db push
npx prisma generate
```

## Personnalisation

Paramètres société : **Paramètres → Profil société** (logo, en-tête, pied de page, ICE, RC, coordonnées bancaires).
