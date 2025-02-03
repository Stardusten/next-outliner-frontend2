const attachmentsManager = {
  title: "Gestionnaire de pièces jointes",
  description: "Gérez tous vos fichiers joints",
  upload: "Téléverser",
  uploading: "Téléversement en cours...",
  noFiles: "Aucun fichier",
  searchPlaceholder: "Rechercher des fichiers...",
  filterByType: "Filtrer par type",
  allFiles: "Tous les fichiers",
  folders: "Dossiers",
  images: "Images",
  documents: "Documents",
  audio: "Audio",
  video: "Vidéo",
  others: "Autres",
  sortBy: "Trier par",
  sortByName: "Nom",
  sortByDate: "Date",
  sortBySize: "Taille",
  refreshing: "Actualisation...",
  refreshed: "Actualisation réussie",
  uploadSuccess: {
    title: "Téléversement réussi",
    description: "{0} fichiers téléversés avec succès",
  },
  uploadError: {
    title: "Échec du téléversement",
    duplicateFiles: "Les fichiers suivants existent déjà : {0}",
    unknown: "Erreur inconnue",
  },
  previewPane: {
    openPreview: "Aperçu",
    download: "Télécharger",
    reference: "Insérer une référence de bloc",
    pathReference: "Insérer une référence de chemin",
    insertImage: "Insérer l'image",
    fetchingImage: "Chargement de l'image...",
    closePreview: "Fermer l'aperçu",
    delete: "Supprimer",
    info: "Informations",
  },
  uploadStatus: {
    idle: "En attente",
    uploading: "Téléversement en cours...",
    success: "Téléversement réussi",
    failed: "Échec du téléversement",
  },
  fetchFilesStatus: {
    idle: "En attente",
    fetching: "Récupération de la liste des fichiers...",
    success: "Liste des fichiers récupérée",
    failed: "Échec de la récupération",
  },
  actions: {
    rename: "Renommer",
    copy: "Copier",
    info: "Informations",
    delete: "Supprimer",
    download: "Télécharger",
    refresh: "Actualiser",
    preview: "Aperçu",
  },
  hiddenFiles: "{count} fichiers filtrés masqués",
  rename: {
    title: "Renommer",
    description: "Veuillez saisir un nouveau nom de fichier",
    newNameLabel: "Nouveau nom",
    newNamePlaceholder: "Saisissez un nouveau nom de fichier",
    cancelBtn: "Annuler",
    submitBtn: "Appliquer",
    error: {
      emptyName: "Le nom ne peut pas être vide",
      sameName: "Le nouveau nom doit être différent de l'ancien",
      duplicateName: "Ce nom de fichier existe déjà",
    },
  },
  renameSuccess: {
    title: "Renommage réussi",
    description: "Le fichier a été renommé",
  },
  renameError: {
    title: "Échec du renommage",
    unknown: "Erreur inconnue",
  },
  delete: {
    title: "Supprimer le fichier",
    description: "Êtes-vous sûr de vouloir supprimer ce fichier ?",
    folderWarning: "Vous supprimez un dossier, tous les fichiers qu'il contient seront supprimés.",
    fileCount: "Ce dossier contient {count} fichiers",
    warning: "Cette action est irréversible",
    cancelBtn: "Annuler",
    submitBtn: "Supprimer",
  },
  deleteSuccess: {
    title: "Suppression réussie",
    description: "Le fichier a été supprimé",
  },
  deleteError: {
    title: "Échec de la suppression",
    unknown: "Erreur inconnue",
  },
  downloadError: {
    title: "Échec du téléchargement",
    unknown: "Erreur inconnue",
  },
  info: {
    title: "Informations sur le fichier",
    name: "Nom",
    path: "Chemin",
    type: "Type",
    size: "Taille",
    modifiedTime: "Date de modification",
    createdTime: "Date de création",
    closeBtn: "Fermer",
  },
  selectFileToPreview: "Sélectionnez un fichier pour l'aperçu",
  fileNotPreviewable: "L'aperçu n'est pas disponible pour ce type de fichier",
  tooltip: {
    showPreview: "Afficher le panneau d'aperçu",
    hidePreview: "Masquer le panneau d'aperçu",
    filter: "Filtrer les fichiers",
    sort: "Trier les fichiers",
  },
};

export default attachmentsManager;
