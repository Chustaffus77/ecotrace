<script type="module">
  import { iniciarAuth } from "../js/auth.js";
  iniciarAuth();
</script>

// ==============================
//       AUTH.JS GLOBAL
// ==============================

// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// === SUA CONFIG DO FIREBASE ===
const firebaseConfig = {
        apiKey: "AIzaSyAe7mU1MyCwrBmJlm89cKM-WHONzeqyU3w",
        authDomain: "projeto-ecotrace.firebaseapp.com",
        projectId: "projeto-ecotrace",
        storageBucket: "projeto-ecotrace.firebasestorage.app",
        messagingSenderId: "528782336744",
        appId: "1:528782336744:web:1f4b1fa4807543ff225f5d",
        measurementId: "G-RTWLGJD188"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Função global para inicializar o menu
export function iniciarAuth() {
  const logadoDiv = document.getElementById("menu-logado");
  const deslogadoDiv = document.getElementById("menu-deslogado");
  const logoutBtn = document.getElementById("logout-btn");

  // Detectar mudança de login
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (logadoDiv) logadoDiv.style.display = "flex";
      if (deslogadoDiv) deslogadoDiv.style.display = "none";
    } else {
      if (logadoDiv) logadoDiv.style.display = "none";
      if (deslogadoDiv) deslogadoDiv.style.display = "flex";
    }
  });

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth).then(() => {
        window.location.href = "index.html"; // redireciona após logout
      });
    });
  }
}
