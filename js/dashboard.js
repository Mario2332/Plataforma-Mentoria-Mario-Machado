// =================================================================
// SCRIPT FINAL DA PÁGINA DO DASHBOARD (VERSÃO CORRESPONDENTE AO SEU HTML)
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

let meuGraficoDeMaterias, meuGraficoDeDesempenho, meuGraficoSemanal, meuGraficoDonut, meuGraficoFlashcards;
const TODAS_AS_MATERIAS = ["Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Linguagens", "Outra"];

const pluginTextoNoCentro = {
    id: 'text-center',
    afterDatasetsDraw(chart) {
        const { ctx, data } = chart;
        const text = data.datasets[0].text;
        if (!text) return;
        
        ctx.save();
        const x = chart.getDatasetMeta(0).data[0].x;
        const y = chart.getDatasetMeta(0).data[0].y;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = '#1c3d5a';
        ctx.fillText(text, x, y);
        ctx.restore();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const alunoId = sessionStorage.getItem('alunoId');
    if (!alunoId) {
        alert("Sessão expirada. Por favor, faça o login novamente.");
        window.location.href = 'index.html';
        return;
    }
    
    const elementoSaudacao = document.querySelector('.student-info h3');
    const nomeAluno = sessionStorage.getItem('alunoNome');
    if (nomeAluno) { elementoSaudacao.textContent = `Olá, ${nomeAluno}!`; }

    const navRegistro = document.getElementById('nav-registro');
    const navMetricas = document.getElementById('nav-metricas');
    const secaoRegistro = document.getElementById('registro-estudos');
    const secaoMetricas = document.getElementById('minhas-metricas');

    navRegistro.addEventListener('click', () => {
        secaoRegistro.classList.remove('hidden'); secaoMetricas.classList.add('hidden');
        navRegistro.classList.add('active'); navMetricas.classList.remove('active');
    });

    navMetricas.addEventListener('click', () => {
        secaoMetricas.classList.remove('hidden'); secaoRegistro.classList.add('hidden');
        navMetricas.classList.add('active'); navRegistro.classList.remove('active');
        carregarMetricas(alunoId);
    });

    const seletorMateria = document.getElementById('materia');
    const containerOutraMateria = document.getElementById('outra-materia-container');
    seletorMateria.addEventListener('change', () => {
        containerOutraMateria.classList.toggle('hidden', seletorMateria.value !== 'Outra');
    });

    const formRegistro = document.getElementById('form-registro');
    formRegistro.addEventListener('submit', async (event) => {
        event.preventDefault();
        let materiaFinal = seletorMateria.value === 'Outra' ? document.getElementById('outra-materia').value : seletorMateria.value;
        const novoRegistro = {
    alunoId,
    materia: materiaFinal,
    tempoEstudado: Number(document.getElementById('tempo').value),
    questoesFeitas: Number(document.getElementById('questoes').value),
    questoesAcertadas: Number(document.getElementById('acertos').value),
    flashcardsFeitos: Number(document.getElementById('flashcards').value), // ADICIONE ESTA LINHA
    dataRegistro: Timestamp.fromDate(new Date())
};
        try {
            await addDoc(collection(db, "registros"), novoRegistro);
            alert("Registro salvo com sucesso!");
            formRegistro.reset();
            containerOutraMateria.classList.add('hidden');
        } catch (e) {
            console.error("Erro ao adicionar documento: ", e);
            alert("Ocorreu um erro ao salvar o registro.");
        }
    });
});

// Substitua sua função antiga por esta versão final
async function carregarMetricas(alunoId) {
    const q = query(collection(db, "registros"), where("alunoId", "==", alunoId));
    const querySnapshot = await getDocs(q);
    const registros = [];
    querySnapshot.forEach((doc) => { registros.push(doc.data()); });

    let tempoTotal = 0, questoesTotal = 0, acertosTotal = 0;
    const contagemPorDia = {};
    const dadosPorMateria = {};

    TODAS_AS_MATERIAS.forEach(materia => {
        dadosPorMateria[materia] = { questoes: 0, acertos: 0, flashcards: 0 }; // Adicionado flashcards: 0
    });

    registros.forEach(reg => {
        tempoTotal += reg.tempoEstudado;
        questoesTotal += reg.questoesFeitas;
        acertosTotal += reg.questoesAcertadas;
        const data = reg.dataRegistro.toDate().toISOString().split('T')[0];
        contagemPorDia[data] = (contagemPorDia[data] || 0) + 1;
        if (dadosPorMateria.hasOwnProperty(reg.materia)) {
            dadosPorMateria[reg.materia].questoes += reg.questoesFeitas;
            dadosPorMateria[reg.materia].acertos += reg.questoesAcertadas;
            // Adiciona a contagem de flashcards
            dadosPorMateria[reg.materia].flashcards += (reg.flashcardsFeitos || 0);
        }
    });

    const desempenhoGeral = questoesTotal > 0 ? (acertosTotal / questoesTotal) * 100 : 0;
    document.getElementById('stat-tempo-total').textContent = `${tempoTotal} min`;
    document.getElementById('stat-questoes-total').textContent = questoesTotal;
    document.getElementById('stat-acertos-total').textContent = acertosTotal;
    document.getElementById('stat-desempenho-geral').textContent = `${desempenhoGeral.toFixed(1)}%`;
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

    const ctxDonut = document.getElementById('grafico-desempenho-geral').getContext('2d');
    if (meuGraficoDonut) meuGraficoDonut.destroy();
    meuGraficoDonut = new Chart(ctxDonut, {
        type: 'doughnut', data: { datasets: [{ data: [desempenhoGeral, 100 - desempenhoGeral], backgroundColor: ['#007BFF', '#e9edf2'], borderWidth: 0, text: `${desempenhoGeral.toFixed(0)}%` }] },
        options: { responsive: true, cutout: '75%', plugins: { legend: { display: false } } }, plugins: [pluginTextoNoCentro]
    });

    const labelsMaterias = TODAS_AS_MATERIAS;
    const dadosQuestoes = labelsMaterias.map(m => dadosPorMateria[m].questoes);
    const dadosDesempenho = labelsMaterias.map(m => { const d = dadosPorMateria[m]; return d.questoes > 0 ? (d.acertos / d.questoes) * 100 : 0; });
    const dadosFlashcards = labelsMaterias.map(m => dadosPorMateria[m].flashcards); // Pega os dados de flashcards

    const ctxQuestoes = document.getElementById('grafico-materias').getContext('2d');
    if (meuGraficoDeMaterias) meuGraficoDeMaterias.destroy();
    meuGraficoDeMaterias = new Chart(ctxQuestoes, { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Questões Feitas', data: dadosQuestoes, backgroundColor: 'rgba(54, 162, 235, 0.7)' }] }, options: { scales: { y: { beginAtZero: true } } } });

    const ctxDesempenho = document.getElementById('grafico-desempenho').getContext('2d');
    if (meuGraficoDeDesempenho) meuGraficoDeDesempenho.destroy();
    meuGraficoDeDesempenho = new Chart(ctxDesempenho, { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Desempenho (%)', data: dadosDesempenho, backgroundColor: 'rgba(255, 206, 86, 0.7)' }] }, options: { scales: { y: { beginAtZero: true, max: 100 } } } });

    const hojeFiltro = new Date();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hojeFiltro.getDate() - 6);
    const registrosDaSemana = registros.filter(reg => reg.dataRegistro.toDate() >= seteDiasAtras);
    const labelsSemanais = [], dadosAcertosSemanais = [], dadosErrosSemanais = [];
    for (let i = 0; i < 7; i++) {
        const dia = new Date(seteDiasAtras);
        dia.setDate(dia.getDate() + i);
        labelsSemanais.push( String(dia.getDate()).padStart(2, '0') + '/' + String(dia.getMonth() + 1).padStart(2, '0') );
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
    const ctxSemanal = document.getElementById('grafico-semanal').getContext('2d');
    if(meuGraficoSemanal) { meuGraficoSemanal.destroy(); }
    meuGraficoSemanal = new Chart(ctxSemanal, { type: 'line', data: { labels: labelsSemanais, datasets: [ { label: 'Acertos', data: dadosAcertosSemanais, borderColor: 'rgba(75, 192, 192, 1)', fill: true, tension: 0.1 }, { label: 'Erros', data: dadosErrosSemanais, borderColor: 'rgba(255, 99, 132, 1)', fill: true, tension: 0.1 } ] }, options: { scales: { y: { beginAtZero: true } } } });

    // CRIAÇÃO DO NOVO GRÁFICO DE FLASHCARDS
    const ctxFlashcards = document.getElementById('grafico-flashcards-materia').getContext('2d');
    if(meuGraficoFlashcards) { meuGraficoFlashcards.destroy(); }
    meuGraficoFlashcards = new Chart(ctxFlashcards, {
        type: 'bar',
        data: {
            labels: labelsMaterias,
            datasets: [{
                label: 'Flashcards Feitos',
                data: dadosFlashcards,
                backgroundColor: 'rgba(153, 102, 255, 0.7)' // Uma nova cor (roxo)
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}