# Plan : Complétion du module RH (Gestion du Personnel)

## Résumé

Backend RH complet (Employe, Shift, OffreEmploi, Candidature). Frontend : liste employés en lecture seule uniquement.

---

## Phase 1 — Ajustements Backend

| Fichier | Changement |
|---------|-----------|
| `app/backend/apps/hr/serializers.py` | Retirer `'statut'` des `read_only_fields` de `CandidatureSerializer` |
| `app/backend/apps/hr/admin.py` | Ajouter `ShiftAdmin`, `OffreEmploiAdmin`, `CandidatureAdmin` avec `@admin.register` |
| `app/backend/apps/hr/tests.py` | Tests pour Offre CRUD, Candidature status update, Shift permissions |

## Phase 2 — Types & API Frontend

| Fichier | Changement |
|---------|-----------|
| `types/inventory.ts` | Ajouter interfaces `Shift`, `OffreEmploi`, `Candidature` |
| `api/inventory_hr.ts` | Ajouter méthodes API : shifts (get/create/delete), offres (CRUD), candidatures (get/update status) |

## Phase 3 — Refonte HrPage.tsx

Structure à 3 onglets avec barre de navigation :

### Onglet 1 : Employés (page actuelle + CRUD)
- **Header** : Search + Export + **+ Ajouter** (nouveau)
- **Tableau** : ID | Identité | Rôle | Statut | Contact | **Actions** (nouveau)
- **Éditeur latéral** (pattern StockPage) : username, password, first_name, last_name, email, role, poste, salaire, date_embauche, telephone, cin
- **ConfirmationModal** pour la suppression

### Onglet 2 : Plannings (Shifts)
- **Dropdown** sélecteur d'employé
- **Tableau** : Date | Début | Fin | Notes | Actions
- **Bouton + Ajouter** → éditeur latéral : employé, jour, heure_debut, heure_fin, notes
- **ConfirmationModal** pour suppression

### Onglet 3 : Recrutement (Offres + Candidatures)
- **Sous-onglets** : Offres | Candidatures
- **Offres** : tableau + CRUD complet (titre, description, type_contrat, salaire, publiable)
- **Candidatures** : tableau + dropdown inline pour changer le statut

### Pattern UI (éditeur latéral)
```tsx
<AnimatePresence>
  {editor && (
    <div className="fixed inset-0 z-[100] flex items-center justify-end">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md h-full bg-surface border-l border-outline flex flex-col shadow-2xl">
        <div className="p-8 border-b border-outline bg-surface-container-high">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em]">Nouveau / Modifier</h2>
        </div>
        <div className="p-6 md:p-10 space-y-6 flex-1 overflow-y-auto">
          {/* labels + inputs/selects */}
        </div>
        <div className="p-6 md:p-8 border-t border-outline bg-surface-container-high flex gap-4">
          <button onClick={closeEditor}>Annuler</button>
          <button onClick={handleSave}>Enregistrer</button>
        </div>
      </div>
    </div>
  )}
</AnimatePresence>
```

## Fichiers modifiés

- `app/backend/apps/hr/serializers.py` — 1 ligne changée
- `app/backend/apps/hr/admin.py` — ~30 lignes ajoutées
- `app/backend/apps/hr/tests.py` — ~80 lignes ajoutées
- `app/frontend/backoffice-app/src/types/inventory.ts` — ~30 lignes ajoutées
- `app/frontend/backoffice-app/src/api/inventory_hr.ts` — ~15 lignes ajoutées
- `app/frontend/backoffice-app/src/pages/HR/HrPage.tsx` — refonte complète (~700 lignes)

## Éléments à préserver

- `data-testid="nav-hr"` dans la sidebar
- Route `/hr` protégée par `RoleRoute allowedRoles={['GERANT']}`
- Tests E2E existants dans `backoffice.gerant.spec.ts`
- Export CSV dans l'onglet Employés
