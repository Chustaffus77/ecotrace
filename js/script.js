// app.js

// ==========================================================
// Gerenciamento de Estado e Configuração
// ==========================================================
const AppState = {
  currentUser: null,
  isInitialized: false
};

// ==========================================================
// Sistema de Popup Melhorado
// ==========================================================
class PopupManager {
  constructor() {
    this.popup = document.getElementById("popup");
    this.timeoutId = null;
  }

  show(msg, type = "ok") {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (!this.popup) return console.warn('Elemento #popup não encontrado');
    this.popup.textContent = msg;
    this.popup.className = `popup ${type}`;
    this.popup.classList.remove("hidden");
    this.timeoutId = setTimeout(() => this.hide(), 3000);
  }

  hide() {
    if (!this.popup) return;
    this.popup.classList.add("hidden");
    this.timeoutId = null;
  }
}
const popupManager = new PopupManager();

// ==========================================================
// Sistema de Loading
// ==========================================================
class LoadingManager {
  constructor() {
    this.loadingElement = document.getElementById("loading");
  }
  show() { if (this.loadingElement) this.loadingElement.classList.remove("hidden"); }
  hide() { if (this.loadingElement) this.loadingElement.classList.add("hidden"); }
  toggle(show) { if (this.loadingElement) this.loadingElement.classList.toggle("hidden", !show); }
}
const loadingManager = new LoadingManager();

// ==========================================================
// Sistema de Abas
// ==========================================================
class TabManager {
  constructor() {
    this.tabs = document.querySelectorAll('.aba');
    this.buttons = document.querySelectorAll('.tab');
    this.init();
  }
  init() {
    this.buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const targetAba = e.target.getAttribute('data-target');
        if (targetAba) this.showTab(targetAba);
      });
    });
  }
  showTab(abaId) {
    if (!document.getElementById(abaId)) return console.error(`Aba ${abaId} não encontrada`);
    this.tabs.forEach(tab => tab.classList.remove('active'));
    this.buttons.forEach(btn => btn.classList.remove('active'));
    document.getElementById(abaId).classList.add('active');
    const activeButton = document.querySelector(`[data-target="${abaId}"]`);
    if (activeButton) activeButton.classList.add('active');
  }
}

// ==========================================================
// Firebase Service (modular, v9.22.2)
// ==========================================================
class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.providers = new Map();
  }

  async initialize() {
    try {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js");
      const authModule = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
      const firestoreModule = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");

      const { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, setPersistence, browserLocalPersistence } = authModule;
      const { getFirestore } = firestoreModule;

      const firebaseConfig = {
        apiKey: "AIzaSyAe7mU1MyCwrBmJlm89cKM-WHONzeqyU3w",
        authDomain: "projeto-ecotrace.firebaseapp.com",
        projectId: "projeto-ecotrace",
        storageBucket: "projeto-ecotrace.firebasestorage.app",
        messagingSenderId: "528782336744",
        appId: "1:528782336744:web:1f4b1fa4807543ff225f5d",
        measurementId: "G-RTWLGJD188"
      };

      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      await setPersistence(this.auth, browserLocalPersistence);
      this.db = getFirestore(this.app);

      // Inicializa provedores OAuth
      this.providers.set('google', new GoogleAuthProvider());
      this.providers.set('facebook', new FacebookAuthProvider());
      this.providers.set('microsoft', new OAuthProvider('microsoft.com'));

      AppState.isInitialized = true;
      console.log('Firebase inicializado com sucesso (v9.22.2)');
    } catch (error) {
      console.error('Erro ao inicializar Firebase:', error);
      throw error;
    }
  }

  async signInWithEmail(email, password) {
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async createUserWithEmail(email, password) {
    const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
    return await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async signInWithProvider(providerName) {
    const { signInWithPopup } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
    const provider = this.providers.get(providerName);
    if (!provider) throw new Error(`Provedor ${providerName} não configurado`);
    return await signInWithPopup(this.auth, provider);
  }

  async saveUserData(uid, userData) {
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");
    return await setDoc(doc(this.db, "usuarios", uid), userData, { merge: true });
  }

  async getUserData(uid) {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");
    const userDoc = await getDoc(doc(this.db, "usuarios", uid));
    return userDoc.exists() ? userDoc.data() : null;
  }

  async signOut() {
    const { signOut } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
    return await signOut(this.auth);
  }

  onAuthStateChanged(callback) {
    return import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js")
      .then(mod => mod.onAuthStateChanged(this.auth, callback));
  }
}
const firebaseService = new FirebaseService();

// ==========================================================
// Authentication Service
// ==========================================================
class AuthService {
  constructor() {
    this.firebaseService = firebaseService;
  }

  async handleEmailLogin(email, password) {
    try {
      loadingManager.show();
      await this.firebaseService.signInWithEmail(email, password);
      popupManager.show("Login realizado com sucesso!", "ok");
      setTimeout(() => { window.location.href = "index.html"; }, 900);
    } catch (error) {
      console.error('Login error:', error);
      popupManager.show(this.getFriendlyErrorMessage(error.code), "erro");
      throw error;
    } finally {
      loadingManager.hide();
    }
  }

  async handleEmailSignUp(nome, email, password) {
    try {
      loadingManager.show();
      const userCredential = await this.firebaseService.createUserWithEmail(email, password);
      const user = userCredential.user;

      // Todos os usuários recebem role "user" automaticamente
      await this.firebaseService.saveUserData(user.uid, {
        nome,
        email,
        uid: user.uid,
        role: "user",
        dataCriacao: new Date().toISOString()
      });

      await this.firebaseService.signOut();
      popupManager.show("Conta criada com sucesso! Faça login.", "ok");
      setTimeout(() => { window.location.href = "login_cadastro.html"; }, 900);
    } catch (error) {
      console.error('SignUp error:', error);
      popupManager.show(this.getFriendlyErrorMessage(error.code), "erro");
      throw error;
    } finally {
      loadingManager.hide();
    }
  }

  async handleOAuthLogin(providerName) {
    try {
      loadingManager.show();
      const providerNames = { 'google': 'Google', 'facebook': 'Facebook', 'microsoft': 'Microsoft' };
      await this.firebaseService.signInWithProvider(providerName);
      popupManager.show(`Login com ${providerNames[providerName]} realizado!`, "ok");
      setTimeout(() => { window.location.href = "index.html"; }, 900);
    } catch (error) {
      console.error('OAuth error:', error);
      popupManager.show(this.getFriendlyErrorMessage(error.code), "erro");
      throw error;
    } finally {
      loadingManager.hide();
    }
  }

  async logout() {
    try {
      await this.firebaseService.signOut();
      AppState.currentUser = null;
      popupManager.show('Deslogado com sucesso', 'ok');
      setTimeout(() => window.location.href = 'login_cadastro.html', 700);
    } catch (error) {
      console.error('Logout error:', error);
      popupManager.show('Falha ao deslogar', 'erro');
    }
  }

  getFriendlyErrorMessage(errorCode) {
    const messages = {
      'auth/invalid-email': 'E-mail inválido.',
      'auth/user-disabled': 'Esta conta foi desativada.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/email-already-in-use': 'Este e-mail já está em uso.',
      'auth/weak-password': 'A senha é muito fraca.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/popup-closed-by-user': 'Login cancelado pelo usuário.',
      'auth/operation-not-allowed': 'Operação não permitida.'
    };
    return messages[errorCode] || `Erro: ${errorCode || 'desconhecido'}`;
  }
}
const authService = new AuthService();

// ==========================================================
// Aplicação principal
// ==========================================================
class App {
  constructor() {
    this.tabManager = null;
    this.isInitialized = false;
    this.protectedPages = ['index.html', 'dashboard.html', 'profile.html', 'downloads.html'];
    this.publicOnlyPages = ['login_cadastro.html'];
    this.adminPage = 'dashboard.html';
  }

  async initialize() {
    try {
      await firebaseService.initialize();

      if (document.querySelectorAll('.aba').length) this.tabManager = new TabManager();

      this.setupEventListeners();
      this.unsubscribeAuth = await firebaseService.onAuthStateChanged(user => this.handleAuthStateChanged(user));
      this.isInitialized = true;
      console.log('Aplicação inicializada com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar aplicação:', error);
      popupManager.show('Erro ao inicializar aplicação. Recarregue a página.', 'erro');
    }
  }

  setupEventListeners() {
    const loginForm = document.getElementById("login");
    if (loginForm) loginForm.addEventListener("submit", async e => {
      e.preventDefault();
      await authService.handleEmailLogin(
        document.getElementById("login-email").value,
        document.getElementById("login-senha").value
      );
    });

    const cadastroForm = document.getElementById("cadastro") || document.getElementById("signup") || document.getElementById("cadastro-form");
    if (cadastroForm) cadastroForm.addEventListener("submit", async e => {
      e.preventDefault();
      await authService.handleEmailSignUp(
        (document.getElementById("cadastro-nome") || document.getElementById("nome")).value,
        (document.getElementById("cadastro-email") || document.getElementById("email")).value,
        (document.getElementById("cadastro-senha") || document.getElementById("senha")).value
      );
    });

    this.setupOAuthButtons();

    const logoutBtn = document.querySelector('[data-logout]');
    if (logoutBtn) logoutBtn.addEventListener('click', () => authService.logout());
  }

  setupOAuthButtons() {
    ['google','facebook','microsoft'].forEach(provider => {
      const button = document.querySelector(`[data-oauth="${provider}"]`);
      if (button) button.addEventListener('click', () => authService.handleOAuthLogin(provider));
    });
  }

 async handleAuthStateChanged(user) {
  AppState.currentUser = user || null;
  const currentPage = window.location.pathname.split('/').pop();

  // Usuário NÃO logado em página protegida → redireciona para login
  if (!user) {
    if (this.protectedPages.includes(currentPage)) {
      popupManager.show('Faça login para acessar esta página', 'erro');
      setTimeout(() => window.location.href = 'login_cadastro.html', 1500);
    }
    this.clearUserFromUI();
    return;
  }

  // Usuário logado → pega dados do Firestore
  const userData = await firebaseService.getUserData(user.uid);
  const role = userData?.role || "user";
  AppState.currentUser.role = role;

  // 🔹 Admin → sempre redireciona para dashboard, exceto se já estiver lá
  if (role === "admin") {
    if (currentPage !== this.adminPage) {
      popupManager.show('Bem-vindo, Admin! Redirecionando...', 'admin');
      setTimeout(() => window.location.href = this.adminPage, 1500);
      return; // interrompe a função para evitar redirecionamento de usuário comum
    }
  }

  // 🔹 Usuário comum → redireciona do login para index
  if (role === "user" && currentPage === 'login_cadastro.html') {
    popupManager.show('Você já está logado! Redirecionando...', 'ok');
    setTimeout(() => window.location.href = 'index.html', 1500);
    return; // garante que nada mais seja executado
  }

  // Atualiza interface com dados do usuário
  this.applyUserToUI(userData);
} 


  applyUserToUI(userData) {
    const name = userData.nome || userData.displayName || userData.email || 'Usuário';
    const email = userData.email || '';
    document.querySelectorAll('[data-user="name"]').forEach(el => el.textContent = name);
    document.querySelectorAll('[data-user="email"]').forEach(el => el.textContent = email);
    document.querySelectorAll('[data-auth="protected"]').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('[data-auth="public"]').forEach(el => el.classList.add('hidden'));
  }

  clearUserFromUI() {
    document.querySelectorAll('[data-user="name"]').forEach(el => el.textContent = '');
    document.querySelectorAll('[data-user="email"]').forEach(el => el.textContent = '');
    document.querySelectorAll('[data-auth="protected"]').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('[data-auth="public"]').forEach(el => el.classList.remove('hidden'));
  }
}

// ==========================================================
// Funções de compatibilidade
// ==========================================================
function mostrarAba(aba) {
  if (window.app && window.app.tabManager) {
    window.app.tabManager.showTab(aba);
  } else {
    document.querySelectorAll('.aba').forEach(div => div.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
    const target = document.getElementById(aba);
    if (target) target.classList.add('active');
    const activeButton = document.querySelector(`[data-target="${aba}"]`);
    if (activeButton) activeButton.classList.add('active');
  }
}

// ==========================================================
// Globais
// ==========================================================
window.loginGoogle = () => authService.handleOAuthLogin('google');
window.loginFacebook = () => authService.handleOAuthLogin('facebook');
window.loginMicrosoft = () => authService.handleOAuthLogin('microsoft');
window.mostrarAba = mostrarAba;
function showPopup(msg, tipo = "ok") { popupManager.show(msg, tipo); }
function showLoading(show) { loadingManager.toggle(show); }

// ==========================================================
// Inicialização quando DOM pronto
// ==========================================================
document.addEventListener('DOMContentLoaded', async () => {
  window.app = new App();
  await window.app.initialize();
});
