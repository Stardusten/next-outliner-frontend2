const adminDashboard = {
  title: "管理員面板",
  logout: "登出",
  tabs: {
    kbManagement: "知識庫管理",
    logsAndAnalytics: "日誌和分析",
  },
  kbManagement: {
    allKbs: "所有知識庫",
    allKbsDescription: "你可以在這裡建立新知識庫、刪除知識庫，或修改已有知識庫的資訊",
    noKbs: "🤔 沒有知識庫",
    noKbsDescription: "點擊右上角的「建立新知識庫」按鈕來建立你的第一個知識庫",
    kbActions: {
      edit: "編輯",
      delete: "刪除",
      addKb: "建立新KB",
      refreshKbList: "重新整理KB列表",
      shrink: "壓縮",
    },
    newKbDialog: {
      title: "建立新KB",
      description: "請填寫以下資訊來建立新的KB",
      nameLabel: "名稱",
      namePlaceholder: "請輸入知識庫名稱",
      locationLabel: "位置",
      locationPlaceholder: "請輸入知識庫位置",
      passwordLabel: "密碼",
      passwordPlaceholder: "請輸入知識庫密碼",
      createBtn: {
        idle: "建立",
        creating: "建立中...",
        createSuccess: "建立成功",
        createFailed: "建立失敗",
      },
      cancelBtn: "取消",
    },
    deleteKbDialog: {
      title: "刪除知識庫",
      description: "你確定要刪除知識庫「{name}」嗎？此操作不可撤銷。",
      cancelBtn: "取消",
      status: {
        idle: "刪除",
        deleting: "正在刪除...",
        deleteSuccess: "刪除成功",
        deleteFailed: "刪除失敗",
      },
    },
  },
};

export default adminDashboard;
