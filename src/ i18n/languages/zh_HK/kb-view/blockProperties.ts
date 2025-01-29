const blockProperties = {
  addProperty: "+ 新增屬性",
  propertyTypes: {
    decimal: "小數",
    float: "浮點數",
    plaintext: "純文字",
    richtext: "富文字",
    date: "日期",
    datetime: "日期時間",
    select: "單選",
    multiselect: "多選",
    checkbox: "複選框",
    email: "電郵",
    phone: "電話",
  },
  editDialog: {
    title: "編輯屬性",
    description: "在此修改屬性。完成後點擊保存。",
    type: "類型",
    key: "鍵",
    value: "值",
    unsavedChanges: "有未保存的更改",
    save: "保存",
    cancel: "取消",
  },
  tooltips: {
    editProperty: "編輯屬性",
    deleteProperty: "刪除屬性",
    propertyType: "屬性類型：{type}",
    configOptions: "配置選項",
  },
  optionsDialog: {
    title: "配置選項",
    description: "添加或刪除該屬性的選項。",
    optionPlaceholder: "輸入選項值",
    addOption: "添加選項",
    save: "保存",
    cancel: "取消",
    duplicateOptions: "不允許重複的選項",
  },
};

export default blockProperties;
