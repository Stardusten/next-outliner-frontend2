const kbEditorLogin = {
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
    loginFailed: "登录失败",
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
};

export default kbEditorLogin;
