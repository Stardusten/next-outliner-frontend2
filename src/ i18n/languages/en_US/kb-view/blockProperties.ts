const blockProperties = {
  addProperty: "+ Add Property",
  propertyTypes: {
    decimal: "Decimal",
    float: "Float",
    plaintext: "Plain Text",
    richtext: "Rich Text",
    date: "Date",
    datetime: "Date & Time",
    select: "Select",
    multiselect: "Multi-Select",
    checkbox: "Checkbox",
    email: "Email",
    phone: "Phone",
  },
  tooltips: {
    editProperty: "Edit Property",
    deleteProperty: "Delete Property",
    propertyType: "Property Type: {type}",
    configOptions: "Configure Options",
  },
  editDialog: {
    title: "Edit Property",
    description: "Make changes to the property here. Click save when you're done.",
    type: "Type",
    key: "Key",
    value: "Value",
    unsavedChanges: "You have unsaved changes",
    save: "Save",
    cancel: "Cancel",
    duplicateKey: "This key already exists",
  },
  common: {
    selectPlaceholder: "Select...",
    inputPlaceholder: "Enter value...",
    selectDate: "Select date",
  },
  deleteProperty: {
    confirmTitle: "Delete Property",
    confirmMessage: "Are you sure you want to delete this property?",
  },
  optionsDialog: {
    title: "Configure Options",
    description: "Add or remove options for this property.",
    optionPlaceholder: "Enter option value",
    addOption: "Add Option",
    save: "Save",
    cancel: "Cancel",
    duplicateOptions: "Duplicate options are not allowed",
  },
};

export default blockProperties;
