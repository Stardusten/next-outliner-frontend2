const kbEditorLogin = {
  title: "知識ベースを開く",
  serverUrlLabel: "サーバーURL",
  serverUrlPlaceholder: "サーバーURLを入力してください（例：http://43.134.1.60/:8081）",
  noKbServerMsg:
    'このサーバーには知識ベースがありません。<a class="cursor-pointer">管理者としてログイン</a>して、コントロールパネルで新しい知識ベースを作成できます。',
  kbLocationLabel: "知識ベース",
  refreshKbListTooltip: "知識ベース一覧を更新",
  passwordLabel: "パスワード",
  adminLoginBtn: "管理者ログイン",
  serverStatus: {
    invalidURL: "URLの形式が正しくありません",
    connFailed: "接続に失敗しました",
    connecting: "接続中",
    connSuccess: "接続成功",
    noKbServer: "知識ベースサーバーがありません",
    loginFailed: "ログイン失敗",
  },
  loginStatus: {
    idle: "待機中",
    loggingIn: "ログイン中",
    loginSuccess: "ログイン成功",
    loginFailed_InvalidPassword: "パスワードが間違っています",
    loginFailed_Unknown: "不明なエラーが発生しました。サーバー管理者にお問い合わせください",
  },
  loginBtn: {
    idle: "ログイン",
    loggingIn: "ログイン中...",
    loginSuccess: "ログイン成功",
    loginFailed_InvalidPassword: "ログイン",
    loginFailed_Unknown: "ログイン",
  },
};

export default kbEditorLogin;
