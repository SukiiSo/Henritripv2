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
  
## Pourquoi Angular et .NET (C#)

J’ai choisi **Angular** côté front et **.NET 8 (C#)** côté back pour coller au plus près du contexte du poste qui m’a été proposé et des échanges que nous avons eus. Mon expérience sur Angular (versions récentes) et sur des API en C# m’a permis d’aller vite tout en gardant une base propre, testable, et maintenable.

J’aurais aussi pu partir sur un stack **React + NestJS** pour maximiser la vitesse d’itération sur un cas pratique court. J’ai préféré privilégier une approche alignée avec la stack attendue, avec des choix techniques cohérents pour un projet qui pourrait évoluer.

## Temps de développement
- **Backend** : ~5h (API REST, gestion des données, authentification)
- **Frontend** : ~5h (interface utilisateur, intégration avec l’API, animations, tests end-to-end)
- **Total** : ~10h
- 
## Améliorations possibles

- **Base de données en temps réel** : permettre aux utilisateurs de voir les mises à jour des guides et activités en temps réel grâce à une base de données en temps réel (ex : Firebase, Supabase,mongoDB Atlas)
- **Tests** : unitaires et d’intégration pour le backend, tests end-to-end pour le frontend
- **CI/CD** : pipelines de build et déploiement
- **Docker** : conteneurisation pour faciliter le déploiement
- **Internationalisation** : support de plusieurs langues
- **Accessibilité** : améliorer l’accessibilité pour tous les utilisateurs
- **Performance** : optimisation du chargement et de la navigation
- **Notifications** : système de notifications pour les utilisateurs (ex : nouveaux guides, mises à jour)
- **Feedback utilisateur** : collecte de feedback pour améliorer l’expérience
- **Analytics** : suivi de l’utilisation pour mieux comprendre les besoins des utilisateurs
- **Sécurité** : renforcer la sécurité (ex : protection contre les attaques courantes, gestion des permissions)
- **Documentation** : documentation plus complète pour les développeurs et les utilisateurs finaux
- **Mobile** : version mobile ou application native pour une meilleure expérience sur smartphone
- **Intégration de services externes** : ex : météo, cartographie, recommandations personnalisées
- **Personnalisation** : permettre aux utilisateurs de personnaliser leur expérience (ex : thèmes, préférences d’affichage)
- **Collaboration** : fonctionnalités de partage et de collaboration entre utilisateurs (ex : création de guides partagés, commentaires)
- **Gamification** : ajouter des éléments de gamification pour encourager l’engagement (ex : badges, points, défis)
- **Support multilingue** : permettre aux utilisateurs de consulter les guides dans différentes langues
- **Intelligence artificielle** : intégrer des fonctionnalités basées sur l’IA pour améliorer les recommandations et la personnalisation
- **Optimisation SEO** : améliorer le référencement pour les guides publics
- **Support pour les médias** : permettre l’ajout de photos, vidéos, ou autres médias dans les guides et activités
- **Intégration avec les réseaux sociaux** : permettre le partage de guides ou d’activités sur les réseaux sociaux
- **Système de notation et de commentaires** : permettre aux utilisateurs de noter les guides et de laisser des commentaires pour aider les autres à choisir
- **Support pour les événements en temps réel** : ex : notifications en temps réel pour les mises à jour de guides ou les nouvelles activités
- **Intégration de la géolocalisation** : permettre aux utilisateurs de voir les guides et activités à proximité de leur position actuelle
- **Support pour les itinéraires personnalisés** : permettre aux utilisateurs de créer des itinéraires personnalisés en combinant différentes activités et jours de plusieurs guides
- **Intégration de la réalité augmentée** : permettre aux utilisateurs de visualiser les activités ou les lieux en réalité augmentée pour une expérience plus immersive
- **Support pour les groupes** : permettre aux utilisateurs de créer des groupes pour partager des guides et des activités avec des amis ou la famille
- **Intégration de la réservation** : permettre aux utilisateurs de réserver des activités ou des services directement depuis l’application