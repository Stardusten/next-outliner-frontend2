const adminDashboard = {
  title: "管理员面板",
  logout: "登出",
  tabs: {
    kbManagement: "知识库管理",
    logsAndAnalytics: "日志和分析",
  },
  kbManagement: {
    allKbs: "所有知识库",
    allKbsDescription: "你可以在这里创建新知识库，删除知识库，或修改已有知识库的信息",
    noKbs: "🤔 没有知识库",
    noKbsDescription: '点击右上角的"创建新知识库"按钮来创建你的第一个知识库',
    kbActions: {
      edit: "编辑",
      delete: "删除",
      addKb: "创建新KB",
      refreshKbList: "刷新KB列表",
      shrink: "压缩",
    },
    newKbDialog: {
      title: "创建新KB",
      description: "请填写以下信息来创建新的KB",
      nameLabel: "名称",
      namePlaceholder: "请输入知识库名称",
      locationLabel: "位置",
      locationPlaceholder: "请输入知识库位置",
      passwordLabel: "密码",
      passwordPlaceholder: "请输入知识库密码",
      createBtn: {
        idle: "创建",
        creating: "创建中...",
        createSuccess: "创建成功",
        createFailed: "创建失败",
      },
      cancelBtn: "取消",
    },
    deleteKbDialog: {
      title: "删除知识库",
      description: '你确定要删除知识库 "{name}" 吗？此操作不可撤销。',
      cancelBtn: "取消",
      status: {
        idle: "删除",
        deleting: "正在删除...",
        deleteSuccess: "删除成功",
        deleteFailed: "删除失败",
      },
    },
  },
};

export default adminDashboard;
