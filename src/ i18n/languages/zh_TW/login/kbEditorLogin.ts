const kbEditorLogin = {
  title: "開啟知識庫",
  serverUrlLabel: "伺服器 URL",
  serverUrlPlaceholder: "輸入伺服器 URL，例如 http://43.134.1.60/:8081",
  noKbServerMsg:
    '此伺服器上沒有知識庫，你可以<a class="cursor-pointer">以管理員身份登入</a>，然後在控制面板建立新知識庫。',
  kbLocationLabel: "知識庫",
  refreshKbListTooltip: "重新整理知識庫列表",
  passwordLabel: "密碼",
  adminLoginBtn: "管理員登入",
  serverStatus: {
    invalidURL: "URL 格式不正確",
    connFailed: "連線失敗",
    connecting: "連線中",
    connSuccess: "連線成功",
    noKbServer: "沒有知識庫伺服器",
    loginFailed: "登入失敗",
  },
  loginStatus: {
    idle: "閒置",
    loggingIn: "登入中",
    loginSuccess: "登入成功",
    loginFailed_InvalidPassword: "密碼錯誤",
    loginFailed_Unknown: "未知錯誤，請聯絡伺服器管理員",
  },
  loginBtn: {
    idle: "登入",
    loggingIn: "登入中...",
    loginSuccess: "登入成功",
    loginFailed_InvalidPassword: "登入",
    loginFailed_Unknown: "登入",
  },
};

export default kbEditorLogin;
