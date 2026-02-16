# Don App - Application de dons

Application mobile React Native (Android) dédiée à la gestion des dons avec un thème médical.

## Architecture

```
src/
├── components/       # Composants UI réutilisables
├── db/              # Couche base de données SQLite
│   ├── repositories/ # Repositories (accès données)
│   ├── client.ts     # Client SQLite
│   ├── schema.ts     # Schéma des tables
│   ├── seed.ts       # Données initiales
│   └── init.ts       # Initialisation DB
├── domain/          # Modèles de domaine
│   └── models.ts
├── navigation/      # Configuration React Navigation
├── screens/         # Écrans de l'application
├── store/           # State management Zustand
├── theme/           # Système de design (couleurs, spacing, typography)
└── utils/           # Utilitaires (formatage monétaire, etc.)
```

## Prérequis

- Node.js >= 18
- npm ou yarn
- Android Studio (avec SDK 34)
- JDK 17

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer Metro bundler (terminal 1)
npm start

# 3. Lancer sur Android (terminal 2)
npm run android
```

## Lancer via Android Studio

1. Ouvrir Android Studio
2. Sélectionner "Open" et naviguer vers `DON/android`
3. Attendre la synchronisation Gradle
4. Sélectionner un émulateur ou appareil connecté
5. Cliquer sur "Run" (triangle vert)

**Important:** Le Metro bundler doit tourner dans un terminal séparé (`npm start`).

## Fonctionnalités

### Onglet Accueil
- Bannière avec le total des dons
- Liste des demandeurs validés
- Carte détaillée avec progression
- Bottom sheet pour effectuer un don

### Onglet Demandeur
- Formulaire de création de dossier
- Validation avec zod
- Liste des demandes soumises
- Mode admin pour valider les demandes

### Onglet Profil
- Informations utilisateur
- Toggle notifications
- Réinitialisation des données (démo)

## Stack technique

- **React Native CLI** (0.74.1)
- **TypeScript**
- **React Navigation** (Bottom Tabs)
- **Zustand** (state management)
- **SQLite** (persistance locale)
- **react-hook-form + zod** (formulaires)
- **react-native-vector-icons** (icônes)

## Données de démonstration

Au premier lancement, l'application est pré-remplie avec:
- 6 demandeurs validés
- 3 demandeurs en attente
- Un total de dons d'environ 12 450 €
- Un utilisateur mock

## Thème

Couleurs médicales:
- Primary: `#0EA5A4` (teal)
- Accent: `#3B82F6` (bleu)
- Background: `#F6FAFB`
- Surfaces blanches avec ombres légères
