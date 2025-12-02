  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
    import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
    

    // ==== CONFIGURAÇÃO FIREBASE ====
    const firebaseConfig = {
      apiKey: "AIzaSyAe7mU1MyCwrBmJlm89cKM-WHONzeqyU3w",
      authDomain: "projeto-ecotrace.firebaseapp.com",
      projectId: "projeto-ecotrace",
      storageBucket: "projeto-ecotrace.firebasestorage.app",
      messagingSenderId: "528782336744",
      appId: "1:528782336744:web:1f4b1fa4807543ff225f5d",
      measurementId: "G-RTWLGJD188"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // ELEMENTOS
    const sideMenu = document.getElementById("side-menu");
    const overlay = document.getElementById("menu-overlay");
    const perfilBtn = document.getElementById("perfil");
    const closeBtn = document.getElementById("close-menu");
    const logadoDiv = document.getElementById("menu-logado");
    const deslogadoDiv = document.getElementById("menu-deslogado");
    const logoutBtn = document.getElementById("logout-btn");
    const nomeUsuarioH3 = document.getElementById("nome-usuario");

    

    // DETECTA LOGIN
    let notificou = false;
    onAuthStateChanged(auth, (user) => {
      if (user) {
        logadoDiv.style.display = "flex";
        deslogadoDiv.style.display = "none";

        const nome = user.displayName || user.email.split("@")[0];
        nomeUsuarioH3.textContent = nome;

        if (!notificou) {
          mostrarNotificacao(`Bem-vindo de volta, ${nome}!`);
          notificou = true;
        }
      } else {
        logadoDiv.style.display = "none";
        deslogadoDiv.style.display = "flex";
        nomeUsuarioH3.textContent = "Visitante";
      }
    });

    // LOGOUT
    logoutBtn?.addEventListener("click", () => {
      signOut(auth).then(() => {
        window.location.href = "index.html";
      });
    });

    // ABRIR / FECHAR MENU
    perfilBtn.addEventListener("click", () => {
      sideMenu.classList.add("open");
      overlay.classList.add("active");
    });

    closeBtn.addEventListener("click", () => {
      sideMenu.classList.remove("open");
      overlay.classList.remove("active");
    });

    overlay.addEventListener("click", () => {
      sideMenu.classList.remove("open");
      overlay.classList.remove("active");
    });









    