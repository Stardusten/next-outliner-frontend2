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
      addKb: "Créer nouvelle KB",
      refreshKbList: "Actualiser KB",
      shrink: "Compresser",
    },
    newKbDialog: {
      title: "Créer nouvelle KB",
      description: "Veuillez remplir les informations suivantes pour créer une nouvelle KB",
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
    shrinkKbDialog: {
      title: "Compresser la base de connaissances",
      description: 'Êtes-vous sûr de vouloir compresser la base "{name}" ?',
      beforeSize: "Taille avant compression : {size}",
      afterSize: "Taille après compression : {size}",
      cancelBtn: "Annuler",
      status: {
        idle: "Compresser",
        shrinking: "Compression en cours...",
        shrinkSuccess: "Compression réussie",
        shrinkFailed: "Échec de la compression",
      },
    },
  },
};

export default adminDashboard;
