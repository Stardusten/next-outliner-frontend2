const adminDashboard = {
  title: "管理者パネル",
  logout: "ログアウト",
  tabs: {
    kbManagement: "ナレッジベース管理",
    logsAndAnalytics: "ログと分析",
  },
  kbManagement: {
    allKbs: "すべてのナレッジベース",
    allKbsDescription:
      "ここで新しいナレッジベースの作成、削除、または既存のナレッジベース情報の変更ができます",
    noKbs: "🤔 ナレッジベースがありません",
    noKbsDescription:
      '右上の"新規ナレッジベースの作成"ボタンをクリックして、最初のナレッジベースを作成してください',
    kbActions: {
      edit: "編集",
      delete: "削除",
      addKb: "新規KB作成",
      refreshKbList: "KB一覧更新",
      shrink: "圧縮",
    },
    newKbDialog: {
      title: "新規KB作成",
      description: "以下の情報を入力して新しいKBを作成してください",
      nameLabel: "名前",
      namePlaceholder: "ナレッジベース名を入力してください",
      locationLabel: "場所",
      locationPlaceholder: "ナレッジベースの場所を入力してください",
      passwordLabel: "パスワード",
      passwordPlaceholder: "ナレッジベースのパスワードを入力してください",
      createBtn: {
        idle: "作成",
        creating: "作成中...",
        createSuccess: "作成成功",
        createFailed: "作成失敗",
      },
      cancelBtn: "キャンセル",
    },
    deleteKbDialog: {
      title: "ナレッジベースの削除",
      description: 'ナレッジベース "{name}" を削除してもよろしいですか？この操作は取り消せません。',
      cancelBtn: "キャンセル",
      status: {
        idle: "削除",
        deleting: "削除中...",
        deleteSuccess: "削除成功",
        deleteFailed: "削除失敗",
      },
    },
  },
};

export default adminDashboard;
