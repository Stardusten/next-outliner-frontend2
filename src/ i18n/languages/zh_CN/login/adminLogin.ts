const adminLogin = {
  title: "管理员登录",
  serverUrlLabel: "服务器 URL",
  serverUrlPlaceholder: "输入服务器 URL，例如 http://43.134.1.60/:8081",
  passwordLabel: "密码",
  kbEditorLoginBtn: "知识库编辑者登陆",
  loginBtn: {
    idle: "登录",
    loggingIn: "登录中...",
    loginSuccess: "登录成功",
    invalidServerUrl: "登陆失败",
    invalidPassword: "登陆失败",
    maxAttempts: "登陆失败",
    cannotConnectToServer: "登陆失败",
  },
  errMsg: {
    invalidServerUrl: "URL 格式不正确",
    invalidPassword: "密码错误",
    maxAttempts: "达到最大尝试次数，请稍后再试",
    cannotConnectToServer: "无法连接到服务器",
  },
};

export default adminLogin;
