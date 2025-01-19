const kbEditorLogin = {
  title: "Open Knowledge Base",
  serverUrlLabel: "Server URL",
  serverUrlPlaceholder: "Enter server URL, e.g., http://43.134.1.60/:8081",
  noKbServerMsg:
    'No knowledge bases found on this server. You can <a class="cursor-pointer">login as administrator</a> and create new knowledge bases in the control panel.',
  kbLocationLabel: "Knowledge Base",
  refreshKbListTooltip: "Refresh Knowledge Base List",
  passwordLabel: "Password",
  adminLoginBtn: "Admin Login",
  serverStatus: {
    invalidURL: "Invalid URL format",
    connFailed: "Connection failed",
    connecting: "Connecting",
    connSuccess: "Connected successfully",
    noKbServer: "No knowledge base server",
    loginFailed: "Login failed",
  },
  loginStatus: {
    idle: "Idle",
    loggingIn: "Logging in",
    loginSuccess: "Login successful",
    loginFailed_InvalidPassword: "Incorrect password",
    loginFailed_Unknown: "Unknown error, please contact server administrator",
  },
  loginBtn: {
    idle: "Login",
    loggingIn: "Logging in...",
    loginSuccess: "Login successful",
    loginFailed_InvalidPassword: "Login",
    loginFailed_Unknown: "Login",
  },
};

export default kbEditorLogin;
