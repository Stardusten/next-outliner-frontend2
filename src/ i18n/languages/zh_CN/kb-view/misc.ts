const misc = {
  loadingKb: "加载知识库中...",
  backup: {
    createBackup: "创建备份",
    createBackupSuccess: "备份成功",
    createBackupFailed: "备份失败",
  },
  backlinksPanel: {
    nBacklinks: "{count} 个反向链接",
    nPotentialLinks: "{count} 个潜在链接",
  },
  keybindingInput: {
    empty: "点击设置快捷键",
  },
  codeblock: {
    unknownLanguage: "未知语言",
    copyCode: "复制代码",
    copySuccess: "代码块中的代码已复制到剪贴板",
  },
  imageEditor: {
    title: "图片编辑器",
    description: "支持图片裁剪、旋转，自动优化扫描文件等功能",
    cancel: "取消",
    save: "应用更改",
    saveAs: "另存为",
    deleteOriginal: "是否删除原图？",
  },
  fusionCommand: {
    noResults: "没有找到相关内容",
    noCommandResults: "没有找到相关命令",
    allowedBlockTypes: "允许的块类型",
    searchPlaceholder: "搜索知识库",
    searchHelp: "↑↓ 和 Home, End 可选择搜索结果，↵ 跳转到选中项，⌘+↵ 插入块链接，esc 关闭搜索面板",
    commandHelp: "输入 / 可搜索命令，↑↓ 和 Home, End 选择命令然后 ↵ 执行命令，esc 关闭命令面板",
  },
  blockMover: {
    moveSuccess: "移动 {count} 个块成功",
    focusMovedBlock: "聚焦到移动后的块",
    inputPlaceholder: "移动到...",
  },
  refSuggestions: {
    noSuggestions: "没有结果",
    createNewUnder1: "在",
    createNewUnder2: "下创建新块",
    placeholder: "试试输入 / 或 !",
  },
  pomodoro: {
    startWorking: "开工吧！",
    startResting: "休息一下",
    stop: "停止",
    working: "工作中...",
    resting: "休息中...",
  },
  settingsPanel: {
    title: "设置",
    invalidJson: "无效的 JSON",
    reset: "重置为默认值",
    noResult: "没有找到符合条件的块",
    invalidBlockId: "无效的块 ID",
  },
  syncStatus: {
    synced: "所有更改已同步",
    syncing: "同步中",
    disconnected: "同步失败",
  },
  sidePane: {
    remove: "从侧栏移除此项",
    prev: "聚焦到上一项",
    next: "聚焦到下一项",
    collapse: "折叠侧边栏",
    moveToRight: "移动侧边栏到右侧",
    moveToBottom: "移动侧边栏到下方",
    setFilter: "设置过滤条件",
    setSort: "设置排序条件",
    empty: "🤔 当前侧边栏为空",
    searchAndAdd: "搜索块并添加到侧边栏",
    emptyTip:
      '您可以通过以下方式添加内容：\n  - 在块菜单中选择"添加到侧边栏"\n  - 使用快捷键 Command/Ctrl + K\n  - 右上角点击 "+" 按钮搜索添加块',
  },

  backlinks: {
    openBacklinksPanel: "打开反链面板",
  },
  createNewTreeDialog: {
    title: "创建新文档",
    description: "没有找到根块，这可能是因为：\n1. 这是一个新文档\n2. 数据还在同步中",
    waitingForSync: '正在等待同步，如果确定这是新文档，可以点击"创建"按钮创建新文档。',
    waitBtn: "等待",
    createBtn: "创建",
    creating: "正在创建...",
    done: "创建成功",
    failed: "创建失败",
  },
  pasteDialog: {
    title: "不要不要",
    description: "太大啦！放进来会坏掉的！要不试试分段粘贴？",
    cancelBtn: "我知道了",
  },

  exporter: {
    title: "导出",
    description: "将选中的子树导出为 HTML、PDF、Markdown、纯文本等格式",
    preview: "预览",
    copyToClipboard: "复制到剪贴板",
    exportToFile: "导出到文件",
    cancel: "取消",
    exportFormat: "导出格式",
    blockRefsToPlaintext: "将块引用转换为纯文本",
    embedImagesAsBase64: "以 Base64 编码嵌入图片",
  },
  fontSelector: {
    notAvailable: "(未安装)",
    notSpecified: "(未指定)",
    addCustomFont: "添加自定义字体",
    addCustomFontTitle: "添加自定义字体",
    addCustomFontDesc: "输入你想要使用的字体名称",
    fontNamePlaceholder: "输入字体名称",
    cancel: "取消",
    confirm: "确认",
    fontInstalled: "字体已安装",
    fontNotInstalled: "字体似乎尚未安装",
  },
  fieldValuesInspector: {
    title: "属性检视器",
    description: "查看这个块的所有属性值",
  },
  dailynoteNavigator: {
    noDailyNote: "这一天没有每日笔记，点击以创建",
    gotoDailyNote: "点击以前往这一天的每日笔记",
    dontKnowWhereToCreate: {
      title: "不知道在哪里创建每日笔记",
      desc: '你应该到 "设置 > 每日笔记 > 每日笔记的存放位置" 设置新创建的每日笔记的存放位置',
    },
  },
  history: {
    goToPrev: "后退，右键查看所有历史项目",
    goToNext: "前进，右键查看所有历史项目",
  },

  timeMachine: {
    title: "时光机",
    description: "备份和恢复你的笔记",
    preview: "预览此备份",
    restore: "回退到此备份",
    delete: "删除此备份",
    createBackup: "创建新备份",
    size: "{size} MB",
    refresh: "刷新备份列表",
    noBackup: "没有备份",
  },
  attachmentViewer: {
    allowEdit: "允许编辑",
    save: "保存",
    loading: "正在加载...",
    audioNotSupported: "音频格式不受支持",
    videoNotSupported: "视频格式不受支持",
  },
  settingGroups: {
    basic: "基础设置",
    timeMachine: "时光机",
    dailynote: "每日笔记",
    backlinks: "块引用与反向链接",
    quickAdd: "快速添加",
    search: "搜索",
  },

  blockRefContextMenu: {
    title: "块别名",
    addAlias: "添加新别名...",
    noAliases: "暂无别名",
    backlinkCount: "{count} 个引用",
    cannotDelete: "无法删除：此别名正在被引用",
    deleteAlias: {
      title: "删除别名",
      description: "确定要删除这个别名吗？此操作不可撤销。",
      cancel: "取消",
      confirm: "删除",
    },
  },
  blockPath: {
    image: "[图片]",
    video: "[视频]",
    code: "[代码]",
    math: "[公式]",
    carousel: "[轮播]",
    audio: "[音频]",
    query: "[查询]",
    unknown: "[未知]",
  },
  blockRefTagSettings: {
    title: "引用设置",
    description: "配置块引用和标签的设置",
    color: "引用/标签颜色",
    relatedFields: "关联字段",
    selectField: "选择字段",
    unsavedChanges: "有未保存的更改",
    cancel: "取消",
    save: "保存",
    noFields: "没有关联字段",
    addField: "添加新字段",
    insertExistingField: "插入现有字段",
    searchFields: "搜索字段",
    noFieldsFound: "未找到字段",
    tooltips: {
      settings: "字段设置",
      delete: "删除字段",
    },
    buildIndex: "建立索引",
    valueType: "值类型",
    selectValueType: "选择值类型",
    valueTypes: {
      richtext: "富文本",
      blockRef: "块引用",
      fileRef: "文件引用",
      arrayOfBlockRef: "块引用数组",
      arrayOfFileRef: "文件引用数组",
      arrayOfRichText: "块数组",
    },
    addTypes: {
      single: "单个",
      richText: "富文本",
      blockReference: "块引用",
      file: "文件",
      array: "数组",
      arrayOfBlockReference: "块引用数组",
      arrayOfFileReference: "文件引用数组",
      arrayOfBlock: "块数组",
    },
  },
};

export default misc;
