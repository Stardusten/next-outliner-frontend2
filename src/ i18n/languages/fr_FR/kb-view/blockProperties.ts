const blockProperties = {
  addProperty: "+ Ajouter une propriété",
  propertyTypes: {
    decimal: "Décimal",
    float: "Flottant",
    plaintext: "Texte brut",
    richtext: "Texte enrichi",
    date: "Date",
    datetime: "Date et heure",
    select: "Sélection",
    multiselect: "Sélection multiple",
    checkbox: "Case à cocher",
    email: "Email",
    phone: "Téléphone",
  },
  tooltips: {
    editProperty: "Modifier la propriété",
    deleteProperty: "Supprimer la propriété",
    propertyType: "Type de propriété : {type}",
    configOptions: "Configurer les options",
  },
  editDialog: {
    title: "Modifier la propriété",
    description: "Modifiez la propriété ici. Cliquez sur enregistrer une fois terminé.",
    type: "Type",
    key: "Clé",
    value: "Valeur",
    unsavedChanges: "Vous avez des modifications non enregistrées",
    save: "Enregistrer",
    cancel: "Annuler",
    duplicateKey: "Cette clé existe déjà",
  },
  common: {
    selectPlaceholder: "Sélectionner...",
    inputPlaceholder: "Saisir une valeur...",
    selectDate: "Sélectionner une date",
  },
  deleteProperty: {
    confirmTitle: "Supprimer la propriété",
    confirmMessage: "Êtes-vous sûr de vouloir supprimer cette propriété ?",
  },
  optionsDialog: {
    title: "Configurer les options",
    description: "Ajouter ou supprimer des options pour cette propriété.",
    optionPlaceholder: "Entrer la valeur de l'option",
    addOption: "Ajouter une option",
    save: "Enregistrer",
    cancel: "Annuler",
    duplicateOptions: "Les options en double ne sont pas autorisées",
  },
};

export default blockProperties;
