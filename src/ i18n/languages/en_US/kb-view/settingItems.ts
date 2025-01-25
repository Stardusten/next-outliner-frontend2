const settingItems = {
  basic: {
    textFontFamily: {
      label: "Text Font",
      desc: "Specify the font for note content.",
    },
    uiFontFamily: {
      label: "UI Font",
      desc: "Specify the interface font. When no other fonts are specified, this will be the base font for the application.",
    },
    monospaceFontFamily: {
      label: "Code Block Font",
      desc: "Specify the font used for inline code, code blocks, and other monospace text scenarios.",
    },
  },
  dailynote: {
    defaultDateFormat: {
      label: "Default Date Format",
      desc: "The default date format used when creating new daily notes.",
    },
    parentBlockOfNewDailyNote: {
      label: "Location for Daily Notes",
      desc: "New daily notes will be created under this block (as child blocks)",
    },
  },
  backlinks: {
    showCounter: {
      label: "Show Backlink Count on Block",
      desc: "If enabled, when a block has backlinks, the number of backlinks will be shown as a floating pill on the right side of the block. Click to open a popup window to browse all backlinks to this block.",
    },
    putNewBlockAt: {
      label: "New Block Location",
      desc: "When creating a new block from the reference completion menu, specify where to insert the new block. If not specified, it will be inserted at the end of the root block by default.",
    },
  },
  search: {
    ignoreDiacritics: {
      label: "Ignore Diacritics",
      desc: "When enabled, search will ignore diacritical marks (e.g., 'é' will match 'e')",
    },
  },
};

export default settingItems;
