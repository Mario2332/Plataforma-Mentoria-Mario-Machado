// =================================================================
// SCRIPT DO DASHBOARD (VERSÃO COM CORREÇÃO DO HISTÓRICO)
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

// Variáveis globais
let meusRegistros = [];
let sortState = { column: 'dataRegistro', direction: 'desc' };
let meuGraficoDeMaterias, meuGraficoDeDesempenho, meuGraficoSemanal, meuGraficoDonut, meuGraficoFlashcards;
const TODAS_AS_MATERIAS = ["Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Linguagens"];

// Roda quando a página carrega
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
    
    // CORREÇÃO: Busca os dados assim que a página carrega
    await carregarDadosIniciais(alunoId);
});

// NOVA FUNÇÃO para o carregamento inicial dos dados
async function carregarDadosIniciais(alunoId) {
    const q = query(collection(db, "registros"), where("alunoId", "==", alunoId));
    const querySnapshot = await getDocs(q);
    meusRegistros = []; // Limpa a lista antes de preencher
    querySnapshot.forEach((doc) => {
        meusRegistros.push(doc.data());
    });
    // Após carregar, já renderiza o histórico com a ordenação padrão
    renderizarHistorico(); 
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

    Object.keys(navItems).forEach(key => {
        navItems[key].addEventListener('click', (e) => {
            e.preventDefault(); // Previne o comportamento padrão do link
            Object.keys(sections).forEach(sKey => sections[sKey].classList.toggle('hidden', sKey !== key));
            Object.keys(navItems).forEach(nKey => navItems[nKey].classList.toggle('active', nKey === key));
            
            // Agora, as funções de métricas e histórico apenas usam os dados já carregados
            if (key === 'metricas') processarMetricas();
            if (key === 'historico') renderizarHistorico();
        });
    });
}

function configurarFormulario(alunoId) {
    const formRegistro = document.getElementById('form-registro');
    formRegistro.addEventListener('submit', async (event) => {
        event.preventDefault();
        const novoRegistro = {
            alunoId,
            materia: document.getElementById('materia').value,
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
            // Adiciona o novo registro à lista local para não precisar recarregar a página
            meusRegistros.push(novoRegistro);
            // Re-renderiza o histórico com o novo item
            renderizarHistorico();
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
            const direction = sortState.column === column && sortState.direction === 'asc' ? 'desc' : 'asc';
            sortState = { column, direction };
            document.querySelectorAll('#tabela-historico th.sortable').forEach(th => th.classList.remove('active-sort', 'asc', 'desc'));
            header.classList.add('active-sort', direction);
            renderizarHistorico();
        });
    });
}

function renderizarHistorico() {
    meusRegistros.sort((a, b) => {
        let valA = a[sortState.column];
        let valB = b[sortState.column];
        if (sortState.column === 'desempenho') {
            valA = a.questoesFeitas > 0 ? (a.questoesAcertadas / a.questoesFeitas) : -1;
            valB = b.questoesFeitas > 0 ? (b.questoesAcertadas / b.questoesFeitas) : -1;
        }
        if (valA && valA.toDate) valA = valA.toDate();
        if (valB && valB.toDate) valB = valB.toDate();

        if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const tbody = document.querySelector('#tabela-historico tbody');
    tbody.innerHTML = ''; 

    meusRegistros.forEach(reg => {
        const tr = document.createElement('tr');
        const desempenho = reg.questoesFeitas > 0 ? ((reg.questoesAcertadas / reg.questoesFeitas) * 100).toFixed(1) + '%' : 'N/A';
        tr.innerHTML = `
            <td>${reg.dataRegistro.toDate().toLocaleDateString('pt-BR')}</td>
            <td>${reg.materia}</td>
            <td>${reg.tempoEstudado}</td>
            <td>${reg.questoesFeitas}</td>
            <td>${reg.questoesAcertadas}</td>
            <td>${desempenho}</td>
            <td>${reg.flashcardsFeitos}</td>
        `;
        tbody.appendChild(tr);
    });
}

// A antiga 'carregarMetricas' agora se chama 'processarMetricas' e não busca mais dados
// Apenas para garantir, substitua a função processarMetricas pelo bloco completo abaixo
function processarMetricas() {
    let tempoTotal = 0, questoesTotal = 0, acertosTotal = 0;
    const contagemPorDia = {};
    const dadosPorMateria = {};

    TODAS_AS_MATERIAS.forEach(materia => { dadosPorMateria[materia] = { questoes: 0, acertos: 0, flashcards: 0 }; });

    meusRegistros.forEach(reg => {
        tempoTotal += reg.tempoEstudado;
        questoesTotal += reg.questoesFeitas;
        acertosTotal += reg.questoesAcertadas;
        const data = reg.dataRegistro.toDate().toISOString().split('T')[0];
        contagemPorDia[data] = (contagemPorDia[data] || 0) + 1;
        if (dadosPorMateria.hasOwnProperty(reg.materia)) {
            dadosPorMateria[reg.materia].questoes += reg.questoesFeitas;
            dadosPorMateria[reg.materia].acertos += reg.questoesAcertadas;
            dadosPorMateria[reg.materia].flashcards += (reg.flashcardsFeitos || 0);
        }
    });

    const desempenhoGeral = questoesTotal > 0 ? (acertosTotal / questoesTotal) * 100 : 0;
    document.getElementById('stat-tempo-total').textContent = `${tempoTotal} min`;
    document.getElementById('stat-questoes-total').textContent = questoesTotal;
    document.getElementById('stat-acertos-total').textContent = acertosTotal;
    
    let sequenciaAtual = 0;
    const hoje = new Date();
    if (!contagemPorDia[hoje.toISOString().split('T')[0]]) { hoje.setDate(hoje.getDate() - 1); }
    while (contagemPorDia[hoje.toISOString().split('T')[0]]) {
        sequenciaAtual++;
        hoje.setDate(hoje.getDate() - 1);
    }
    document.getElementById('stat-sequencia').textContent = `${sequenciaAtual} dias`;

    const heatmapContainer = document.getElementById('heatmap-calendario');
    heatmapContainer.innerHTML = '';
    const diasAtras = 90;
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - diasAtras);
    for (let i = 0; i <= diasAtras; i++) {
        const diaAtual = new Date(dataInicio);
        diaAtual.setDate(diaAtual.getDate() + i);
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

    const ctxDonut = document.getElementById('grafico-desempenho-geral');
    if (ctxDonut) {
        if (meuGraficoDonut) meuGraficoDonut.destroy();
        meuGraficoDonut = new Chart(ctxDonut, { type: 'doughnut', data: { datasets: [{ data: [desempenhoGeral, 100 - desempenhoGeral], backgroundColor: ['#007BFF', '#e9edf2'], borderWidth: 0, text: `${desempenhoGeral.toFixed(0)}%` }] }, options: { responsive: true, cutout: '75%', plugins: { legend: { display: false } } }, plugins: [pluginTextoNoCentro] });
    }

    const labelsMaterias = TODAS_AS_MATERIAS;
    const dadosQuestoes = labelsMaterias.map(m => dadosPorMateria[m].questoes);
    const dadosDesempenho = labelsMaterias.map(m => { const d = dadosPorMateria[m]; return d.questoes > 0 ? (d.acertos / d.questoes) * 100 : 0; });
    const dadosFlashcards = labelsMaterias.map(m => dadosPorMateria[m].flashcards);

    const ctxQuestoes = document.getElementById('grafico-materias');
    if(ctxQuestoes) {
        if (meuGraficoDeMaterias) meuGraficoDeMaterias.destroy();
        meuGraficoDeMaterias = new Chart(ctxQuestoes, { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Questões Feitas', data: dadosQuestoes, backgroundColor: 'rgba(54, 162, 235, 0.7)' }] }, options: { scales: { y: { beginAtZero: true } } } });
    }

    const ctxDesempenho = document.getElementById('grafico-desempenho');
    if(ctxDesempenho) {
        if (meuGraficoDeDesempenho) meuGraficoDeDesempenho.destroy();
        meuGraficoDeDesempenho = new Chart(ctxDesempenho, { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Desempenho (%)', data: dadosDesempenho, backgroundColor: 'rgba(255, 206, 86, 0.7)' }] }, options: { scales: { y: { beginAtZero: true, max: 100 } } } });
    }
    
    const hojeFiltro = new Date();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hojeFiltro.getDate() - 6);
    const registrosDaSemana = meusRegistros.filter(reg => reg.dataRegistro.toDate() >= seteDiasAtras);
    const labelsSemanais = [], dadosAcertosSemanais = [], dadosErrosSemanais = [];
    for (let i = 0; i < 7; i++) {
        const dia = new Date(seteDiasAtras); dia.setDate(dia.getDate() + i);
        labelsSemanais.push(String(dia.getDate()).padStart(2, '0') + '/' + String(dia.getMonth() + 1).padStart(2, '0'));
        let acertosNoDia = 0, errosNoDia = 0;
        registrosDaSemana.forEach(reg => {
            if (reg.dataRegistro.toDate().toDateString() === dia.toDateString()) {
                acertosNoDia += reg.questoesAcertadas;
                errosNoDia += reg.questoesFeitas - reg.questoesAcertadas;
            }
        });
        dadosAcertosSemanais.push(acertosNoDia);
        dadosErrosSemanais.push(errosNoDia);
    }
    const ctxSemanal = document.getElementById('grafico-semanal');
    if(ctxSemanal) {
        if(meuGraficoSemanal) { meuGraficoSemanal.destroy(); }
        meuGraficoSemanal = new Chart(ctxSemanal, { type: 'line', data: { labels: labelsSemanais, datasets: [ { label: 'Acertos', data: dadosAcertosSemanais, borderColor: 'rgba(75, 192, 192, 1)', fill: true, tension: 0.1 }, { label: 'Erros', data: dadosErrosSemanais, borderColor: 'rgba(255, 99, 132, 1)', fill: true, tension: 0.1 } ] }, options: { scales: { y: { beginAtZero: true } } } });
    }

    const ctxFlashcards = document.getElementById('grafico-flashcards-materia');
    if(ctxFlashcards) {
        if(meuGraficoFlashcards) { meuGraficoFlashcards.destroy(); }
        meuGraficoFlashcards = new Chart(ctxFlashcards, { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Flashcards Feitos', data: dadosFlashcards, backgroundColor: 'rgba(153, 102, 255, 0.7)' }] }, options: { scales: { y: { beginAtZero: true } } } });
    }
}

// O pluginTextoNoCentro continua o mesmo
const pluginTextoNoCentro = { id: 'text-center', afterDatasetsDraw(chart) { const { ctx, data } = chart; const text = data.datasets[0].text; if (!text) return; ctx.save(); const x = chart.getDatasetMeta(0).data[0].x; const y = chart.getDatasetMeta(0).data[0].y; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 30px sans-serif'; ctx.fillStyle = '#1c3d5a'; ctx.fillText(text, x, y); ctx.restore(); } };