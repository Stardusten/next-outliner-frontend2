const blockProperties = {
  addProperty: "+ 添加属性",
  propertyTypes: {
    decimal: "小数",
    float: "浮点数",
    plaintext: "纯文本",
    richtext: "富文本",
    date: "日期",
    datetime: "日期时间",
    select: "单选",
    multiselect: "多选",
    checkbox: "复选框",
    email: "电子邮件",
    phone: "电话",
  },
  editDialog: {
    title: "编辑属性",
    description: "在此修改属性。完成后点击保存。",
    type: "类型",
    key: "键",
    value: "值",
    unsavedChanges: "有未保存的更改",
    save: "保存",
    cancel: "取消",
  },
  tooltips: {
    editProperty: "编辑属性",
    deleteProperty: "删除属性",
    propertyType: "属性类型：{type}",
    configOptions: "配置选项",
  },
  optionsDialog: {
    title: "配置选项",
    description: "添加或删除该属性的选项。",
    optionPlaceholder: "输入选项值",
    addOption: "添加选项",
    save: "保存",
    cancel: "取消",
    duplicateOptions: "不允许重复的选项",
  },
};

export default blockProperties;
