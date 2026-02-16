# ZaKaT - Firebase Backend

## Architecture

```
firebase/
├── firebase.json           # Firebase project configuration
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore composite indexes
├── storage.rules           # Cloud Storage security rules
└── functions/
    ├── package.json        # Functions dependencies
    ├── tsconfig.json       # TypeScript configuration
    └── src/
        └── index.ts        # Cloud Functions (admin actions, triggers)

src/lib/
└── firebase.ts             # Firebase client initialization
```

## Collections Firestore

| Collection      | Description                                    |
|-----------------|------------------------------------------------|
| `admins`        | Liste des administrateurs (uid comme doc ID)   |
| `users`         | Profils utilisateurs                           |
| `organizations` | Organisations/associations                     |
| `posts`         | Publications (temoignages, remerciements)      |
| `requests`      | Demandes de dons                               |
| `donations`     | Historique des dons                            |
| `follows`       | Relations de suivi                             |
| `notifications` | Notifications utilisateurs                     |
| `treasury`      | Tresorerie globale (singleton)                 |

## Status Workflow

Les `posts`, `requests` et `organizations` suivent ce workflow:

```
pending --> verified (par admin)
        \-> rejected (par admin)
```

## Cloud Functions

### Admin Functions (Callable)

| Function              | Description                          |
|-----------------------|--------------------------------------|
| `verifyRequest`       | Approuve une demande                 |
| `rejectRequest`       | Rejette une demande avec raison      |
| `verifyPost`          | Approuve une publication             |
| `rejectPost`          | Rejette une publication avec raison  |
| `verifyOrganization`  | Approuve une organisation            |
| `rejectOrganization`  | Rejette une organisation avec raison |
| `processDonation`     | Traite un don (met a jour compteurs) |
| `initializeTreasury`  | Initialise la tresorerie (une fois)  |

### Triggers (Automatiques)

| Trigger           | Description                                    |
|-------------------|------------------------------------------------|
| `onNewFollow`     | Notifie quand quelqu'un suit un utilisateur    |
| `onNewDonation`   | Notifie le beneficiaire d'un nouveau don       |

## Setup

### 1. Creer un projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Creer un nouveau projet
3. Activer:
   - Authentication (Email/Password + Google)
   - Firestore Database
   - Cloud Storage
   - Cloud Functions (necessite plan Blaze)

### 2. Configurer l'app mobile

1. Copier `.env.example` vers `.env`
2. Remplir avec vos valeurs Firebase (Project Settings > General)

```bash
cp .env.example .env
```

### 3. Installer Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 4. Deployer les regles et fonctions

```bash
cd firebase

# Deployer les regles Firestore
firebase deploy --only firestore:rules

# Deployer les regles Storage
firebase deploy --only storage:rules

# Deployer les index
firebase deploy --only firestore:indexes

# Deployer les fonctions
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 5. Creer le premier admin

Dans la Firebase Console > Firestore:

1. Creer la collection `admins`
2. Ajouter un document avec l'ID = UID de l'utilisateur admin
3. Contenu: `{ role: "super_admin", createdAt: <timestamp> }`

### 6. Initialiser la tresorerie

Apres avoir cree un admin, appelez la fonction `initializeTreasury` depuis l'app ou via Firebase CLI.

## Emulateurs locaux

Pour le developpement local:

```bash
cd firebase
firebase emulators:start
```

UI disponible sur http://localhost:4000

Dans `.env`:
```
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
```

## Securite

### Firestore Rules

- **admins**: Lecture reservee aux admins, pas d'ecriture client
- **users**: Chacun peut lire/modifier son profil
- **organizations**: Lecture publique si `verified`, ecriture par owner (sauf status)
- **posts/requests**: Lecture publique si `verified`, ecriture par author (sauf status/counters)
- **donations**: Lecture par donor, creation par auth user, immutables
- **follows**: Lecture publique, creation/suppression par follower
- **notifications**: Lecture/modification par le destinataire uniquement
- **treasury**: Lecture publique, ecriture par Cloud Functions uniquement

### Storage Rules

| Path                              | Permissions                        |
|-----------------------------------|------------------------------------|
| `/media/posts/{postId}/`          | Read: public, Write: authenticated |
| `/media/requests/{requestId}/`    | Read: public, Write: authenticated |
| `/media/orgs/{orgId}/{type}/`     | Read: public, Write: authenticated |
| `/media/users/{userId}/avatar/`   | Read: public, Write: owner only    |
| `/thumbnails/`                    | Read: public, Write: functions     |

Limites de taille:
- Videos: 50 MB max
- Images/PDFs: 10 MB max
- Avatars: 5 MB max

## Migration depuis SQLite

Pour migrer les donnees locales vers Firebase:

1. Exporter les donnees SQLite
2. Transformer au format Firestore
3. Importer via Admin SDK ou Firebase CLI

## Monitoring

- Firebase Console > Functions > Logs
- Firebase Console > Firestore > Usage
- Firebase Console > Storage > Usage

## Couts (Plan Blaze)

- Firestore: 50K lectures/jour gratuites
- Storage: 5 GB gratuits
- Functions: 2M invocations/mois gratuites
- Auth: Gratuit

Pour un MVP, les couts devraient etre minimaux ou nuls.
