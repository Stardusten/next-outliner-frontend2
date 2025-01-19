const attachmentsManager = {
  title: "添付ファイル管理",
  description: "すべての添付ファイルを管理",
  upload: "アップロード",
  uploading: "アップロード中...",
  noFiles: "ファイルがありません",
  searchPlaceholder: "ファイルを検索...",
  filterByType: "種類で絞り込む",
  allFiles: "すべてのファイル",
  folders: "フォルダ",
  images: "画像",
  documents: "文書",
  audio: "音声",
  video: "動画",
  others: "その他",
  sortBy: "並び替え",
  sortByName: "名前順",
  sortByDate: "日付順",
  sortBySize: "サイズ順",
  refreshing: "更新中...",
  refreshed: "更新完了",
  uploadSuccess: {
    title: "アップロード成功",
    description: "{0}個のファイルをアップロードしました",
  },
  uploadError: {
    title: "アップロード失敗",
    duplicateFiles: "以下のファイルは既に存在します: {0}",
    unknown: "不明なエラー",
  },
  previewPane: {
    openPreview: "プレビュー",
    download: "ダウンロード",
    reference: "ブロック参照を挿入",
    pathReference: "パス参照を挿入",
    insertImage: "画像を挿入",
    fetchingImage: "画像読み込み中...",
    closePreview: "プレビューを閉じる",
    delete: "削除",
    info: "詳細情報",
  },
  uploadStatus: {
    idle: "待機中",
    uploading: "アップロード中...",
    success: "アップロード成功",
    failed: "アップロード失敗",
  },
  fetchFilesStatus: {
    idle: "待機中",
    fetching: "ファイル一覧を取得中...",
    success: "ファイル一覧の取得に成功",
    failed: "ファイル一覧の取得に失敗",
  },
  actions: {
    rename: "名前変更",
    copy: "コピー",
    info: "詳細情報",
    delete: "削除",
    download: "ダウンロード",
    refresh: "更新",
    preview: "プレビュー",
  },
  hiddenFiles: "{count}個のファイルが非表示",
  rename: {
    title: "名前変更",
    description: "新しいファイル名を入力してください",
    newNameLabel: "新しいファイル名",
    newNamePlaceholder: "新しいファイル名を入力",
    cancelBtn: "キャンセル",
    submitBtn: "適用",
    error: {
      emptyName: "ファイル名を入力してください",
      sameName: "新しい名前が現在の名前と同じです",
      duplicateName: "この名前は既に使用されています",
    },
  },
  renameSuccess: {
    title: "名前変更成功",
    description: "ファイル名を変更しました",
  },
  renameError: {
    title: "名前変更失敗",
    unknown: "不明なエラー",
  },
  delete: {
    title: "ファイルの削除",
    description: "このファイルを削除してもよろしいですか？",
    folderWarning: "フォルダを削除すると、含まれるすべてのファイルが削除されます。",
    fileCount: "このフォルダには{count}個のファイルが含まれています",
    warning: "この操作は取り消せません",
    cancelBtn: "キャンセル",
    submitBtn: "削除",
  },
  deleteSuccess: {
    title: "削除成功",
    description: "ファイルを削除しました",
  },
  deleteError: {
    title: "削除失敗",
    unknown: "不明なエラー",
  },
  downloadError: {
    title: "ダウンロード失敗",
    unknown: "不明なエラー",
  },
  info: {
    title: "ファイル情報",
    name: "名前",
    path: "パス",
    type: "種類",
    size: "サイズ",
    modifiedTime: "更新日時",
    createdTime: "作成日時",
    closeBtn: "閉じる",
  },
  selectFileToPreview: "プレビューするファイルを選択",
  fileNotPreviewable: "このファイル形式はプレビューに対応していません",
  tooltip: {
    showPreview: "プレビューパネルを表示",
    hidePreview: "プレビューパネルを非表示",
    filter: "ファイルを絞り込む",
    sort: "ファイルを並び替え",
  },
};

export default attachmentsManager;
