const settingItems = {
  basic: {
    textFontFamily: {
      label: "正文字型",
      desc: "指定筆記正文的字型。",
    },
    uiFontFamily: {
      label: "介面字型",
      desc: "指定軟件介面字型。在不指定其他字型的情況下，該字型將成為軟件的基礎字型。",
    },
    monospaceFontFamily: {
      label: "程式碼區塊字型",
      desc: "指定行內程式碼、程式碼區塊等需要等寬字型的場景使用的字型。",
    },
    customCss: {
      label: "自定義 CSS",
      desc: "添加自定義 CSS 樣式以定制知識庫的外觀。",
    },
  },
  dailynote: {
    defaultDateFormat: {
      label: "預設日期格式",
      desc: "建立新的每日筆記時，預設使用的日期格式。",
    },
    parentBlockOfNewDailyNote: {
      label: "每日筆記的存放位置",
      desc: "建立的新每日筆記將會放到這個區塊下（作為子區塊）",
    },
  },
  backlinks: {
    showCounter: {
      label: "區塊右側顯示反向連結個數",
      desc: "如果開啟，則如果一個區塊有反向連結，則會在區塊右側以懸浮膠囊的形式顯示反向連結個數。點擊即可開啟一個懸浮視窗，用於瀏覽這個區塊的所有反向連結。",
    },
    putNewBlockAt: {
      label: "新區塊插入位置",
      desc: "在引用補全選單中，選擇建立新區塊時新區塊插入的位置。如果不指定，預設會插入根區塊末尾。",
    },
  },
  quickAdd: {
    putNewBlockAt: {
      label: "快速添加位置",
      desc: "透過快速添加創建新塊時，指定新塊插入的位置。如果未指定，預設將插入到根塊的末尾。",
    },
  },
  search: {
    ignoreDiacritics: {
      label: "忽略變音符號",
      desc: "啟用後，搜尋時將忽略變音符號（例如，搜尋'e'時會匹配'é'）",
    },
  },
};

export default settingItems;
