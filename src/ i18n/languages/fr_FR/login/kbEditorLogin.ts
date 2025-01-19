const kbEditorLogin = {
  title: "Ouvrir la base de connaissances",
  serverUrlLabel: "URL du serveur",
  serverUrlPlaceholder: "Entrez l'URL du serveur, par exemple http://43.134.1.60/:8081",
  noKbServerMsg:
    'Aucune base de connaissances sur ce serveur. Vous pouvez <a class="cursor-pointer">vous connecter en tant qu\'administrateur</a> et en créer une nouvelle dans le panneau de contrôle.',
  kbLocationLabel: "Base de connaissances",
  refreshKbListTooltip: "Actualiser la liste des bases de connaissances",
  passwordLabel: "Mot de passe",
  adminLoginBtn: "Connexion administrateur",
  serverStatus: {
    invalidURL: "Format d'URL incorrect",
    connFailed: "Échec de la connexion",
    connecting: "Connexion en cours",
    connSuccess: "Connexion réussie",
    noKbServer: "Aucun serveur de base de connaissances",
    loginFailed: "Échec de la connexion",
  },
  loginStatus: {
    idle: "En attente",
    loggingIn: "Connexion en cours",
    loginSuccess: "Connexion réussie",
    loginFailed_InvalidPassword: "Mot de passe incorrect",
    loginFailed_Unknown: "Erreur inconnue, veuillez contacter l'administrateur du serveur",
  },
  loginBtn: {
    idle: "Se connecter",
    loggingIn: "Connexion en cours...",
    loginSuccess: "Connexion réussie",
    loginFailed_InvalidPassword: "Se connecter",
    loginFailed_Unknown: "Se connecter",
  },
};

export default kbEditorLogin;
