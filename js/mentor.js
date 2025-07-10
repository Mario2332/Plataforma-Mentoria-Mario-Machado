// =================================================================
// SCRIPT DA ÁREA DO MENTOR (VERSÃO COM VISUALIZAÇÃO DE MÉTRICAS)
// =================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { configurarModalPrincipal, showCustomAlert, showCustomConfirm } from './shared.js';


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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


onAuthStateChanged(auth, (user) => {
    const naPaginaDeLogin = window.location.pathname.includes('mentor-login.html') || window.location.pathname === '/';
    if (user) {
        if (naPaginaDeLogin) {
            window.location.href = 'mentor-dashboard.html';
        } else {
            configurarDashboard();
        }
    } else {
        if (!naPaginaDeLogin) {
            window.location.href = 'mentor-login.html';
        }
    }
});

async function fazerLoginMentor() {
    const emailInput = document.getElementById('mentor-email');
    const senhaInput = document.getElementById('mentor-senha');
    if (!emailInput || !senhaInput) return;
    const email = emailInput.value;
    const senha = senhaInput.value;
    if (!email || !senha) { showCustomAlert("Por favor, preencha e-mail e senha.", "erro"); return; }
    try {
        await signInWithEmailAndPassword(auth, email, senha);
    } catch (error) {
        showCustomAlert("Falha no login. Verifique seu e-mail e senha.", "erro");
    }
}
const botaoMentorLogin = document.getElementById('botao-mentor-login');
if (botaoMentorLogin) {
    botaoMentorLogin.addEventListener('click', fazerLoginMentor);
}


function configurarDashboard() {
    const btnLogout = document.getElementById('btn-logout');
    const btnAddAluno = document.getElementById('btn-add-aluno');
    const modal = document.getElementById('add-aluno-modal');

    if (btnLogout) btnLogout.addEventListener('click', fazerLogout);
    if (btnAddAluno) btnAddAluno.addEventListener('click', abrirModalAddAluno);
    
    if (modal) {
        modal.querySelector('.close-modal-btn')?.addEventListener('click', fecharModalAddAluno);
        modal.querySelector('#btn-cancelar-add')?.addEventListener('click', fecharModalAddAluno);
        modal.querySelector('#form-add-aluno')?.addEventListener('submit', salvarNovoAluno);
        modal.querySelector('#btn-gerar-codigo')?.addEventListener('click', gerarCodigoUnico);
    }
    
    configurarModalPrincipal();
    carregarAlunos();
}

async function fazerLogout() {
    try { await signOut(auth); } catch (error) { showCustomAlert("Erro ao tentar sair.", "erro"); }
}

async function carregarAlunos() {
    const container = document.getElementById('lista-alunos-container');
    if (!container) return;
    container.innerHTML = "<p>Carregando alunos...</p>";

    try {
        const querySnapshot = await getDocs(collection(db, "alunos"));
        if (querySnapshot.empty) {
            container.innerHTML = '<p>Nenhum aluno cadastrado ainda.</p>';
            return;
        }
        let tabelaHtml = `<table><thead><tr><th>Nome do Aluno</th><th>Código de Acesso</th><th>Ações</th></tr></thead><tbody>`;
        querySnapshot.forEach((doc) => {
            const aluno = doc.data();
            // Adicionamos o ID e o Nome do aluno aos data-attributes da linha
            tabelaHtml += `<tr data-alunoid="${doc.id}" data-alunonome="${aluno.nome}">
                    <td>${aluno.nome}</td>
                    <td><code>${aluno.codigoDeAcesso}</code></td>
                    <td>
                        <button class="btn-tabela-ver">Ver Métricas</button>
                        <button class="btn-tabela-excluir">Excluir</button>
                    </td>
                </tr>`;
        });
        tabelaHtml += `</tbody></table>`;
        container.innerHTML = tabelaHtml;

        // Adiciona os eventos aos novos botões
        container.querySelectorAll('.btn-tabela-ver').forEach(button => {
            button.addEventListener('click', verMetricasAluno);
        });
        container.querySelectorAll('.btn-tabela-excluir').forEach(button => {
            button.addEventListener('click', confirmarExclusao);
        });

    } catch (error) {
        container.innerHTML = '<p>Ocorreu um erro ao carregar a lista de alunos.</p>';
    }
}

// --- FUNÇÃO PARA VER AS MÉTRICAS DO ALUNO ---
function verMetricasAluno(event) {
    const tr = event.currentTarget.closest('tr');
    const alunoId = tr.dataset.alunoid;
    const alunoNome = tr.dataset.alunonome;

    if (!alunoId || !alunoNome) {
        showCustomAlert("Não foi possível identificar o aluno.", "erro");
        return;
    }

    // Guarda os dados do aluno selecionado na memória da sessão
    sessionStorage.setItem('alunoId', alunoId);
    sessionStorage.setItem('alunoNome', alunoNome);

    // Abre o dashboard do aluno em uma nova aba para não perder a visão do mentor
    window.open('dashboard.html', '_blank');
}

function abrirModalAddAluno() {
    const modal = document.getElementById('add-aluno-modal');
    const form = document.getElementById('form-add-aluno');
    if(form) form.reset();
    gerarCodigoUnico();
    if(modal) modal.classList.remove('hidden');
}

function fecharModalAddAluno() {
    const modal = document.getElementById('add-aluno-modal');
    if(modal) modal.classList.add('hidden');
}

function gerarCodigoUnico() {
    const campoCodigo = document.getElementById('aluno-codigo');
    if(!campoCodigo) return;
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 8; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    campoCodigo.value = codigo;
}

async function salvarNovoAluno(event) {
    event.preventDefault();
    const nome = document.getElementById('aluno-nome').value.trim();
    const codigo = document.getElementById('aluno-codigo').value.trim();
    if (!nome || !codigo) {
        showCustomAlert("Por favor, preencha o nome e gere um código.", "erro");
        return;
    }
    try {
        await addDoc(collection(db, "alunos"), { nome: nome, codigoDeAcesso: codigo });
        showCustomAlert("Aluno adicionado com sucesso!");
        fecharModalAddAluno();
        carregarAlunos();
    } catch (error) {
        showCustomAlert("Ocorreu um erro ao salvar o aluno.", "erro");
    }
}

function confirmarExclusao(event) {
    const tr = event.currentTarget.closest('tr');
    const alunoId = tr.dataset.alunoid;
    const alunoNome = tr.dataset.alunonome;
    const mensagem = `Tem certeza que deseja excluir o aluno "${alunoNome}"?\nTodos os registros de estudo dele também serão perdidos. Esta ação não pode ser desfeita.`;
    
    showCustomConfirm(mensagem, () => {
        excluirAluno(alunoId);
    });
}

async function excluirAluno(alunoId) {
    if (!alunoId) return;
    try {
        await deleteDoc(doc(db, "alunos", alunoId));
        showCustomAlert("Aluno excluído com sucesso!");
        carregarAlunos(); 
    } catch (error) {
        showCustomAlert("Ocorreu um erro ao tentar excluir o aluno.", "erro");
    }
}