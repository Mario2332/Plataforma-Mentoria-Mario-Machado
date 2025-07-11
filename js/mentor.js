// =================================================================
// SCRIPT DA ÁREA DO MENTOR (VERSÃO FINAL COM EDITOR DE TEXTO)
// =================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, where, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { configurarModalPrincipal, showCustomAlert, showCustomConfirm } from './shared.js';

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

let todosOsAlunos = [];
let quillEditor = null;

onAuthStateChanged(auth, (user) => {
    const naPaginaDeLogin = window.location.pathname.includes('mentor-login.html') || window.location.pathname === '/';
    if (user) {
        if (naPaginaDeLogin) { window.location.href = 'mentor-dashboard.html'; }
        else { configurarDashboard(); }
    } else {
        if (!naPaginaDeLogin) { window.location.href = 'mentor-login.html'; }
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
    } catch (error) { showCustomAlert("Falha no login. Verifique seu e-mail e senha.", "erro"); }
}
const botaoMentorLogin = document.getElementById('botao-mentor-login');
if (botaoMentorLogin) { botaoMentorLogin.addEventListener('click', fazerLoginMentor); }

function configurarDashboard() {
    const btnLogout = document.getElementById('btn-logout');
    const btnAddAluno = document.getElementById('btn-add-aluno');
    const modalAdd = document.getElementById('add-aluno-modal');
    const modalNotas = document.getElementById('notas-modal');
    const inputPesquisa = document.getElementById('input-pesquisa-aluno');

    if (btnLogout) btnLogout.addEventListener('click', fazerLogout);
    if (btnAddAluno) btnAddAluno.addEventListener('click', abrirModalParaAdicionar);
    if (inputPesquisa) inputPesquisa.addEventListener('keyup', renderizarListaAlunos);

    if (modalAdd) {
        modalAdd.querySelector('.close-modal-btn')?.addEventListener('click', fecharModalAluno);
        modalAdd.querySelector('#btn-cancelar-add')?.addEventListener('click', fecharModalAluno);
        modalAdd.querySelector('#form-add-aluno')?.addEventListener('submit', salvarAluno);
        modalAdd.querySelector('#btn-gerar-codigo')?.addEventListener('click', gerarCodigoUnico);
    }
    if (modalNotas) {
        modalNotas.querySelector('.close-modal-btn')?.addEventListener('click', () => modalNotas.classList.add('hidden'));
        modalNotas.querySelector('#btn-cancelar-notas')?.addEventListener('click', () => modalNotas.classList.add('hidden'));
        modalNotas.querySelector('#form-notas')?.addEventListener('submit', salvarAnotacoes);
    }
    
    configurarModalPrincipal();
    carregarAlunos();
}

async function fazerLogout() { try { await signOut(auth); } catch (error) { showCustomAlert("Erro ao tentar sair.", "erro"); } }

async function carregarAlunos() {
    const container = document.getElementById('lista-alunos-container');
    if (!container) return;
    container.innerHTML = "<p>Carregando alunos...</p>";
    try {
        const querySnapshot = await getDocs(collection(db, "alunos"));
        todosOsAlunos = [];
        querySnapshot.forEach((doc) => { todosOsAlunos.push({ id: doc.id, ...doc.data() }); });
        todosOsAlunos.sort((a, b) => a.nome.localeCompare(b.nome));
        renderizarListaAlunos();
    } catch (error) { container.innerHTML = '<p>Ocorreu um erro ao carregar a lista de alunos.</p>'; }
}

function renderizarListaAlunos() {
    const container = document.getElementById('lista-alunos-container');
    const inputPesquisa = document.getElementById('input-pesquisa-aluno');
    const termoPesquisa = inputPesquisa.value.toLowerCase();
    const alunosFiltrados = todosOsAlunos.filter(aluno => aluno.nome.toLowerCase().includes(termoPesquisa));
    if (alunosFiltrados.length === 0) { container.innerHTML = '<p>Nenhum aluno encontrado.</p>'; return; }
    let tabelaHtml = `<table class="tabela-moderna"><thead><tr><th>Nome do Aluno</th><th>Código de Acesso</th><th>Plano</th><th>Ações</th></tr></thead><tbody>`;
    alunosFiltrados.forEach((aluno) => {
        tabelaHtml += `<tr data-alunoid="${aluno.id}" data-alunonome="${aluno.nome}" data-alunocodigo="${aluno.codigoDeAcesso}" data-alunoplano="${aluno.plano || ''}">
            <td>${aluno.nome}</td><td><code>${aluno.codigoDeAcesso}</code></td><td>${aluno.plano || '–'}</td>
            <td>
                <button class="btn-tabela-ver">Ver Métricas</button>
                <button class="btn-tabela-anotacoes">Anotações</button>
                <button class="btn-tabela-editar">Editar</button>
                <button class="btn-tabela-excluir">Excluir</button>
            </td></tr>`;
    });
    tabelaHtml += `</tbody></table>`;
    container.innerHTML = tabelaHtml;
    container.querySelectorAll('.btn-tabela-ver').forEach(b => b.addEventListener('click', verMetricasAluno));
    container.querySelectorAll('.btn-tabela-anotacoes').forEach(b => b.addEventListener('click', abrirModalAnotacoes));
    container.querySelectorAll('.btn-tabela-editar').forEach(b => b.addEventListener('click', abrirModalParaEditar));
    container.querySelectorAll('.btn-tabela-excluir').forEach(b => b.addEventListener('click', confirmarExclusao));
}

function verMetricasAluno(event) {
    const tr = event.currentTarget.closest('tr');
    sessionStorage.setItem('alunoId', tr.dataset.alunoid);
    sessionStorage.setItem('alunoNome', tr.dataset.alunonome);
    window.open('dashboard.html', '_blank');
}

function abrirModalParaAdicionar() {
    const modal = document.getElementById('add-aluno-modal');
    const form = document.getElementById('form-add-aluno');
    form.reset();
    form.removeAttribute('data-edit-id'); 
    modal.querySelector('h2').textContent = "Adicionar Novo Aluno";
    modal.querySelector('button[type="submit"]').textContent = "Salvar Aluno";
    gerarCodigoUnico();
    modal.classList.remove('hidden');
}

function abrirModalParaEditar(event) {
    const tr = event.currentTarget.closest('tr');
    const modal = document.getElementById('add-aluno-modal');
    const form = document.getElementById('form-add-aluno');
    form.reset();
    form.dataset.editId = tr.dataset.alunoid;
    modal.querySelector('h2').textContent = "Editar Aluno";
    document.getElementById('aluno-nome').value = tr.dataset.alunonome;
    document.getElementById('aluno-codigo').value = tr.dataset.alunocodigo;
    document.getElementById('aluno-plano').value = tr.dataset.alunoplano;
    modal.querySelector('button[type="submit"]').textContent = "Salvar Alterações";
    modal.classList.remove('hidden');
}

function fecharModalAluno() { document.getElementById('add-aluno-modal').classList.add('hidden'); }

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

async function salvarAluno(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const editId = form.dataset.editId; 
    const nome = document.getElementById('aluno-nome').value.trim();
    const codigo = document.getElementById('aluno-codigo').value.trim();
    const plano = document.getElementById('aluno-plano').value.trim();
    if (!nome || !codigo) { showCustomAlert("Por favor, preencha o nome e gere um código.", "erro"); return; }
    const dadosDoAluno = { nome, codigoDeAcesso: codigo, plano };
    try {
        if (editId) {
            const alunoRef = doc(db, "alunos", editId);
            await updateDoc(alunoRef, dadosDoAluno);
            showCustomAlert("Aluno atualizado com sucesso!");
        } else {
            await addDoc(collection(db, "alunos"), dadosDoAluno);
            showCustomAlert("Aluno adicionado com sucesso!");
        }
        fecharModalAluno();
        carregarAlunos();
    } catch (error) { showCustomAlert("Ocorreu um erro ao salvar.", "erro"); }
}

function confirmarExclusao(event) {
    const tr = event.currentTarget.closest('tr');
    const alunoId = tr.dataset.alunoid;
    const alunoNome = tr.dataset.alunonome;
    const mensagem = `Tem certeza que deseja excluir o aluno "${alunoNome}"?\nTodos os registros de estudo dele também serão perdidos. Esta ação não pode ser desfeita.`;
    showCustomConfirm(mensagem, () => { excluirAluno(alunoId); });
}

async function excluirAluno(alunoId) {
    if (!alunoId) return;
    try {
        const registrosQuery = query(collection(db, "registros"), where("alunoId", "==", alunoId));
        const registrosSnapshot = await getDocs(registrosQuery);
        const deletePromises = [];
        registrosSnapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        await Promise.all(deletePromises);
        const alunoRef = doc(db, "alunos", alunoId);
        await deleteDoc(alunoRef);
        showCustomAlert("Aluno e todos os seus dados foram excluídos com sucesso!");
        carregarAlunos();
    } catch (error) {
        showCustomAlert("Ocorreu um erro ao tentar excluir o aluno e seus dados.", "erro");
    }
}

async function abrirModalAnotacoes(event) {
    const tr = event.currentTarget.closest('tr');
    const alunoId = tr.dataset.alunoid;
    const alunoNome = tr.dataset.alunonome;

    document.getElementById('notas-aluno-nome').textContent = alunoNome;
    document.getElementById('notas-aluno-id').value = alunoId;
    
    const modal = document.getElementById('notas-modal');
    modal.classList.remove('hidden');

    if (!quillEditor) {
        quillEditor = new Quill('#editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'align': [] }],
                    ['clean']
                ]
            }
        });
    }
    quillEditor.root.innerHTML = '<p>Carregando anotações...</p>';

    try {
        const alunoRef = doc(db, 'alunos', alunoId);
        const docSnap = await getDoc(alunoRef);
        if (docSnap.exists() && docSnap.data().anotacoes) {
            quillEditor.root.innerHTML = docSnap.data().anotacoes;
        } else {
            quillEditor.root.innerHTML = '';
        }
    } catch(error) {
        quillEditor.root.innerHTML = '<p>Erro ao carregar anotações.</p>';
    }
}

async function salvarAnotacoes(event) {
    event.preventDefault();
    const alunoId = document.getElementById('notas-aluno-id').value;
    const anotacoesHTML = quillEditor.root.innerHTML;

    if (!alunoId) return;

    try {
        const alunoRef = doc(db, "alunos", alunoId);
        await updateDoc(alunoRef, { anotacoes: anotacoesHTML });
        showCustomAlert("Anotações salvas com sucesso!");
        document.getElementById('notas-modal').classList.add('hidden');
    } catch (error) {
        showCustomAlert("Ocorreu um erro ao salvar as anotações.", "erro");
    }
}