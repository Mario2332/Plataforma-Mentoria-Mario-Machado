// =================================================================
// SCRIPT DA ÁREA DO MENTOR (VERSÃO COM LISTAGEM DE ALUNOS)
// =================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Suas credenciais do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCL2Lx5ccKeGVpybuxKZKLRscWYbcPgjJc",
    authDomain: "mentoria-mario-machado.firebaseapp.com",
    projectId: "mentoria-mario-machado",
    storageBucket: "mentoria-mario-machado.firebasestorage.app",
    messagingSenderId: "855508085159",
    appId: "1:855508085159:web:32f0dfe2f8244435796e82",
    measurementId: "G-Q5603DS6NP"
};

// Inicializa o Firebase e os serviços
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- ROTEAMENTO E CONTROLE DE ACESSO ---

onAuthStateChanged(auth, (user) => {
    const naPaginaDeLogin = window.location.pathname.endsWith('mentor-login.html');
    
    if (user) {
        // Usuário está logado
        if (naPaginaDeLogin) {
            // Se está na página de login, redireciona para o dashboard
            window.location.href = 'mentor-dashboard.html';
        } else {
            // Se está na página certa (dashboard), busca os dados
            carregarAlunos();
        }
    } else {
        // Usuário não está logado
        if (!naPaginaDeLogin) {
            // Se não está na página de login, redireciona para lá
            window.location.href = 'mentor-login.html';
        }
    }
});


// --- LÓGICA DA PÁGINA DE LOGIN DO MENTOR ---
async function fazerLoginMentor() {
    const email = document.getElementById('mentor-email').value;
    const senha = document.getElementById('mentor-senha').value;
    if (!email || !senha) { alert("Por favor, preencha e-mail e senha."); return; }
    try {
        await signInWithEmailAndPassword(auth, email, senha);
    } catch (error) {
        alert("Falha no login. Verifique seu e-mail e senha.");
    }
}
const botaoMentorLogin = document.getElementById('botao-mentor-login');
if (botaoMentorLogin) {
    botaoMentorLogin.addEventListener('click', fazerLoginMentor);
}


// --- LÓGICA DA PÁGINA DE DASHBOARD DO MENTOR ---
async function fazerLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        alert("Erro ao tentar sair.");
    }
}
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', fazerLogout);
}

// NOVA FUNÇÃO: Buscar e exibir os alunos
async function carregarAlunos() {
    const container = document.getElementById('lista-alunos-container');
    if (!container) return;

    try {
        const querySnapshot = await getDocs(collection(db, "alunos"));
        
        if (querySnapshot.empty) {
            container.innerHTML = '<p>Nenhum aluno cadastrado ainda.</p>';
            return;
        }

        // Monta a estrutura da tabela
        let tabelaHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Nome do Aluno</th>
                        <th>Código de Acesso</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Adiciona uma linha para cada aluno
        querySnapshot.forEach((doc) => {
            const aluno = doc.data();
            tabelaHtml += `
                <tr>
                    <td>${aluno.nome}</td>
                    <td><code>${aluno.codigoDeAcesso}</code></td>
                    <td>
                        <button class="btn-tabela-ver">Ver Métricas</button>
                    </td>
                </tr>
            `;
        });

        tabelaHtml += `</tbody></table>`;
        container.innerHTML = tabelaHtml;

    } catch (error) {
        console.error("Erro ao carregar alunos: ", error);
        container.innerHTML = '<p>Ocorreu um erro ao carregar a lista de alunos.</p>';
    }
}