// =================================================================
// SCRIPT DO DASHBOARD (VERSÃO COM CORREÇÃO FINAL DO HISTÓRICO)
// =================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
let todosOsGraficos = {};
const TODAS_AS_MATERIAS = ["Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Linguagens"];

document.addEventListener('DOMContentLoaded', async () => {
    const alunoId = sessionStorage.getItem('alunoId');
    if (!alunoId) {
        alert("Sessão expirada. Por favor, faça o login novamente.");
        window.location.href = 'index.html';
        return;
    }
    configurarNavegacao(alunoId);
    configurarFormulario(alunoId);
    configurarCabecalhosTabela();
    const nomeAluno = sessionStorage.getItem('alunoNome');
    if (nomeAluno) { document.querySelector('.student-info h3').textContent = `Olá, ${nomeAluno}!`; }
    await carregarDadosIniciais(alunoId);
});

async function carregarDadosIniciais(alunoId) {
    try {
        console.log("Buscando dados do Firebase...");
        const q = query(collection(db, "registros"), where("alunoId", "==", alunoId));
        const querySnapshot = await getDocs(q);
        meusRegistros = []; 
        querySnapshot.forEach((doc) => { meusRegistros.push(doc.data()); });
        console.log(`Dashboard inicializado com ${meusRegistros.length} registros carregados.`);
        renderizarHistorico();
    } catch (error) {
        console.error("Erro ao buscar dados iniciais: ", error);
        alert("Não foi possível carregar seus dados.");
    }
}

function configurarNavegacao(alunoId) {
    const navRegistro = document.getElementById('nav-registro');
    const navMetricas = document.getElementById('nav-metricas');
    const navHistorico = document.getElementById('nav-historico');
    const secaoRegistro = document.getElementById('registro-estudos');
    const secaoMetricas = document.getElementById('minhas-metricas');
    const secaoHistorico = document.getElementById('historico-estudos');

    navRegistro.addEventListener('click', (e) => {
        e.preventDefault();
        secaoRegistro.classList.remove('hidden'); secaoMetricas.classList.add('hidden'); secaoHistorico.classList.add('hidden');
        navRegistro.classList.add('active'); navMetricas.classList.remove('active'); navHistorico.classList.remove('active');
    });
    navMetricas.addEventListener('click', (e) => {
        e.preventDefault();
        secaoRegistro.classList.add('hidden'); secaoMetricas.classList.remove('hidden'); secaoHistorico.classList.add('hidden');
        navRegistro.classList.remove('active'); navMetricas.classList.add('active'); navHistorico.classList.remove('active');
        processarMetricas();
    });
    navHistorico.addEventListener('click', (e) => {
        e.preventDefault();
        secaoRegistro.classList.add('hidden'); secaoMetricas.classList.add('hidden'); secaoHistorico.classList.remove('hidden');
        navRegistro.classList.remove('active'); navMetricas.classList.remove('active'); navHistorico.classList.add('active');
    });
}

function configurarFormulario(alunoId) {
    const formRegistro = document.getElementById('form-registro');
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
            console.log("Salvando novo registro...");
            await addDoc(collection(db, "registros"), novoRegistro);
            alert("Registro salvo com sucesso!");
            formRegistro.reset();
            meusRegistros.push(novoRegistro);
            renderizarHistorico();
            console.log("Registro salvo e tabela de histórico atualizada.");
        } catch (e) {
            console.error("Erro ao adicionar documento: ", e);
            alert("Ocorreu um erro ao salvar o registro.");
        }
    });
}

function configurarCabecalhosTabela() {
    document.querySelectorAll('#tabela-historico th.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            if (!column) return;
            console.log(`Ordenando pela coluna: ${column}`);
            const direction = sortState.column === column && sortState.direction === 'desc' ? 'asc' : 'desc';
            sortState = { column, direction };
            document.querySelectorAll('#tabela-historico th.sortable').forEach(th => { th.classList.remove('active-sort', 'asc', 'desc'); });
            header.classList.add('active-sort', direction);
            renderizarHistorico();
        });
    });
}

function renderizarHistorico() {
    console.log("Renderizando histórico...");
    if (!meusRegistros) return;
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
    const tbody = document.querySelector('#tabela-historico tbody');
    if (!tbody) return;
    tbody.innerHTML = ''; 
    meusRegistros.forEach(reg => {
        const tr = document.createElement('tr');
        const desempenho = reg.questoesFeitas > 0 ? ((reg.questoesAcertadas / reg.questoesFeitas) * 100).toFixed(1) + '%' : 'N/A';
        const data = reg.dataRegistro?.toDate ? reg.dataRegistro.toDate().toLocaleDateString('pt-BR') : 'Agora';
        tr.innerHTML = `
            <td>${data}</td> <td>${reg.materia || ''}</td>
            <td>${reg.tempoEstudado || 0}</td> <td>${reg.questoesFeitas || 0}</td>
            <td>${reg.questoesAcertadas || 0}</td> <td>${desempenho}</td>
            <td>${reg.flashcardsFeitos || 0}</td>
        `;
        tbody.appendChild(tr);
    });
    console.log(`Histórico renderizado com ${meusRegistros.length} registros.`);
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
    
    // Recriar gráficos
    const chartContexts = {
        materias: document.getElementById('grafico-materias')?.getContext('2d'),
        desempenho: document.getElementById('grafico-desempenho')?.getContext('2d'),
        semanal: document.getElementById('grafico-semanal')?.getContext('2d'),
        flashcards: document.getElementById('grafico-flashcards-materia')?.getContext('2d')
    };

    const labelsMaterias = TODAS_AS_MATERIAS;
    const dadosQuestoes = labelsMaterias.map(m => dadosPorMateria[m].questoes);
    const dadosDesempenho = labelsMaterias.map(m => { const d = dadosPorMateria[m]; return d.questoes > 0 ? (d.acertos / d.questoes) * 100 : 0; });
    const dadosFlashcards = labelsMaterias.map(m => dadosPorMateria[m].flashcards);
    
    if (todosOsGraficos.materias) todosOsGraficos.materias.destroy();
    if (chartContexts.materias) todosOsGraficos.materias = new Chart(chartContexts.materias, { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Questões Feitas', data: dadosQuestoes, backgroundColor: 'rgba(54, 162, 235, 0.7)' }] }, options: { scales: { y: { beginAtZero: true } } } });

    if (todosOsGraficos.desempenho) todosOsGraficos.desempenho.destroy();
    if (chartContexts.desempenho) todosOsGraficos.desempenho = new Chart(chartContexts.desempenho, { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Desempenho (%)', data: dadosDesempenho, backgroundColor: 'rgba(255, 206, 86, 0.7)' }] }, options: { scales: { y: { beginAtZero: true, max: 100 } } } });

    if (todosOsGraficos.flashcards) todosOsGraficos.flashcards.destroy();
    if (chartContexts.flashcards) todosOsGraficos.flashcards = new Chart(chartContexts.flashcards, { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Flashcards Feitos', data: dadosFlashcards, backgroundColor: 'rgba(153, 102, 255, 0.7)' }] }, options: { scales: { y: { beginAtZero: true } } } });

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
    if (todosOsGraficos.semanal) todosOsGraficos.semanal.destroy();
    if(chartContexts.semanal) todosOsGraficos.semanal = new Chart(chartContexts.semanal, { type: 'line', data: { labels: labelsSemanais, datasets: [ { label: 'Acertos', data: dadosAcertosSemanais, borderColor: 'rgba(75, 192, 192, 1)', fill: true, tension: 0.1 }, { label: 'Erros', data: dadosErrosSemanais, borderColor: 'rgba(255, 99, 132, 1)', fill: true, tension: 0.1 } ] }, options: { scales: { y: { beginAtZero: true } } } });
}