const blockProperties = {
  addProperty: "+ プロパティを追加",
  propertyTypes: {
    decimal: "小数",
    float: "浮動小数点",
    plaintext: "プレーンテキスト",
    richtext: "リッチテキスト",
    date: "日付",
    datetime: "日時",
    select: "選択",
    multiselect: "複数選択",
    checkbox: "チェックボックス",
    email: "メール",
    phone: "電話番号",
  },
  editDialog: {
    title: "プロパティを編集",
    description: "ここでプロパティを変更できます。完了したら保存をクリックしてください。",
    type: "タイプ",
    key: "キー",
    value: "値",
    unsavedChanges: "保存されていない変更があります",
    save: "保存",
    cancel: "キャンセル",
  },
  tooltips: {
    editProperty: "プロパティを編集",
    deleteProperty: "プロパティを削除",
    propertyType: "プロパティタイプ：{type}",
    configOptions: "オプションを設定",
  },
  optionsDialog: {
    title: "オプション設定",
    description: "このプロパティのオプションを追加または削除します。",
    optionPlaceholder: "オプション値を入力",
    addOption: "オプションを追加",
    save: "保存",
    cancel: "キャンセル",
    duplicateOptions: "重複したオプションは許可されません",
  },
};

export default blockProperties;
