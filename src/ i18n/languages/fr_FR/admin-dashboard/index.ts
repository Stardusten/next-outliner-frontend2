const adminDashboard = {
  title: "Panneau d'administration",
  logout: "Déconnexion",
  tabs: {
    kbManagement: "Gestion des bases de connaissances",
    logsAndAnalytics: "Journaux et analyses",
  },
  kbManagement: {
    allKbs: "Toutes les bases de connaissances",
    allKbsDescription:
      "Vous pouvez créer, supprimer ou modifier les informations des bases de connaissances ici",
    noKbs: "🤔 Aucune base de connaissances",
    noKbsDescription:
      'Cliquez sur le bouton "Créer une nouvelle base de connaissances" en haut à droite pour créer votre première base',
    kbActions: {
      edit: "Modifier",
      delete: "Supprimer",
      addKb: "Créer une nouvelle base",
      refreshKbList: "Actualiser la liste",
    },
    newKbDialog: {
      title: "Créer une nouvelle base de connaissances",
      description:
        "Veuillez remplir les informations suivantes pour créer une nouvelle base de connaissances",
      nameLabel: "Nom",
      namePlaceholder: "Entrez le nom de la base",
      locationLabel: "Emplacement",
      locationPlaceholder: "Entrez l'emplacement de la base",
      passwordLabel: "Mot de passe",
      passwordPlaceholder: "Entrez le mot de passe de la base",
      createBtn: {
        idle: "Créer",
        creating: "Création en cours...",
        createSuccess: "Création réussie",
        createFailed: "Échec de la création",
      },
      cancelBtn: "Annuler",
    },
    deleteKbDialog: {
      title: "Supprimer la base de connaissances",
      description:
        'Êtes-vous sûr de vouloir supprimer la base "{name}" ? Cette action est irréversible.',
      cancelBtn: "Annuler",
      status: {
        idle: "Supprimer",
        deleting: "Suppression en cours...",
        deleteSuccess: "Suppression réussie",
        deleteFailed: "Échec de la suppression",
      },
    },
  },
};

export default adminDashboard;
