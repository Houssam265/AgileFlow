# AgileFlow
Plateforme de Collaboration et Suivi de Projets Agiles

## 📋 Description du Projet

AgileFlow est une plateforme complète de gestion de projets Agile inspirée de Jira. Elle permet aux équipes de développement de gérer leurs projets, sprints, tâches, et collaborateurs dans un environnement collaboratif et temps réel.

## 🏗️ Architecture du Projet

Le projet est divisé en deux applications distinctes :
- **Backend** : API Spring Boot 3.3.5 dans le dossier `backend/`
- **Frontend** : Application React 18 dans le dossier `frontend/`

## 🚀 Démarrage Rapide

### Prérequis
- Java 21
- Node.js 18+ et npm
- MySQL 8.0+
- Maven

### 1. Configuration de la Base de Données

1. Installer et démarrer MySQL
2. Créer une base de données :
   ```sql
   CREATE DATABASE agileflow_db;
   ```

### 2. Configuration du Backend (Spring Boot)

1. Configurer les paramètres de base de données dans `src/main/resources/application.properties` :
   ```properties
   spring.datasource.username=votre_utilisateur
   spring.datasource.password=votre_mot_de_passe
   ```

2. Lancer l'application :
   ```bash
   ./mvnw spring-boot:run
   ```

   L'API sera disponible sur : http://localhost:8080

### 3. Configuration du Frontend (React)

1. Naviguer dans le dossier frontend :
   ```bash
   cd frontend
   ```

2. **IMPORTANT : Installer les dépendances**
   ```bash
   npm install
   ```

3. Créer le fichier `.env` a partir du template :
   ```bash
   cp .env.example .env
   ```

4. Verifier que le fichier `.env` contient :
   ```
   VITE_API_URL=http://localhost:8080/api
   VITE_WS_URL=http://localhost:8080/ws
   ```

5. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```

   L'application sera disponible sur : http://localhost:5173

## 🧪 Données de Test et Comptes

L'application inclut un mécanisme d'initialisation manuelle pour peupler la base de données avec des données réalistes.

### 🏃 Comment exécuter le script de test ?

Vous pouvez lancer l'initialisation à tout moment en utilisant le script situé dans le dossier des ressources du backend. 

**ATTENTION : Ce script supprimera toutes les données existantes avant de recréer les données de test.**

**Sur Windows :**
```powershell
cd backend/src/main/resources/
./seed-data.bat
```

*Note : Ce script lancera le backend avec le profil `seed`. Une fois que vous voyez "Initialisation des données terminée" dans les logs, les données sont prêtes.*

### 🔑 Comptes Utilisateurs (Mot de passe simple)

Voici les comptes de test créés automatiquement :

| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Administrateur** | `admin@agileflow.com` | `Password@2024` |
| **Manager** | `manager@agileflow.com` | `Password@2024` |
| **Développeur** | `alice@agileflow.com` | `Password@2024` |
| **Développeur** | `bob@agileflow.com` | `Password@2024` |

### 📊 Données Initialisées
- **Équipe** : Alpha Team (Gérée par le Manager, avec Alice et Bob)
- **Projet** : AgileFlow Platform
- **Backlog** : 3 User Stories (Gestion utilisateurs, Tableau Kanban, Notifications)
- **Sprint** : Sprint 1 - Foundation (Actif)
- **Tâches** : 3 tâches réparties entre Alice et Bob avec différents statuts (TODO, IN_PROGRESS, DONE)

## 📁 Structure du Projet

### Backend Structure
```
src/main/java/com/agileflow/
├── config/          # Configuration Spring
├── controller/       # Contrôleurs REST API
├── entity/           # Entités JPA
├── repository/       # Interfaces Spring Data JPA
├── service/          # Couche métier
├── dto/             # Data Transfer Objects
├── security/        # Configuration Spring Security
└── websocket/       # Configuration WebSocket
```

### Frontend Structure
```
frontend/src/
├── api/              # Configuration Axios et appels API
├── components/       # Composants réutilisables
├── context/         # Contextes React globaux
├── pages/           # Pages de l'application
├── routes/          # Configuration React Router
├── store/           # State management avec Zustand
├── types/           # Interfaces TypeScript
└── utils/           # Utilitaires
```

## 🛠️ Technologies Utilisées

### Backend
- **Spring Boot 3.3.5** - Framework principal
- **Spring Data JPA** - Persistance des données
- **Spring Security** - Authentification et autorisation
- **Spring WebSocket** - Communication temps réel
- **MySQL** - Base de données
- **Maven** - Gestion des dépendances

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Material-UI (MUI)** - Composants UI
- **React Router v6** - Navigation
- **Axios** - Client HTTP
- **Zustand** - Gestion d'état
- **Vite** - Build tool et dev server

## 🔐 Fonctionnalités d'Authentification

L'application utilise JWT (JSON Web Tokens) pour l'authentification :
- Tokens stockés dans le localStorage
- Refresh tokens pour les sessions prolongées
- Protection automatique des routes privées

## 📊 Fonctionnalités Principales

- ✅ Gestion des utilisateurs et rôles (Admin, Manager, Developer)
- ✅ Création et gestion de projets
- ✅ Planification des sprints
- ✅ Tableau Kanban pour les tâches
- ✅ Chat en temps réel
- ✅ Tableaux de bord et analytics
- ✅ Notifications en temps réel

## 👥 Rôles et Permissions

- **ROLE_ADMIN** : Accès complet à toutes les fonctionnalités
- **ROLE_MANAGER** : Gestion des projets et équipes
- **ROLE_DEVELOPER** : Accès aux tâches assignées

## 🚧 Développement

### Commandes Utiles

**Backend :**
```bash
./mvnw clean package    # Builder le projet
./mvnw test            # Lancer les tests
./mvnw spring-boot:run # Démarrer l'application
```

**Frontend :**
```bash
npm install          # Installer les dépendances
npm run dev          # Serveur de développement
npm run build        # Builder pour production
npm run preview      # Preview de la build
npm run lint         # Vérification du code
```

### Variables d'Environnement

**Backend** (`application.properties`) :
- `spring.datasource.url` - URL de la base MySQL
- `spring.datasource.username` - Utilisateur MySQL
- `spring.datasource.password` - Mot de passe MySQL
- `jwt.secret` - Clé secrète pour JWT

**Frontend** (`frontend/.env`) :
- `VITE_API_URL` - URL de l'API backend
- `VITE_WS_URL` - URL WebSocket pour le temps réel

## 🤝 Contribution

1. Forker le projet
2. Créer une branche feature (`git checkout -b feature/ma-fonctionnalite`)
3. Committer les changements (`git commit -m 'Ajouter ma fonctionnalité'`)
4. Pusher vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
1. Consulter la documentation ci-dessus
2. Vérifier les issues existantes
3. Créer une nouvelle issue si nécessaire

---

**⚠️ IMPORTANT POUR L'ÉQUIPE :**

Avant de commencer à travailler sur le frontend, assurez-vous de :
1. Naviguer dans le dossier `frontend/`
2. Exécuter `npm install` pour installer toutes les dépendances
3. Créer `.env` depuis `.env.example`
4. Vérifier que le backend tourne sur http://localhost:8080
5. Lancer le frontend avec `npm run dev`

Le projet est prêt pour le développement ! 🚀