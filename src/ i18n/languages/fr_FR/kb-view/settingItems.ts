const settingItems = {
  basic: {
    textFontFamily: {
      label: "Police du texte",
      desc: "Spécifie la police utilisée pour le texte des notes.",
    },
    uiFontFamily: {
      label: "Police de l'interface",
      desc: "Spécifie la police de l'interface utilisateur. Cette police sera utilisée comme police de base si aucune autre n'est spécifiée.",
    },
    monospaceFontFamily: {
      label: "Police des blocs de code",
      desc: "Spécifie la police à chasse fixe utilisée pour le code en ligne, les blocs de code et autres éléments similaires.",
    },
  },
  dailynote: {
    defaultDateFormat: {
      label: "Format de date par défaut",
      desc: "Format de date utilisé par défaut lors de la création d'une nouvelle note quotidienne.",
    },
    parentBlockOfNewDailyNote: {
      label: "Emplacement des notes quotidiennes",
      desc: "Les nouvelles notes quotidiennes seront créées sous ce bloc (en tant que sous-blocs).",
    },
  },
  backlinks: {
    showCounter: {
      label: "Afficher le nombre de rétroliens",
      desc: "Si activé, le nombre de rétroliens sera affiché dans une bulle flottante à droite du bloc. Cliquez dessus pour ouvrir une fenêtre flottante montrant tous les rétroliens de ce bloc.",
    },
    putNewBlockAt: {
      label: "Position des nouveaux blocs",
      desc: "Dans le menu de complétion des références, spécifie où insérer les nouveaux blocs. Par défaut, ils seront insérés à la fin du bloc racine si non spécifié.",
    },
  },
  search: {
    ignoreDiacritics: {
      label: "Ignorer les accents",
      desc: "Lorsque cette option est activée, la recherche ignore les accents (par exemple, 'e' correspondra à 'é')",
    },
  },
};

export default settingItems;
