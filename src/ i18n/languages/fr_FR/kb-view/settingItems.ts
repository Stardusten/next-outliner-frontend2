const settingItems = {
  basic: {
    textFontFamily: {
      label: "Police de texte",
      desc: "Spécifiez la police pour le contenu des notes.",
    },
    uiFontFamily: {
      label: "Police de l'interface",
      desc: "Spécifiez la police de l'interface. Lorsqu'aucune autre police n'est spécifiée, ce sera la police de base pour l'application.",
    },
    monospaceFontFamily: {
      label: "Police des blocs de code",
      desc: "Spécifiez la police utilisée pour le code en ligne, les blocs de code et autres scénarios de texte à espacement fixe.",
    },
    customCss: {
      label: "CSS personnalisé",
      desc: "Ajoutez des styles CSS personnalisés pour modifier l'apparence de votre base de connaissances.",
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
  quickAdd: {
    putNewBlockAt: {
      label: "Emplacement d'ajout rapide",
      desc: "Lors de la création d'un nouveau bloc via l'ajout rapide, spécifiez où insérer le nouveau bloc. Si non spécifié, il sera inséré à la fin du bloc racine par défaut.",
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
