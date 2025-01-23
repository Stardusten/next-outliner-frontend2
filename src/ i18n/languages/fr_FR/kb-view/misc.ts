const misc = {
  loadingKb: "Chargement de la base de connaissances...",
  backup: {
    createBackup: "Créer une sauvegarde",
    createBackupSuccess: "Sauvegarde réussie",
    createBackupFailed: "Échec de la sauvegarde",
  },
  backlinksPanel: {
    nBacklinks: "{count} rétroliens",
    nPotentialLinks: "{count} liens potentiels",
  },
  keybindingInput: {
    empty: "Cliquez pour définir un raccourci",
  },
  codeblock: {
    unknownLanguage: "Langage inconnu",
    copyCode: "Copier le code",
    copySuccess: "Code copié dans le presse-papiers",
  },
  imageEditor: {
    title: "Éditeur d'image",
    description:
      "Prend en charge le recadrage, la rotation et l'optimisation automatique des documents numérisés",
    cancel: "Annuler",
    save: "Appliquer les modifications",
    saveAs: "Enregistrer sous",
    deleteOriginal: "Supprimer l'image originale ?",
  },
  fusionCommand: {
    noResults: "Aucun résultat trouvé",
    noCommandResults: "Aucune commande trouvée",
    allowedBlockTypes: "Types de blocs autorisés",
    searchPlaceholder: "Rechercher dans la base de connaissances",
    searchHelp:
      "↑↓ et Home, End pour sélectionner, ↵ pour ouvrir, ⌘+↵ pour insérer un lien, esc pour fermer",
    commandHelp:
      "Tapez / pour rechercher des commandes, ↑↓ et Home, End pour sélectionner, ↵ pour exécuter, esc pour fermer",
  },
  blockMover: {
    moveSuccess: "{count} blocs déplacés avec succès",
    focusMovedBlock: "Mettre le focus sur le bloc déplacé",
    inputPlaceholder: "Déplacer vers...",
  },
  refSuggestions: {
    noSuggestions: "Aucun résultat",
    createNewUnder1: "Créer un nouveau bloc sous",
    createNewUnder2: "",
    placeholder: "Essayez de taper / ou !",
  },
  pomodoro: {
    startWorking: "Au travail !",
    startResting: "Faites une pause",
    stop: "Arrêter",
    working: "En train de travailler...",
    resting: "En pause...",
  },
  settingsPanel: {
    title: "Paramètres",
    invalidJson: "JSON invalide",
    reset: "Réinitialiser aux valeurs par défaut",
    noResult: "Aucun bloc correspondant trouvé",
    invalidBlockId: "ID de bloc invalide",
  },
  syncStatus: {
    synced: "Toutes les modifications sont synchronisées",
    syncing: "Synchronisation en cours",
    disconnected: "Échec de la synchronisation",
  },
  sidePane: {
    remove: "Retirer du panneau latéral",
    prev: "Élément précédent",
    next: "Élément suivant",
    collapse: "Réduire le panneau latéral",
    moveToRight: "Déplacer le panneau à droite",
    moveToBottom: "Déplacer le panneau en bas",
    setFilter: "Définir un filtre",
    setSort: "Définir le tri",
    empty: "🤔 Le panneau latéral est vide",
    searchAndAdd: "Rechercher et ajouter des blocs au panneau latéral",
    emptyTip:
      'Vous pouvez ajouter du contenu de plusieurs façons :\n  - Via "Ajouter au panneau latéral" dans le menu du bloc\n  - Avec le raccourci Command/Ctrl + K\n  - En cliquant sur le bouton "+" en haut à droite pour rechercher',
  },
  backlinks: {
    openBacklinksPanel: "Ouvrir le panneau des rétroliens",
  },
  createNewTreeDialog: {
    title: "Créer un nouveau document",
    description:
      "Aucun bloc racine trouvé, cela peut être dû à :\n1. C'est un nouveau document\n2. Les données sont en cours de synchronisation",
    waitingForSync:
      'En attente de synchronisation. Si vous êtes sûr que c\'est un nouveau document, cliquez sur "Créer".',
    waitBtn: "Attendre",
    createBtn: "Créer",
    creating: "Création en cours...",
    done: "Création réussie",
    failed: "Échec de la création",
  },
  pasteDialog: {
    title: "Non non non",
    description: "C'est trop gros ! Ça va casser ! Essayez de coller par morceaux ?",
    cancelBtn: "D'accord",
  },
  exporter: {
    title: "Exporter",
    description:
      "Exporter la sous-arborescence sélectionnée au format HTML, PDF, Markdown, texte brut et autres formats",
    preview: "Aperçu",
    copyToClipboard: "Copier dans le presse-papiers",
    exportToFile: "Exporter vers un fichier",
    cancel: "Annuler",
    exportFormat: "Format d'export",
    blockRefsToPlaintext: "Convertir les références de bloc en texte brut",
    embedImagesAsBase64: "Intégrer les images en Base64",
  },
  fontSelector: {
    notAvailable: "(Non installée)",
    notSpecified: "(Non spécifiée)",
    addCustomFont: "Ajouter une police personnalisée",
    addCustomFontTitle: "Ajouter une police personnalisée",
    addCustomFontDesc: "Entrez le nom de la police que vous souhaitez utiliser",
    fontNamePlaceholder: "Entrez le nom de la police",
    cancel: "Annuler",
    confirm: "Confirmer",
    fontInstalled: "Police installée",
    fontNotInstalled: "La police ne semble pas être installée",
  },
  fieldValuesInspector: {
    title: "Inspecteur de propriétés",
    description: "Voir toutes les propriétés de ce bloc",
  },
  dailynoteNavigator: {
    noDailyNote: "Pas de note quotidienne pour ce jour, cliquez pour en créer une",
    gotoDailyNote: "Cliquez pour aller à la note quotidienne de ce jour",
    dontKnowWhereToCreate: {
      title: "Ne sait pas où créer la note quotidienne",
      desc: 'Vous devez définir l\'emplacement des nouvelles notes quotidiennes dans "Paramètres > Notes quotidiennes > Emplacement des notes quotidiennes"',
    },
  },
  history: {
    goToPrev: "Retour, clic droit pour voir l'historique complet",
    goToNext: "Avant, clic droit pour voir l'historique complet",
  },
  timeMachine: {
    title: "Machine à remonter le temps",
    description: "Sauvegarder et restaurer vos notes",
    preview: "Aperçu de cette sauvegarde",
    restore: "Restaurer cette sauvegarde",
    delete: "Supprimer cette sauvegarde",
    createBackup: "Créer une nouvelle sauvegarde",
    size: "{size} Mo",
    refresh: "Actualiser la liste des sauvegardes",
    noBackup: "Aucune sauvegarde",
  },
  attachmentViewer: {
    allowEdit: "Autoriser la modification",
    save: "Enregistrer",
    loading: "Chargement...",
    audioNotSupported: "Format audio non pris en charge",
    videoNotSupported: "Format vidéo non pris en charge",
  },
  settingGroups: {
    basic: "Paramètres de base",
    timeMachine: "Machine à remonter le temps",
    dailynote: "Notes quotidiennes",
    backlinks: "Références de blocs & rétroliens",
  },
  blockRefContextMenu: {
    title: "Alias de bloc",
    addAlias: "Ajouter un nouvel alias...",
    noAliases: "Aucun alias",
    backlinkCount: "{count} références",
    cannotDelete: "Impossible de supprimer : cet alias est référencé",
    deleteAlias: {
      title: "Supprimer l'alias",
      description: "Êtes-vous sûr de vouloir supprimer cet alias ? Cette action est irréversible.",
      cancel: "Annuler",
      confirm: "Supprimer",
    },
  },
  blockPath: {
    image: "[Image]",
    video: "[Vidéo]",
    code: "[Code]",
    math: "[Formule]",
    carousel: "[Diaporama]",
    audio: "[Audio]",
    query: "[Requête]",
    unknown: "[Inconnu]",
  },
  blockRefTagSettings: {
    title: "Paramètres des références",
    description: "Configurer les paramètres des références et des balises",
    color: "Couleur de référence/balise",
    relatedFields: "Champs associés",
    selectField: "Sélectionner un champ",
    unsavedChanges: "Modifications non enregistrées",
    cancel: "Annuler",
    save: "Enregistrer",
    noFields: "Aucun champ associé",
    addField: "Ajouter un nouveau champ",
    insertExistingField: "Insérer un champ existant",
    searchFields: "Rechercher des champs",
    noFieldsFound: "Aucun champ trouvé",
    tooltips: {
      settings: "Paramètres du champ",
      delete: "Supprimer le champ",
    },
    buildIndex: "Créer un index",
    valueType: "Type de valeur",
    selectValueType: "Sélectionner le type",
    valueTypes: {
      richtext: "Texte enrichi",
      blockRef: "Référence de bloc",
      fileRef: "Référence de fichier",
      arrayOfBlockRef: "Tableau de références de bloc",
      arrayOfFileRef: "Tableau de références de fichier",
      arrayOfRichText: "Tableau de blocs",
    },
    addTypes: {
      single: "Simple",
      richText: "Texte enrichi",
      blockReference: "Référence de bloc",
      file: "Fichier",
      array: "Tableau",
      arrayOfBlockReference: "Tableau de références de blocs",
      arrayOfFileReference: "Tableau de références de fichiers",
      arrayOfBlock: "Tableau de blocs",
    },
  },
};

export default misc;
