# HenriTrip FrontEnd, Consommation des guides

## Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org) (v18+) + npm
- [.NET SDK 8](https://dotnet.microsoft.com/download/dotnet/8.0)

### Développement

**Backend** (API sur http://localhost:5168 — Swagger sur http://localhost:5168/swagger) :

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

### Build

**Backend** :

```bash
cd back/HenriTrip.Api
dotnet build
```

**Frontend** :

```bash
cd front/henritrip-front
npm run build
```

### Comptes de test

| Rôle  | Email                      | Mot de passe |
|-------|----------------------------|--------------|
| Admin | admin@henritrip.test       | admin123     |
| User  | alice@henritrip.test       | alice123     |
| User  | bob@henritrip.test         | bob123       |

---

## Contexte

Ce projet répond à l’exercice FrontEnd, création d’une web app permettant aux utilisateurs de consulter les guides auxquels ils ont accès, puis de naviguer dans le détail de chaque guide, jours et activités.

## Choix technique

J’ai choisi **Angular** pour réaliser la web app.

### Raisons de ce choix

Même si l’énoncé propose React ou Expo, Angular a été choisi car l’énoncé autorise une autre technologie si le choix est documenté.

#### 1. Maîtrise de la stack
Angular est la technologie que je maîtrise le mieux pour livrer une application stable rapidement. Cela permet de me concentrer sur la qualité de l’interface, la gestion des états, et la robustesse de la consommation d’API.

#### 2. Architecture claire et maintenable
Angular propose une structure claire par composants et pages, ce qui facilite :
- la séparation liste / détail
- la réutilisation des éléments UI
- l’évolution future de l’application

#### 3. RxJS intégré pour la gestion des flux
Le projet utilise RxJS pour :
- le debounce de la recherche
- la gestion des subscriptions
- les timeouts réseau
- la gestion propre des événements asynchrones

Cela améliore la réactivité et évite les comportements instables.

#### 4. Bon support du responsive et des interfaces riches
Angular permet de construire rapidement une UI fluide avec :
- templates déclaratifs
- data binding
- gestion simple des états d’affichage
- intégration d’animations et transitions

#### 5. Productivité pour un test technique
Pour un exercice limité dans le temps, Angular permet de livrer vite une base solide avec une structure professionnelle.

## Fonctionnalités implémentées

### Fonctionnalités principales
- Affichage de la liste des guides disponibles pour l’utilisateur
- Navigation vers la page de détail d’un guide
- Affichage du détail d’un guide
  - titre
  - description
  - jours
  - activités associées
- Navigation entre les jours d’un guide

### Gestion UX / robustesse
- État de chargement
- Gestion des erreurs API
- Messages utilisateurs en cas d’échec
- Bouton de rafraîchissement manuel

## Bonus implémentés

- Recherche de guides
- Filtres :
  - saison
  - mobilité
  - pour qui
  - nombre de jours minimum
- Mode hors ligne
  - cache local des guides via `localStorage`
  - affichage du cache si API indisponible
  - synchronisation automatique au retour de la connexion
- Animations et transitions pour améliorer l’expérience utilisateur

## Choix d’implémentation (techniques)

### Recherche et filtres
- Recherche avec `debounceTime` pour éviter trop de recalculs
- Filtres cumulables pour affiner les résultats
- Réinitialisation rapide des filtres

### Performance
- `trackBy` sur les listes Angular
- `debounceTime` et `distinctUntilChanged` sur la recherche
- `timeout` sur les appels API
- `takeUntil` pour éviter les fuites mémoire

### Hors ligne
- Sauvegarde de la liste dans `localStorage`
- Relecture du cache en cas d’erreur réseau
- Écoute des événements `online` et `offline` pour synchroniser automatiquement

## Prérequis

- Node.js
- npm
- Angular CLI

## Installation

```bash
npm install
Lancement en développement
ng serve

Puis ouvrir :
http://localhost:4200

Configuration

Adapter l’URL de l’API dans le service si nécessaire.

Limites connues

Le mode hors ligne utilise un cache local simple, sans stratégie avancée de synchronisation conflictuelle.

Les animations Angular peuvent nécessiter l’installation de @angular/animations selon la configuration du projet.

Le projet est réalisé en Angular au lieu de React/Expo, choix assumé et documenté.

Améliorations possibles

Skeleton loaders

Pagination ou infinite scroll

Tri des guides

Tests unitaires et tests composants

PWA complète pour un offline plus avancé

Synchronisation fine des données en arrière-plan

Conclusion

Le projet couvre les objectifs de l’exercice FrontEnd, avec une attention particulière à l’UX, la robustesse des appels API, la performance perçue, et les bonus demandés.


---

## Version courte des raisons de choix, à dire à l’oral

Tu peux dire ceci, simplement.

- J’ai choisi Angular car c’est la stack que je maîtrise le mieux.
- Ça m’a permis de livrer plus vite une application stable et propre.
- Angular m’aide à structurer clairement les pages liste et détail.
- RxJS est très pratique pour la recherche avec debounce, la gestion des erreurs et des subscriptions.
- Le choix est conforme à l’énoncé, qui autorise une autre techno si elle est documentée.

---

## Petit conseil pour l’évaluateur

Ajoute aussi un fichier `README` avec une section **"Ce que j’aurais fait avec plus de temps"**.  
Ça montre du recul produit et technique.

Si tu veux, je peux aussi te préparer cette section en 6 points, très crédible pour un rendu de test technique.
::contentReference[oaicite:0]{index=0}