# Checklist post-déploiement SOFISMART

- [ ] Application accessible via HTTPS (`APP_URL`)
- [ ] Login administrateur (`SEED_ADMIN_EMAIL`)
- [ ] Changement mot de passe si mot de passe temporaire
- [ ] Permissions : commercial sans validation vente, gérant/admin avec validation
- [ ] Tableau de bord charge sans erreur 500
- [ ] Liste véhicules / clients / ventes / achats
- [ ] Création vente + demande de validation (commercial)
- [ ] Validation vente + facture + bon de sortie (gérant)
- [ ] Upload document (PDF / image, taille max respectée)
- [ ] Import facture achat : PDF → extraction → brouillon ou validation (`/dashboard/purchases/import`)
- [ ] Génération / téléchargement PDF facture
- [ ] Scan QR bon de sortie (URL publique correcte)
- [ ] `npx prisma migrate deploy` appliqué sans erreur
- [ ] Aucun secret dans le code source / logs publics
- [ ] `AUTH_SECRET` et mots de passe seed modifiés
- [ ] Sauvegarde DB planifiée
- [ ] Volume uploads persistant (Docker / VPS)
