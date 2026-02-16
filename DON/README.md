# DON - ZaKaT

Application mobile de gestion de dons et de demandes de Zakat, construite avec React Native et Expo.

## Fonctionnalites

### Systeme de publications

L'application distingue trois types de publications selon le type de compte :

#### Particuliers (`individual_request`)
- Creation de demandes d'aide individuelles
- Bouton "Faire un don" sur chaque publication
- Les dons vont directement a la demande concernee
- Suivi de progression (montant collecte / objectif)

#### Associations - Publications d'impact (`org_update`)
- Publications d'actualites et de resultats
- Photos + texte
- PAS de bouton don (informationnel uniquement)
- Permet de montrer l'impact des actions

#### Associations - Campagnes (`org_campaign`)
- Appels a l'aide avec objectif chiffre
- Bouton "Faire un don" visible
- Les dons vont au wallet de l'association (pas a la publication)
- Permet de financer les actions globales de l'association

### Classification par themes

Le systeme de categories a ete remplace par un systeme de themes multi-selection :

**6 themes disponibles :**
- Sante
- Education
- Environnement
- Infrastructure
- Urgences & Crises
- Solidarite

**Fonctionnement :**
- Selection multiple obligatoire (min 1 theme)
- Le premier theme selectionne devient le "theme principal"
- Le theme principal est utilise pour l'affichage des badges
- Champs dynamiques affiches selon le theme principal

### Champs dynamiques par theme

Selon le theme principal, des champs specifiques sont affiches dans le formulaire :

#### Infrastructure
| Champ | Type | Obligatoire |
|-------|------|-------------|
| Type d'infrastructure | Dropdown (ecole, hopital, puits, logement, autre) | Oui |
| Localisation du projet | Texte | Oui |
| Statut du projet | Dropdown (planifie, en_cours, urgent, reconstruction) | Non |
| Devis PDF | Upload | Non (recommande) |

#### Environnement / Ecologie
| Champ | Type | Obligatoire |
|-------|------|-------------|
| Type d'action | Dropdown (plantation, nettoyage, protection, autre) | Oui |
| Localisation du projet | Texte | Oui |
| Quantite cible | Texte (ex: "500 arbres") | Non |

#### Sante
| Champ | Type | Obligatoire |
|-------|------|-------------|
| Type de besoin | Dropdown (soins, medicaments, operation, autre) | Oui |
| Date limite | Date | Non |

#### Education
| Champ | Type | Obligatoire |
|-------|------|-------------|
| Niveau | Dropdown (primaire, college, lycee, universite) | Oui |
| Nombre de beneficiaires | Nombre | Non |

#### Autres themes (Urgences, Solidarite)
Seuls les champs communs sont affiches.

### Systeme de dons (simulation locale)

| Type | Cible | Description |
|------|-------|-------------|
| Don general | Tresor ZaKaT | Don au tresor commun redistribue aux urgences |
| Don demande | Request | Don direct a une demande de particulier |
| Don association | Organization wallet | Don a une association (via campagne ou profil) |

- Montants rapides : 5, 10, 20, 50, 100 EUR
- Montant personnalise jusqu'a 1M EUR
- Message optionnel
- Simulation locale (pas de paiement reel)

### Profils utilisateurs

#### Compte Particulier
- Nom, prenom, ville, pays
- Peut creer des demandes individuelles

#### Compte Association
- **Obligatoires** : Nom organisation, description, representant legal
- **Administratif** : SIRET/RNA, attente d'immatriculation
- **Optionnels** : Annee de creation, site web, reseaux sociaux, logo, pays d'intervention, themes
- Statut d'approbation : `pending` > `approved` / `rejected`
- Wallet avec balance totale et nombre de donateurs

### Moteur de decouverte (Explorer)
- Page d'accueil style Netflix avec sections thematiques
- Badges visuels differencies :
  - Demande (particulier) - badge bleu
  - Publication (association) - badge orange
  - Campagne (association) - badge vert
- Badges de theme avec couleur et icone
- Recherche globale (titre, description, ville, pays, beneficiaire, organisation, themes)
- Filtres avances : themes, type, montant maximum, urgences uniquement
- Bouton "Faire un don general" (tresor)
- Barres de progression sur les cartes

### Organisations
- Profil organisation avec mission et statistiques
- Wallet : total collecte + nombre de donateurs
- Bouton principal "Donner a cette association"
- Liste des publications de l'association
- Niveaux de partenariat : officiel, partenaire

### Moderation
- Interface d'administration depuis le profil
- Validation/rejet des demandes avec notes
- Seules les demandes verifiees apparaissent dans l'explorateur

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | Expo SDK 54, React Native 0.81 |
| Langage | TypeScript 5.9 |
| Navigation | React Navigation (bottom tabs + native stack) |
| State management | Zustand |
| Stockage local | AsyncStorage, expo-sqlite |
| Formulaires | React Hook Form + Zod |
| UI | @expo/vector-icons (MaterialCommunityIcons) |
| Media | expo-image-picker, expo-document-picker |
| PDF | react-native-webview |

## Structure du projet

```
src/
├── components/       # Composants reutilisables (Card, Input, Badge, FilterModal, CountryPicker...)
├── db/               # SQLite : client, schema, seed, repositories
├── domain/           # Modeles de domaine (Donation, Applicant, User)
├── navigation/       # Navigateurs (Root, App, Auth, Profile, Request)
├── providers/        # AuthProvider
├── screens/          # Ecrans (Home, Create, Detail, Admin, Profile, Donate...)
├── services/         # Services metier
│   ├── auth/         # Authentification locale
│   ├── donation/     # Gestion des dons et du tresor
│   ├── organization/ # Gestion des organisations + wallet
│   ├── profile/      # Gestion du profil (union Individual | Organization)
│   ├── request/      # CRUD demandes avec postType, donTarget, details
│   ├── countries.ts  # Liste ISO des pays
│   └── themes.ts     # Systeme de themes (6 categories)
├── store/            # Stores Zustand (applicant, donation, user)
├── theme/            # Design system (colors, typography, spacing, shadows)
└── utils/            # Utilitaires (formatCurrency)
```

## Modeles de donnees

### ZakatRequest (Publication)
```typescript
interface ZakatRequest {
  id: string;
  authorUserId: string;
  authorDisplayName: string;
  title: string;
  category?: RequestCategory;   // Deprecated - use themes
  description: string;
  goalAmount: number;           // 0 pour org_update
  themes: string[];             // Required, min 1
  primaryTheme?: string;        // First selected theme
  details?: RequestDetails;     // Theme-specific data
  postType: PostType;           // 'individual_request' | 'org_update' | 'org_campaign'
  donTarget: DonTarget;         // 'request' | 'organization'
  organizationId?: string;
  receivedAmountCents: number;
  donorCount: number;
  // ... autres champs
}
```

### RequestDetails (champs dynamiques)
```typescript
type RequestDetails =
  | { themeType: 'infrastructure'; data: InfrastructureDetails }
  | { themeType: 'environnement'; data: EcologyDetails }
  | { themeType: 'sante'; data: HealthDetails }
  | { themeType: 'education'; data: EducationDetails }
  | { themeType: 'other'; data: Record<string, any> };

interface InfrastructureDetails {
  infrastructureType: 'ecole' | 'hopital' | 'puits' | 'logement' | 'autre';
  projectLocation: string;
  projectStatus?: 'planifie' | 'en_cours' | 'urgent' | 'reconstruction';
  devisPdfId?: string;
}

interface EcologyDetails {
  ecologyActionType: 'plantation' | 'nettoyage' | 'protection' | 'autre';
  projectLocation: string;
  targetQuantity?: string;
}

interface HealthDetails {
  medicalNeedType: 'soins' | 'medicaments' | 'operation' | 'autre';
  deadlineDate?: string;
}

interface EducationDetails {
  educationLevel: 'primaire' | 'college' | 'lycee' | 'universite';
  beneficiariesCount?: number;
}
```

### Organization
```typescript
interface Organization {
  id: string;
  name: string;
  description: string;
  walletBalanceCents: number;  // Total des dons recus
  donorCount: number;          // Nombre de donateurs
  verified: boolean;
  partnershipLevel: 'officiel' | 'partenaire' | 'none';
  // ... autres champs
}
```

### Donation
```typescript
interface Donation {
  id: string;
  type: DonationType;          // 'treasury' | 'request' | 'organization'
  requestId?: string;
  organizationId?: string;
  amountCents: number;
  // ... autres champs
}
```

## Installation

```bash
npm install
npx expo start
```

Scanner le QR code avec Expo Go sur votre appareil.

## Ecrans principaux

| Ecran | Description |
|-------|-------------|
| Explorer (Home) | Decouverte des publications avec badges themes, recherche et filtres |
| Demandes | Liste des demandes de l'utilisateur + creation |
| Detail | Vue complete avec badge theme et bouton don conditionnel |
| Donate | Ecran de don (tresor / demande / association) |
| OrganizationProfile | Profil association avec wallet et bouton don |
| Admin | Moderation des demandes (accepter/refuser) |
| Profil | Parametres, informations legales, acces admin |

## Flux de dons

### Don a un particulier
1. Utilisateur clique sur "Faire un don" sur une demande verifiee
2. Ecran DonateScreen avec type='request'
3. Creation du don + incrementation request.receivedAmountCents

### Don a une association (via campagne)
1. Utilisateur clique sur "Soutenir [association]" sur une campagne
2. Ecran DonateScreen avec type='organization'
3. Creation du don + incrementation organization.walletBalanceCents

### Don a une association (via profil)
1. Utilisateur visite le profil de l'association
2. Clique sur "Donner a cette association"
3. Ecran DonateScreen avec type='organization'
4. Creation du don + incrementation organization.walletBalanceCents

### Don general (tresor)
1. Utilisateur clique sur "Faire un don general" dans Explorer
2. Ecran DonateScreen avec type='treasury'
3. Creation du don + incrementation treasury.totalAmountCents

## Tests manuels

### Tests post types
- [ ] Post particulier -> bouton don -> don cible la demande
- [ ] Campagne asso -> bouton don -> don cible l'association
- [ ] Publication impact -> PAS de bouton don
- [ ] Profil asso -> bouton don -> don cible l'association
- [ ] Don general -> cible le tresor

### Tests champs dynamiques
- [ ] Creer demande "Infrastructure" -> projectLocation demande (obligatoire)
- [ ] Creer demande "Environnement" -> projectLocation demande (obligatoire)
- [ ] Creer demande "Sante" -> medicalNeedType demande (obligatoire)
- [ ] Creer demande "Education" -> educationLevel demande (obligatoire)
- [ ] Creer demande "Urgences" ou "Solidarite" -> pas de champs dynamiques

## Fichiers modifies

### Types (evolution champs dynamiques)
- `src/services/request/types.ts`
  - Suppression de la dependance a `category` (deprecated)
  - Ajout `themes: string[]` (required, min 1)
  - Ajout `primaryTheme?: string`
  - Ajout `details?: RequestDetails`
  - Ajout types: `InfrastructureDetails`, `EcologyDetails`, `HealthDetails`, `EducationDetails`
  - Ajout labels: `INFRASTRUCTURE_TYPE_LABELS`, `PROJECT_STATUS_LABELS`, etc.

### Services
- `src/services/request/RequestService.ts`
  - Migration: category -> themes
  - Migration: themes vides -> theme par defaut
  - Create: support `details` et `primaryTheme`

### Ecrans
- `src/screens/CreateRequestScreen.tsx`
  - Suppression selecteur categorie
  - Themes maintenant obligatoires (min 1)
  - Section "Details du projet" dynamique selon theme principal
  - Champs specifiques par theme avec validation
- `src/screens/AdminScreen.tsx` - Badge theme au lieu de categorie
- `src/screens/RequestDetailScreen.tsx` - Badge theme avec icone et couleur
- `src/screens/RequestListScreen.tsx` - Badge theme avec icone et couleur
