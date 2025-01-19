const adminLogin = {
  title: "管理者ログイン",
  serverUrlLabel: "サーバーURL",
  serverUrlPlaceholder: "サーバーURLを入力してください（例：http://43.134.1.60/:8081）",
  passwordLabel: "パスワード",
  kbEditorLoginBtn: "知識ベース編集者としてログイン",
  loginBtn: {
    idle: "ログイン",
    loggingIn: "ログイン中...",
    loginSuccess: "ログイン成功",
    invalidServerUrl: "ログイン失敗",
    invalidPassword: "ログイン失敗",
    maxAttempts: "ログイン失敗",
    cannotConnectToServer: "ログイン失敗",
  },
  errMsg: {
    invalidServerUrl: "URLの形式が正しくありません",
    invalidPassword: "パスワードが間違っています",
    maxAttempts: "試行回数の上限に達しました。しばらくしてからお試しください",
    cannotConnectToServer: "サーバーに接続できません",
  },
};

export default adminLogin;
