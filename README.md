# O.S. Blender Course Viewer

Une interface web moderne pour visualiser mes cours et astuces Blender. Ce projet permet de naviguer facilement dans une structure de dossiers contenant des PDFs et des mini-sites HTML.

## 🚀 Fonctionnalités Clés

-   **Visionneuse PDF intégrée** : Lecture fluide des cours directement dans le navigateur.
-   **Menu Dynamique** : Le menu latéral est généré automatiquement basé sur l'arborescence des dossiers.
-   **Section "3D Tips"** : Une section dédiée pour les astuces, séparée des cours principaux.
-   **Support des Projets HTML** : Possibilité d'inclure des démos web interactives (dossiers avec `index.html`) qui s'ouvrent directement dans la visionneuse.
-   **Architecture "Static Site"** : Pas de base de données requise, fonctionne avec un simple script Python pour l'indexation.
-   **Design Premium** : Interface sombre, glassmorphism, et animations fluides.
-   **Menu Rétractable** : Maximisez l'espace de lecture en masquant la barre latérale.
-   **Protection par Mot de Passe** : Un écran de connexion simple protège l'accès au contenu (Côté client).

---

## 🛠️ Comment Ajouter du Contenu

### 1. Ajouter des Fichiers
Placez vos fichiers dans les dossiers correspondants :
-   **`Cours/`** : Pour les supports de cours principaux. Organisez-les en sous-dossiers (ex: `Cours/3D1/MonCours.pdf`).
-   **`Tips/`** : Pour les astuces et tutoriels.
    -   *PDF* : Déposez directement le fichier PDF.
    -   *Site Web* : Créez un dossier (ex: `Tips/MonProjetWeb`) et placez-y un fichier `index.html`.

### 2. Mettre à Jour le Menu
Après avoir ajouté ou supprimé des fichiers, le site ne se met pas à jour tout seul. Vous devez régénérer l'index :

> **Double-cliquez sur le fichier `update_menu.bat` à la racine du projet.**

Une fenêtre noire va s'ouvrir brièvement pour scanner les dossiers et mettre à jour le fichier `courses_data.js`. Une fois fermée, rafraîchissez votre page web pour voir les changements.

---

## ⚙️ Configuration

### Changer le Mot de Passe
La sécurité est gérée dans le fichier `login.js`. Pour changer le mot de passe :
1.  Ouvrez `login.js` avec un éditeur de texte.
2.  Modifiez la ligne : `const CORRECT_PASSWORD = '123';`
3.  Remplacez `123` par le mot de passe de votre choix.

---

## 📦 Déploiement Automatique (GitHub)
Si ce projet est hébergé sur GitHub, une action automatique (`.github/workflows/deploy.yml`) est configurée.
À chaque fois que vous envoyez (`push`) vos modifications sur la branche `main` :
1.  GitHub lance automatiquement le script de scan.
2.  Le site est mis à jour et déployé sur GitHub Pages.
