# HenriTrip

Web app permettant aux utilisateurs de consulter les guides auxquels ils ont accès, de naviguer dans le détail de chaque guide (jours et activités), et pour les admins de gérer guides et utilisateurs.

## Prérequis

- [Node.js](https://nodejs.org) (v18+) + npm
- [.NET SDK 8](https://dotnet.microsoft.com/download/dotnet/8.0)

## Démarrage

**Backend** (API sur http://localhost:5168, Swagger sur http://localhost:5168/swagger) :

```bash
cd back/HenriTrip.Api
dotnet run
```

**Frontend** (sur http://localhost:4200) :

```bash
cd front/henritrip-front
npm install
npm start
```

## Build

```bash
# Backend
cd back/HenriTrip.Api && dotnet build

# Frontend
cd front/henritrip-front && npm run build
```

## Comptes de test

| Rôle  | Email                | Mot de passe |
|-------|----------------------|--------------|
| Admin | admin@henritrip.test | admin123     |
| User  | alice@henritrip.test | alice123     |
| User  | bob@henritrip.test   | bob123       |

## Configuration

L’URL de l’API est définie dans `front/henritrip-front/src/environments/environments.ts` (par défaut : `http://localhost:5168/api`).

## Fonctionnalités

- **Guides** : liste, détail, recherche, filtres (saison, mobilité, pour qui, jours min)
- **Mode hors ligne** : cache local, synchronisation au retour de la connexion
- **Admin** : gestion des utilisateurs et des guides (invitations, jours, activités)
- **Animations** : transitions et animations Angular

## Choix technique

- **Angular** : structure claire, RxJS intégré
