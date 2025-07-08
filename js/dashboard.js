// =================================================================
// SCRIPT FINAL E COMPLETO DO DASHBOARD (COM EDIÇÃO EM LINHA)
// =================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const db = getFirestore(app);

let meusRegistros = []; 
let sortState = { column: 'dataRegistro', direction: 'desc' };
const TODAS_AS_MATERIAS = ["Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Linguagens"];

document.addEventListener('DOMContentLoaded', async () => {
    const alunoId = sessionStorage.getItem('alunoId');
    if (!alunoId) {
        alert("Sessão expirada. Por favor, faça o login novamente.");
        window.location.href = 'index.html';
        return;
    }
    configurarNavegacao();
    configurarFormulario(alunoId);
    configurarCabecalhosTabela();
    const nomeAluno = sessionStorage.getItem('alunoNome');
    if (nomeAluno) { document.querySelector('.student-info h3').textContent = `Olá, ${nomeAluno}!`; }
    await carregarDadosIniciais(alunoId);
});

async function carregarDadosIniciais(alunoId) {
    try {
        const q = query(collection(db, "registros"), where("alunoId", "==", alunoId));
        const querySnapshot = await getDocs(q);
        meusRegistros = []; 
        querySnapshot.forEach((doc) => {
            meusRegistros.push({ id: doc.id, ...doc.data() });
        });
        renderizarHistorico(); 
    } catch (error) { console.error("Erro ao buscar dados iniciais: ", error); }
}

function configurarNavegacao() {
    const navItems = {
        registro: document.getElementById('nav-registro'),
        metricas: document.getElementById('nav-metricas'),
        historico: document.getElementById('nav-historico')
    };
    const sections = {
        registro: document.getElementById('registro-estudos'),
        metricas: document.getElementById('minhas-metricas'),
        historico: document.getElementById('historico-estudos')
    };
    function mudarAba(abaAtiva) {
        Object.keys(sections).forEach(key => sections[key]?.classList.toggle('hidden', key !== abaAtiva));
        Object.keys(navItems).forEach(key => navItems[key]?.classList.remove('active'));
        navItems[abaAtiva]?.classList.add('active');
        if (abaAtiva === 'metricas') processarMetricas();
    }
    Object.keys(navItems).forEach(key => {
        if(navItems[key]) navItems[key].addEventListener('click', (e) => {
            e.preventDefault();
            mudarAba(key);
        });
    });
}

function configurarFormulario(alunoId) {
    const formRegistro = document.getElementById('form-registro');
    if (!formRegistro) return;
    formRegistro.addEventListener('submit', async (event) => {
        event.preventDefault();
        const novoRegistro = {
            alunoId, materia: document.getElementById('materia').value,
            tempoEstudado: Number(document.getElementById('tempo').value),
            questoesFeitas: Number(document.getElementById('questoes').value),
            questoesAcertadas: Number(document.getElementById('acertos').value),
            flashcardsFeitos: Number(document.getElementById('flashcards').value) || 0,
            dataRegistro: Timestamp.fromDate(new Date())
        };
        try {
            const docRef = await addDoc(collection(db, "registros"), novoRegistro);
            alert("Registro salvo com sucesso!");
            formRegistro.reset();
            meusRegistros.push({ id: docRef.id, ...novoRegistro });
            renderizarHistorico();
        } catch (e) { console.error("Erro ao adicionar documento: ", e); }
    });
}

function configurarCabecalhosTabela() {
    document.querySelectorAll('#tabela-historico th.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            if (!column) return;
            const direction = sortState.column === column && sortState.direction === 'desc' ? 'asc' : 'desc';
            sortState = { column, direction };
            document.querySelectorAll('#tabela-historico th.sortable').forEach(th => { th.classList.remove('active-sort'); });
            header.classList.add('active-sort');
            renderizarHistorico();
        });
    });
}

function renderizarHistorico() {
    const tbody = document.querySelector('#tabela-historico tbody');
    if (!tbody) return;
    meusRegistros.sort((a, b) => {
        let valA = a[sortState.column]; let valB = b[sortState.column];
        if (sortState.column === 'desempenho') {
            valA = a.questoesFeitas > 0 ? (a.questoesAcertadas / a.questoesFeitas) : -1;
            valB = b.questoesFeitas > 0 ? (b.questoesAcertadas / b.questoesFeitas) : -1;
        }
        if (valA?.toDate) valA = valA.toDate();
        if (valB?.toDate) valB = valB.toDate();
        if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
    });
    tbody.innerHTML = ''; 
    if (meusRegistros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Nenhum registro de estudo encontrado.</td></tr>';
        return;
    }
    meusRegistros.forEach((reg, index) => {
        const tr = document.createElement('tr');
        tr.dataset.index = index;
        const desempenho = reg.questoesFeitas > 0 ? ((reg.questoesAcertadas / reg.questoesFeitas) * 100).toFixed(1) + '%' : 'N/A';
        const data = reg.dataRegistro?.toDate ? reg.dataRegistro.toDate().toLocaleDateString('pt-BR') : 'Agora';
        tr.innerHTML = `
            <td data-field="data">${data}</td>
            <td data-field="materia">${reg.materia || ''}</td>
            <td data-field="tempoEstudado">${reg.tempoEstudado || 0}</td>
            <td data-field="questoesFeitas">${reg.questoesFeitas || 0}</td>
            <td data-field="questoesAcertadas">${reg.questoesAcertadas || 0}</td>
            <td data-field="desempenho">${desempenho}</td>
            <td data-field="flashcardsFeitos">${reg.flashcardsFeitos || 0}</td>
            <td class="coluna-acoes">
                <div class="action-buttons">
                    <button class="action-btn edit-btn" title="Editar">✏️</button>
                    <button class="action-btn delete-btn" title="Excluir">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', ativarModoEdicao));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', deletarRegistro));
}

function ativarModoEdicao(event) {
    renderizarHistorico(); // Restaura qualquer outra linha que estivesse em modo de edição
    const btn = event.currentTarget;
    const tr = btn.closest('tr');
    const { index } = tr.dataset;
    const registro = meusRegistros[index];

    const celulas = tr.querySelectorAll('td');
    celulas[1].innerHTML = `<select>${TODAS_AS_MATERIAS.map(m => `<option value="${m}" ${m === registro.materia ? 'selected' : ''}>${m}</option>`).join('')}</select>`;
    celulas[2].innerHTML = `<input type="number" value="${registro.tempoEstudado}">`;
    celulas[3].innerHTML = `<input type="number" value="${registro.questoesFeitas}">`;
    celulas[4].innerHTML = `<input type="number" value="${registro.questoesAcertadas}">`;
    celulas[6].innerHTML = `<input type="number" value="${registro.flashcardsFeitos}">`;
    
    celulas[7].innerHTML = `
        <div class="action-buttons" style="opacity: 1;">
            <button class="action-btn confirm-btn" title="Confirmar">✔️</button>
            <button class="action-btn cancel-btn" title="Cancelar">✖️</button>
        </div>
    `;
    tr.querySelector('.confirm-btn').addEventListener('click', () => salvarEdicao(tr, index));
    tr.querySelector('.cancel-btn').addEventListener('click', () => renderizarHistorico());
}

async function salvarEdicao(tr, index) {
    const registroOriginal = meusRegistros[index];
    const dadosAtualizados = {
        materia: tr.querySelector('select').value,
        tempoEstudado: Number(tr.cells[2].querySelector('input').value),
        questoesFeitas: Number(tr.cells[3].querySelector('input').value),
        questoesAcertadas: Number(tr.cells[4].querySelector('input').value),
        flashcardsFeitos: Number(tr.cells[6].querySelector('input').value),
    };

    try {
        const docRef = doc(db, 'registros', registroOriginal.id);
        await updateDoc(docRef, dadosAtualizados);
        meusRegistros[index] = { ...registroOriginal, ...dadosAtualizados };
        alert("Registro atualizado!");
    } catch (error) {
        alert("Falha ao atualizar.");
        console.error("Erro ao atualizar: ", error);
    } finally {
        renderizarHistorico();
    }
}

async function deletarRegistro(event) {
    const btn = event.currentTarget;
    const tr = btn.closest('tr');
    const { index } = tr.dataset;
    const registro = meusRegistros[index];

    if (confirm("Tem certeza que deseja excluir este registro? A ação não pode ser desfeita.")) {
        try {
            await deleteDoc(doc(db, "registros", registro.id));
            meusRegistros.splice(index, 1);
            renderizarHistorico();
            alert("Registro excluído.");
        } catch (error) {
            alert("Falha ao excluir.");
            console.error("Erro ao excluir: ", error);
        }
    }
}

function processarMetricas() {
    console.log("Processando métricas e desenhando gráficos...");
    let tempoTotal = 0, questoesTotal = 0, acertosTotal = 0;
    const contagemPorDia = {}, dadosPorMateria = {};
    TODAS_AS_MATERIAS.forEach(materia => { dadosPorMateria[materia] = { questoes: 0, acertos: 0, flashcards: 0 }; });

    meusRegistros.forEach(reg => {
        tempoTotal += reg.tempoEstudado || 0;
        questoesTotal += reg.questoesFeitas || 0;
        acertosTotal += reg.questoesAcertadas || 0;
        const data = reg.dataRegistro?.toDate ? reg.dataRegistro.toDate().toISOString().split('T')[0] : null;
        if(data) { contagemPorDia[data] = (contagemPorDia[data] || 0) + 1; }
        if (dadosPorMateria.hasOwnProperty(reg.materia)) {
            dadosPorMateria[reg.materia].questoes += reg.questoesFeitas || 0;
            dadosPorMateria[reg.materia].acertos += reg.questoesAcertadas || 0;
            dadosPorMateria[reg.materia].flashcards += (reg.flashcardsFeitos || 0);
        }
    });

    document.getElementById('stat-tempo-total').textContent = `${tempoTotal} min`;
    document.getElementById('stat-questoes-total').textContent = questoesTotal;
    document.getElementById('stat-acertos-total').textContent = acertosTotal;
    
    let sequenciaAtual = 0;
    let hoje = new Date();
    if (!contagemPorDia[hoje.toISOString().split('T')[0]]) { hoje.setDate(hoje.getDate() - 1); }
    while (contagemPorDia[hoje.toISOString().split('T')[0]]) {
        sequenciaAtual++;
        hoje.setDate(hoje.getDate() - 1);
    }
    document.getElementById('stat-sequencia').textContent = `${sequenciaAtual} dias`;

    const heatmapContainer = document.getElementById('heatmap-calendario');
    heatmapContainer.innerHTML = '';
    const diasAtras = 90;
    let dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - diasAtras);
    for (let i = 0; i <= diasAtras; i++) {
        const diaAtual = new Date(dataInicio); diaAtual.setDate(diaAtual.getDate() + i);
        const dataFormatada = diaAtual.toISOString().split('T')[0];
        const contagem = contagemPorDia[dataFormatada] || 0;
        const diaElemento = document.createElement('div');
        diaElemento.classList.add('heatmap-day');
        let nivel = 0;
        if (contagem > 0) nivel = 1; if (contagem > 2) nivel = 2; if (contagem > 5) nivel = 3; if (contagem > 8) nivel = 4;
        if (nivel > 0) { diaElemento.classList.add(`level-${nivel}`); }
        diaElemento.title = `${contagem} registros em ${diaAtual.toLocaleDateString('pt-BR')}`;
        heatmapContainer.appendChild(diaElemento);
    }
    
    const labelsMaterias = TODAS_AS_MATERIAS;
    const dadosQuestoes = labelsMaterias.map(m => dadosPorMateria[m].questoes);
    const dadosDesempenho = labelsMaterias.map(m => { const d = dadosPorMateria[m]; return d.questoes > 0 ? (d.acertos / d.questoes) * 100 : 0; });
    const dadosFlashcards = labelsMaterias.map(m => dadosPorMateria[m].flashcards);

    // Destruir e recriar gráficos
    Object.values(todosOsGraficos).forEach(grafico => grafico?.destroy());

    todosOsGraficos.materias = new Chart(document.getElementById('grafico-materias'), { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Questões Feitas', data: dadosQuestoes, backgroundColor: 'rgba(54, 162, 235, 0.7)' }] }, options: { scales: { y: { beginAtZero: true } } } });
    todosOsGraficos.desempenho = new Chart(document.getElementById('grafico-desempenho'), { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Desempenho (%)', data: dadosDesempenho, backgroundColor: 'rgba(255, 206, 86, 0.7)' }] }, options: { scales: { y: { beginAtZero: true, max: 100 } } } });
    todosOsGraficos.flashcards = new Chart(document.getElementById('grafico-flashcards-materia'), { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Flashcards Feitos', data: dadosFlashcards, backgroundColor: 'rgba(153, 102, 255, 0.7)' }] }, options: { scales: { y: { beginAtZero: true } } } });
    
    const hojeFiltro = new Date();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hojeFiltro.getDate() - 6);
    const registrosDaSemana = meusRegistros.filter(reg => reg.dataRegistro?.toDate() >= seteDiasAtras);
    const labelsSemanais = [], dadosAcertosSemanais = [], dadosErrosSemanais = [];
    for (let i = 0; i < 7; i++) {
        const dia = new Date(seteDiasAtras); dia.setDate(dia.getDate() + i);
        labelsSemanais.push(String(dia.getDate()).padStart(2, '0') + '/' + String(dia.getMonth() + 1).padStart(2, '0'));
        let acertosNoDia = 0, errosNoDia = 0;
        registrosDaSemana.forEach(reg => { if (reg.dataRegistro?.toDate().toDateString() === dia.toDateString()) { acertosNoDia += reg.questoesAcertadas; errosNoDia += reg.questoesFeitas - reg.questoesAcertadas; } });
        dadosAcertosSemanais.push(acertosNoDia);
        dadosErrosSemanais.push(errosNoDia);
    }
    todosOsGraficos.semanal = new Chart(document.getElementById('grafico-semanal'), { type: 'line', data: { labels: labelsSemanais, datasets: [ { label: 'Acertos', data: dadosAcertosSemanais, borderColor: 'rgba(75, 192, 192, 1)', fill: true, tension: 0.1 }, { label: 'Erros', data: dadosErrosSemanais, borderColor: 'rgba(255, 99, 132, 1)', fill: true, tension: 0.1 } ] }, options: { scales: { y: { beginAtZero: true } } } });
}