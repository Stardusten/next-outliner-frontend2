const settingItems = {
  basic: {
    textFontFamily: {
      label: "正文字体",
      desc: "指定笔记正文的字体。",
    },
    uiFontFamily: {
      label: "界面字体",
      desc: "指定软件界面字体。在不指定其他字体的情况下，该字体将成为软件的基础字体。",
    },
    monospaceFontFamily: {
      label: "代码块字体",
      desc: "指定行内代码、代码块等需要等宽字体的场景使用的字体。",
    },
  },
  dailynote: {
    defaultDateFormat: {
      label: "默认日期格式",
      desc: "创建新的每日笔记时，默认使用的日期格式。",
    },
    parentBlockOfNewDailyNote: {
      label: "每日笔记的存放位置",
      desc: "创建的新每日笔记将会放到这个块下（作为子块）",
    },
  },
  backlinks: {
    showCounter: {
      label: "块右侧显示反向链接个数",
      desc: "如果开启，则如果一个块有反向链接，则会在块右侧以悬浮胶囊的形式显示反向链接个数。点击即可打开一个悬浮窗口，用于浏览这个块的所有反向链接。",
    },
    putNewBlockAt: {
      label: "新块插入位置",
      desc: "在引用补全菜单中，选择创建新块时新块插入的位置。如果不指定，默认会插入根块末尾。",
    },
  },
  search: {
    ignoreDiacritics: {
      label: "忽略变音符号",
      desc: "启用后，搜索时将忽略变音符号（例如，搜索'e'时会匹配'é'）",
    },
  },
};

export default settingItems;
