export const messages = {
  zh: {
    login: {
      kbEditorLogin: {
        title: "打开知识库",
        serverUrlLabel: "服务器 URL",
        serverUrlPlaceholder: "输入服务器 URL，例如 http://43.134.1.60/:8081",
        noKbServerMsg:
          '此服务器上没有知识库，你可以<a class="cursor-pointer">以管理员身份登录</a>，然后在控制面板创建新知识库。',
        kbLocationLabel: "知识库",
        refreshKbListTooltip: "刷新知识库列表",
        passwordLabel: "密码",
        adminLoginBtn: "管理员登陆",
        serverStatus: {
          invalidURL: "URL 格式不正确",
          connFailed: "连接失败",
          connecting: "连接中",
          connSuccess: "连接成功",
          noKbServer: "没有知识库服务器",
        },
        loginStatus: {
          idle: "空闲",
          loggingIn: "登录中",
          loginSuccess: "登录成功",
          loginFailed_InvalidPassword: "密码错误",
          loginFailed_Unknown: "未知错误，请联系服务器管理员",
        },
        loginBtn: {
          idle: "登录",
          loggingIn: "登录中...",
          loginSuccess: "登录成功",
          loginFailed_InvalidPassword: "登录",
          loginFailed_Unknown: "登录",
        },
      },
      adminLogin: {
        title: "管理员登录",
        serverUrlLabel: "服务器 URL",
        serverUrlPlaceholder: "输入服务器 URL，例如 http://43.134.1.60/:8081",
        passwordLabel: "密码",
        loginStatus: {
          loggingIn: "登录中...",
          loginSuccess: "登录成功",
          invalidServerUrl: "URL 格式不正确",
          cannotConnectToServer: "无法连接到服务器",
          invalidPassword: "密码错误",
          maxAttempts: "达到最大尝试次数，请稍后再试",
        },
      },
    },
    kbView: {
      loadingKb: "加载知识库中...",
      backlinksPanel: {
        nBacklinks: "{count} 个反向链接",
        nPotentialLinks: "{count} 个潜在链接",
      },
      keybindingInput: {
        empty: "点击设置快捷键",
      },
      fusionCommand: {
        noResults: "没有找到相关内容",
        noCommandResults: "没有找到相关命令",
        allowedBlockTypes: "允许的块类型",
        searchPlaceholder: "搜索知识库",
        searchHelp:
          "↑↓ 和 Home, End 可选择搜索结果，↵ 跳转到选中项，⌘+↵ 插入块链接，esc 关闭搜索面板",
        commandHelp: "输入 / 可搜索命令，↑↓ 和 Home, End 选择命令然后 ↵ 执行命令，esc 关闭命令面板",
      },
      blockMover: {
        moveSuccess: "移动 {count} 个块成功",
        focusMovedBlock: "聚焦到移动后的块",
        inputPlaceholder: "移动到...",
      },
      refSuggestions: {
        noSuggestions: "没有结果",
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
      },
      headerBar: {
        pomodoro: "番茄钟",
        closeMenu: "关闭菜单",
        openMenu: "打开菜单",
        back: "后退",
        forward: "前进",
        search: "搜索",
        notifications: "通知",
        switchLightTheme: "切换为明亮主题",
        switchDarkTheme: "切换为黑暗主题",
        openSidepane: "打开侧栏",
        closeSidepane: "关闭侧栏",
        export: "导出",
        import: "导入",
        enterFocusMode: "进入专注模式",
        exitFocusMode: "退出专注模式",
        attachmentsManager: "附件管理",
        settings: "设置",
        timeMachine: "时光机",
        help: "帮助文档",
        exit: "退出",
      },
      command: {
        deleteBlock: "删除块",
        copyBlockReference: "复制块引用",
        copyBlockMirror: "复制块镜像",
        addToFavorite: "添加到收藏",
        addToSidepane: "添加到侧边栏",
        export: "导出",
        sortDirectChildren: "排序直接子块",
        sortDictAsc: "字典序升序",
        sortDictDesc: "字典序降序",
        ctimeAsc: "创建时间升序",
        ctimeDesc: "创建时间降序",
        mtimeAsc: "修改时间升序",
        mtimeDesc: "修改时间降序",
        archiveDone: "归档已完成任务",
        moveBlock: "移动块",
        moveBlockLeaveRef: "移动块，留下块引用",
        moveBlockLeaveMirror: "移动块，留下块镜像",
        insertMirrorBelow: "下方插入镜像块",
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
        title: "确定粘贴吗？",
        description: "检测到粘贴内容较长，将会创建 {blockCount} 个新块，共 {charCount} 个字符。",
        confirmBtn: "粘贴",
        cancelBtn: "取消",
        pasting: "正在处理...",
        done: "粘贴完成",
        failed: "粘贴失败",
      },
      attachmentsManager: {
        title: "附件管理器",
        upload: "上传",
        noFiles: "没有文件",
        refreshing: "正在刷新...",
        refreshed: "刷新成功",
        previewPane: {
          openPreview: "预览",
          download: "下载",
          reference: "插入块引用",
          pathReference: "插入路径引用",
          insertImage: "插入图片",
          fetchingImage: "图片加载中...",
          closePreview: "关闭预览",
          delete: "删除",
          info: "详细信息",
        },
        uploadStatus: {
          idle: "空闲",
          uploading: "上传中...",
          success: "上传成功",
          failed: "上传失败",
        },
        fetchFilesStatus: {
          idle: "空闲",
          fetching: "正在获取文件列表...",
          success: "获取文件列表成功",
          failed: "获取文件列表失败",
        },
      },
      imageContent: {
        fetchingImage: "图片加载中...",
        addCaption: "添加图片描述",
        deleteImage: "删除图片",
        blend: "与背景混合（按颜色）",
        blendLuminosity: "与背景混合（按亮度）",
        circle: "裁剪为圆形",
        invert: "反色",
        invertW: "反色（白底）",
        outline: "描边",
        width: "宽度",
        wider: "更宽",
        narrower: "更窄",
        resetWidth: "重置",
        download: "下载图片",
        metadata: "详细信息",
        filter: "滤镜",
      },
      exporter: {
        title: "导出",
        description: "导出选中子树为 HTML, PDF, Markdown, Plain Text 等多种格式",
        preview: "预览",
        copyToClipboard: "复制到剪贴板",
        exportToFile: "导出到文件",
        cancel: "取消",
        exportFormat: "导出格式",
      },
    },
  },
};
