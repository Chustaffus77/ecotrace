/* ============================================================
   🔥 FIREBASE AUTH + FIRESTORE (MODULAR v9.22.2)
   ============================================================ */

// 🔐 VERIFICAR USUÁRIO VIA FIREBASE AUTH
async function verificarUsuarioLogado() {
    const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
    const auth = getAuth();

    return new Promise(resolve => {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                alert("🔒 Você precisa estar logado para acessar o diagnóstico!");
                window.location.href = "login_cadastro.html";
                resolve(null);
            } else {
                resolve(user);
            }
        });
    });
}

// 🔍 Buscar dados extras do usuário no Firestore
async function buscarInfoUsuario(uid) {
    const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");

    const db = getFirestore();
    const ref = doc(db, "usuarios", uid);
    const snap = await getDoc(ref);

    return snap.exists() ? snap.data() : null;
}

// 👤 Mostrar informações do usuário na tela
async function mostrarInfoUsuario() {
    const usuario = await verificarUsuarioLogado();
    if (!usuario) return;

    const dadosExtra = await buscarInfoUsuario(usuario.uid);

    const nome = dadosExtra?.nome || usuario.displayName || "Usuário";
    const empresa = dadosExtra?.empresa || usuario.email;

    const introScreen = document.getElementById("intro-screen");

    const userInfo = document.createElement("div");
    userInfo.className = "user-info";
    userInfo.innerHTML = `
        <div style="background: rgba(0, 255, 167, 0.1); padding: 15px; border-radius: 10px; margin: 20px 0; border: 1px solid rgba(0, 255, 167, 0.3);">
            <p style="margin: 0; color: var(--primary); font-weight: bold;">
                👋 Olá, <strong>${nome}</strong>!
                <br><small>Empresa: ${empresa}</small>
            </p>
            <button onclick="sair()" style="background: transparent; border: 1px solid var(--primary); color: var(--primary); padding: 5px 15px; border-radius: 5px; margin-top: 10px; cursor: pointer;">
                Sair
            </button>
        </div>
    `;

    const titulo = introScreen.querySelector(".intro-title");
    titulo.parentNode.insertBefore(userInfo, titulo.nextSibling);
}

// 🚪 Logout
async function sair() {
    const { getAuth, signOut } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");

    const auth = getAuth();
    await signOut(auth);

    window.location.href = "login_cadastro.html";
}

/* ============================================================
   📊 SALVAR OU SUBSTITUIR RESULTADO NO FIRESTORE
   ============================================================ */
async function salvarResultado(pontuacao, categoria) {
    const usuario = await verificarUsuarioLogado();
    if (!usuario) return;

    const respostas = coletarRespostas();
    const dadosExtra = await buscarInfoUsuario(usuario.uid);

    const registro = {
        usuarioId: usuario.uid,
        nome: dadosExtra?.nome || usuario.displayName || null,
        empresa: dadosExtra?.empresa || usuario.email,
        data: new Date(),
        pontuacao,
        categoria,
        respostas
    };

    const { getFirestore, doc, setDoc } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");
    const db = getFirestore();

    // Substitui qualquer diagnóstico anterior usando o UID do usuário como ID do documento
    const diagnosticoRef = doc(db, "diagnosticos", usuario.uid);
    await setDoc(diagnosticoRef, registro);

    console.log("📊 Diagnóstico salvo/substituído no Firestore!", registro);
}

/* ============================================================
   📋 SISTEMA DO QUESTIONÁRIO
   ============================================================ */

function iniciarQuestionario() {
    document.getElementById("intro-screen").classList.add("hidden");
    document.getElementById("form-container").classList.remove("hidden");
}

function voltarParaHome() {
    window.location.href = "index.html";
}

let passoAtual = 0;
const totalEtapas = 10;
const etapas = document.querySelectorAll("fieldset");
const progressBar = document.getElementById("progress-bar");
const progressPercent = document.getElementById("progress-percent");

function atualizarProgresso() {
    const progresso = ((passoAtual + 1) / totalEtapas) * 100;
    progressBar.style.width = `${progresso}%`;
    progressPercent.textContent = `${Math.round(progresso)}%`;
}

function mostrarEtapa() {
    etapas.forEach((etapa, i) => {
        etapa.classList.toggle("active", i === passoAtual);
    });
    atualizarProgresso();
}

function nextStep() {
    const campoAtual = document.querySelector(`fieldset.active input[type="radio"]:checked`);
    if (!campoAtual) {
        alert("Por favor, selecione uma opção antes de continuar.");
        return;
    }

    if (passoAtual < etapas.length - 1) {
        passoAtual++;
        mostrarEtapa();
    }
}

function prevStep() {
    if (passoAtual > 0) {
        passoAtual--;
        mostrarEtapa();
    } else {
        alert("Você já está na primeira pergunta!");
    }
}

function coletarRespostas() {
    const respostas = {};
    const perguntas = document.querySelectorAll("input[type='radio']:checked");

    perguntas.forEach(resposta => {
        respostas[resposta.name] = parseInt(resposta.value);
    });

    return respostas;
}

// =====================================================
// 🔥 SISTEMA AVANÇADO DE ANÁLISE DE SUSTENTABILIDADE
// =====================================================
function gerarDescricaoERecomendacoes(score) {
    const resultTitle = document.getElementById("result-title");
    const resultDescription = document.getElementById("result-description");
    const recommendations = document.getElementById("recommendations");

    const categorias = [
        {
            faixa: [90, 100],
            titulo: "Líder em Sustentabilidade",
            descricao: "Sua empresa demonstra excelência em práticas sustentáveis e serve como referência mundial.",
            intensidade: "Excelente",
            recomendações: [
                { item: "Participe de fóruns internacionais", tags: ["expansão", "prestígio"], peso: 3 },
                { item: "Busque certificações avançadas (LEED Platinum, ESG+)", tags: ["certificação"], peso: 4 },
                { item: "Mentore outras empresas iniciantes", tags: ["liderança"], peso: 2 }
            ]
        },
        {
            faixa: [75, 89],
            titulo: "Avançado em Sustentabilidade",
            descricao: "Desempenho sólido, com grande potencial para se tornar referência nacional.",
            intensidade: "Muito bom",
            recomendações: [
                { item: "Implante metas de carbono zero", tags: ["carbono"], peso: 4 },
                { item: "Amplie certificações internacionais", tags: ["certificação"], peso: 3 },
                { item: "Estabeleça parcerias com ONGs ambientais", tags: ["parcerias"], peso: 2 }
            ]
        },
        {
            faixa: [60, 74],
            titulo: "Em Transição Sustentável",
            descricao: "Bom caminho percorrido, mas ainda há pontos estratégicos a evoluir.",
            intensidade: "Moderado",
            recomendações: [
                { item: "Monte um comitê interno de sustentabilidade", tags: ["governança"], peso: 3 },
                { item: "Estabeleça metas mensuráveis (KPIs ESG)", tags: ["planejamento"], peso: 4 },
                { item: "Promova treinamentos internos contínuos", tags: ["educação"], peso: 2 }
            ]
        },
        {
            faixa: [40, 59],
            titulo: "Iniciante",
            descricao: "Sua empresa iniciou a jornada, mas ainda há bastante espaço para evolução.",
            intensidade: "Baixo",
            recomendações: [
                { item: "Realize auditorias ambientais trimestrais", tags: ["auditoria"], peso: 3 },
                { item: "Estruture um plano de ação sustentável", tags: ["planejamento"], peso: 4 },
                { item: "Comece com projetos simples e de impacto rápido", tags: ["execução"], peso: 2 }
            ]
        },
        {
            faixa: [0, 39],
            titulo: "Atenção Imediata",
            descricao: "Níveis críticos. É essencial agir rapidamente para evitar prejuízos futuros.",
            intensidade: "Crítico",
            recomendações: [
                { item: "Contrate consultoria especializada em ESG", tags: ["consultoria"], peso: 5 },
                { item: "Implemente políticas ambientais básicas", tags: ["política"], peso: 4 },
                { item: "Eduque e conscientize sua equipe", tags: ["educação"], peso: 3 }
            ]
        }
    ];

    const bloco = categorias.find(cat => score >= cat.faixa[0] && score <= cat.faixa[1]);
    if (!bloco) return console.error("Score inválido:", score);

    resultTitle.textContent = `${bloco.titulo} — (${bloco.intensidade})`;
    resultDescription.textContent = bloco.descricao;

    resultTitle.style.opacity = "0";
    resultDescription.style.opacity = "0";

    setTimeout(() => {
        resultTitle.style.transition = "opacity .4s";
        resultDescription.style.transition = "opacity .4s";
        resultTitle.style.opacity = "1";
        resultDescription.style.opacity = "1";
    }, 100);

    recommendations.innerHTML = "<h3>Recomendações Prioritárias</h3>";

    bloco.recomendações
        .sort((a, b) => b.peso - a.peso)
        .forEach(rec => {
            const div = document.createElement("div");
            div.className = "recommendation-item";
            div.innerHTML = `
                <strong>${rec.item}</strong>
                <span class="rec-tags">(${rec.tags.join(", ")}) • Prioridade: ${rec.peso}</span>
            `;
            recommendations.appendChild(div);
        });
}

// =====================================================
// 🔥 EXIBIR ÚLTIMO RESULTADO SALVO PELO UID
// =====================================================
window.mostrarUltimoResultado = async function () {
    const usuario = await verificarUsuarioLogado();
    if (!usuario) return;

    try {
        const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");
        const db = getFirestore();
        const diagnosticoRef = doc(db, "diagnosticos", usuario.uid);
        const snap = await getDoc(diagnosticoRef);

        if (snap.exists()) {
            const ultimo = snap.data();

            document.getElementById("intro-screen").style.display = "none";
            document.getElementById("form-container").classList.remove("hidden");
            document.getElementById("formulario").style.display = "none";

            document.getElementById("resultado").style.display = "block";
            document.getElementById("score-circle").textContent = ultimo.pontuacao;

            gerarDescricaoERecomendacoes(ultimo.pontuacao);

            console.log("Último diagnóstico carregado:", ultimo);
        } else {
            alert("Nenhum diagnóstico anterior encontrado.");
        }
    } catch (error) {
        console.error("Erro ao buscar último diagnóstico:", error);
        alert("Erro ao carregar diagnóstico anterior.");
    }
};

// =====================================================
// 🔥 VERIFICAR SE USUÁRIO TEM DIAGNÓSTICO ANTERIOR PELO UID
// =====================================================
async function verificarDiagnosticoAnterior() {
    const usuario = await verificarUsuarioLogado();
    if (!usuario) return;

    try {
        const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");
        const db = getFirestore();
        const diagnosticoRef = doc(db, "diagnosticos", usuario.uid);
        const snap = await getDoc(diagnosticoRef);

        const btnLastResult = document.getElementById("btn-last-result");
        if (snap.exists() && btnLastResult) {
            btnLastResult.classList.remove("hidden");
            btnLastResult.onclick = mostrarUltimoResultado;
        }
    } catch (error) {
        console.error("Erro ao verificar diagnóstico anterior:", error);
    }
}

// =====================================================
// 🔥 CALCULAR RESULTADO E SALVAR
// =====================================================
function calcularResultado() {
    const ultimaPergunta = document.querySelector("fieldset:last-child input[type='radio']:checked");
    if (!ultimaPergunta) {
        alert("Por favor, responda a última pergunta antes de ver o resultado.");
        return;
    }

    const respostas = coletarRespostas();
    let pontuacaoTotal = 0;
    let maxPontuacao = Object.keys(respostas).length * 5;
    Object.values(respostas).forEach(v => pontuacaoTotal += v);

    const percentual = Math.round((pontuacaoTotal / maxPontuacao) * 100);

    document.getElementById("formulario").style.display = "none";
    document.getElementById("resultado").style.display = "block";
    document.getElementById("score-circle").textContent = percentual;

    gerarDescricaoERecomendacoes(percentual);

    let categoria = "";
    if (percentual >= 90) categoria = "Líder em Sustentabilidade";
    else if (percentual >= 75) categoria = "Avançado em Sustentabilidade";
    else if (percentual >= 60) categoria = "Em Transição Sustentável";
    else if (percentual >= 40) categoria = "Iniciante";
    else categoria = "Atenção Imediata";

    salvarResultado(percentual, categoria);
}

function reiniciarQuestionario() {
    document.querySelectorAll("input[type='radio']").forEach(i => i.checked = false);

    passoAtual = 0;
    document.getElementById("formulario").style.display = "block";
    document.getElementById("resultado").style.display = "none";
    document.getElementById("recommendations").innerHTML = "<h3>Recomendações</h3>";

    mostrarEtapa();
}

/* ============================================================
   🚀 INICIALIZAÇÃO
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await verificarUsuarioLogado();
    if (usuario) {
        mostrarInfoUsuario();
        verificarDiagnosticoAnterior();
    }
});
