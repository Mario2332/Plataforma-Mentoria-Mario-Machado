// =================================================================
// SCRIPT DO DASHBOARD (VERSÃO FINAL E COMPLETA) - PARTE 1
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

// Variáveis globais
let meusRegistros = []; 
let sortState = { column: 'dataRegistro', direction: 'desc' };
const TODAS_AS_MATERIAS = ["Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Linguagens"];
let todosOsGraficos = {};
const pluginTextoNoCentro = { id: 'text-center', afterDatasetsDraw(chart) { const { ctx, data } = chart; const text = data.datasets[0].text; if (!text) return; ctx.save(); const x = chart.getDatasetMeta(0).data[0].x; const y = chart.getDatasetMeta(0).data[0].y; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 30px sans-serif'; ctx.fillStyle = '#1c3d5a'; ctx.fillText(text, x, y); ctx.restore(); } };

function normalizeString(str) {
    if (!str) return '';
    return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

document.addEventListener('DOMContentLoaded', async () => {
    const alunoId = sessionStorage.getItem('alunoId');
    if (!alunoId) { window.location.href = 'index.html'; return; }
    
    configurarNavegacao(alunoId);
    configurarFormulario(alunoId);
    configurarCabecalhosTabela();
    configurarModalPrincipal();
    
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

function configurarNavegacao(alunoId) {
    const navItems = { registro: document.getElementById('nav-registro'), metricas: document.getElementById('nav-metricas'), historico: document.getElementById('nav-historico') };
    const sections = { registro: document.getElementById('registro-estudos'), metricas: document.getElementById('minhas-metricas'), historico: document.getElementById('historico-estudos') };
    
    const btnSubNavMetricas = document.getElementById('btn-subnav-metricas');
    const btnSubNavPontos = document.getElementById('btn-subnav-pontos');
    const pageMetricas = document.getElementById('sub-page-metricas');
    const pagePontos = document.getElementById('sub-page-pontos');

    function mudarAbaPrincipal(abaAtiva) {
        Object.keys(sections).forEach(key => sections[key]?.classList.toggle('hidden', key !== abaAtiva));
        Object.keys(navItems).forEach(key => navItems[key]?.classList.remove('active'));
        navItems[abaAtiva]?.classList.add('active');
        if (abaAtiva === 'metricas') {
            // Ao ir para o painel, sempre mostra a sub-aba de métricas primeiro
            mudarSubAba('metricas');
        }
    }
    
    function mudarSubAba(subAbaAtiva) {
        pageMetricas.classList.toggle('hidden', subAbaAtiva !== 'metricas');
        pagePontos.classList.toggle('hidden', subAbaAtiva !== 'pontos');
        btnSubNavMetricas.classList.toggle('active', subAbaAtiva === 'metricas');
        btnSubNavPontos.classList.toggle('active', subAbaAtiva === 'pontos');

        if (subAbaAtiva === 'metricas') processarMetricas();
        if (subAbaAtiva === 'pontos') processarAnalisePontos();
    }

    Object.keys(navItems).forEach(key => {
        if(navItems[key]) navItems[key].addEventListener('click', (e) => { e.preventDefault(); mudarAbaPrincipal(key); });
    });
    
    btnSubNavMetricas.addEventListener('click', () => mudarSubAba('metricas'));
    btnSubNavPontos.addEventListener('click', () => mudarSubAba('pontos'));
}

function configurarFormulario(alunoId) {
    const formRegistro = document.getElementById('form-registro');
    if (!formRegistro) return;
    formRegistro.addEventListener('submit', async (event) => {
        event.preventDefault();
        const novoRegistro = {
            alunoId, materia: document.getElementById('materia').value,
            conteudo: document.getElementById('conteudo').value,
            tempoEstudado: Number(document.getElementById('tempo').value),
            questoesFeitas: Number(document.getElementById('questoes').value),
            questoesAcertadas: Number(document.getElementById('acertos').value),
            flashcardsFeitos: Number(document.getElementById('flashcards').value) || 0,
            dataRegistro: Timestamp.fromDate(new Date())
        };
        try {
            const docRef = await addDoc(collection(db, "registros"), novoRegistro);
            meusRegistros.push({ id: docRef.id, ...novoRegistro });
            renderizarHistorico();
            showCustomAlert("Registro salvo com sucesso!");
            formRegistro.reset();
        } catch (e) { showCustomAlert("Ocorreu um erro ao salvar o registro.", "erro"); }
    });
}

function configurarCabecalhosTabela() {
    document.querySelectorAll('#tabela-historico th.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort; if (!column) return;
            const direction = sortState.column === column && sortState.direction === 'desc' ? 'asc' : 'desc';
            sortState = { column, direction };
            document.querySelectorAll('#tabela-historico th.sortable').forEach(th => th.classList.remove('active-sort'));
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
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Nenhum registro de estudo encontrado.</td></tr>';
        return;
    }
    meusRegistros.forEach((reg) => {
        const tr = document.createElement('tr');
        const desempenho = reg.questoesFeitas > 0 ? ((reg.questoesAcertadas / reg.questoesFeitas) * 100).toFixed(1) + '%' : 'N/A';
        const data = reg.dataRegistro?.toDate ? reg.dataRegistro.toDate().toLocaleDateString('pt-BR') : 'Agora';
        tr.innerHTML = `
            <td>${data}</td><td>${reg.materia || ''}</td><td>${reg.conteudo || ''}</td>
            <td>${reg.tempoEstudado || 0}</td><td>${reg.questoesFeitas || 0}</td>
            <td>${reg.questoesAcertadas || 0}</td><td>${desempenho}</td>
            <td>${reg.flashcardsFeitos || 0}</td>
            <td><div class="action-buttons">
                <button class="action-btn edit-btn" data-id="${reg.id}" title="Editar">✏️</button>
                <button class="action-btn delete-btn" data-id="${reg.id}" title="Excluir">🗑️</button>
            </div></td>`;
        tbody.appendChild(tr);
    });
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', abrirFormularioEdicao));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', deletarRegistro));
}

function abrirFormularioEdicao(event) {
    const docId = event.currentTarget.dataset.id;
    const registro = meusRegistros.find(r => r.id === docId);
    if (!registro) return;
    const formHTML = `<h2>Editar Registro</h2><form id="form-edicao" data-id="${docId}">
        <div class="form-group"><label for="edit-materia">Matéria:</label><select id="edit-materia" required>${TODAS_AS_MATERIAS.map(m => `<option value="${m}" ${m === registro.materia ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
        <div class="form-group"><label for="edit-conteudo">Conteúdo:</label><input type="text" id="edit-conteudo" value="${registro.conteudo || ''}"></div>
        <div class="form-group"><label for="edit-tempo">Tempo (min):</label><input type="number" id="edit-tempo" value="${registro.tempoEstudado || 0}" required min="1"></div>
        <div class="form-group"><label for="edit-questoes">Questões:</label><input type="number" id="edit-questoes" value="${registro.questoesFeitas || 0}" min="0"></div>
        <div class="form-group"><label for="edit-acertos">Acertos:</label><input type="number" id="edit-acertos" value="${registro.questoesAcertadas || 0}" min="0"></div>
        <div class="form-group"><label for="edit-flashcards">Flashcards:</label><input type="number" id="edit-flashcards" value="${registro.flashcardsFeitos || 0}" min="0"></div>
        <div class="modal-buttons"><button type="button" class="modal-btn btn-cancel">Cancelar</button><button type="submit" class="modal-btn edit-btn">Salvar Alterações</button></div>
        </form>`;
    showCustomModal(formHTML);
    document.getElementById('form-edicao').addEventListener('submit', salvarEdicao);
    document.querySelector('#main-modal .btn-cancel').addEventListener('click', hideCustomModal);
}
async function salvarEdicao(event) {
    event.preventDefault();
    const docId = event.currentTarget.dataset.id;
    const dadosAtualizados = {
        materia: document.getElementById('edit-materia').value,
        conteudo: document.getElementById('edit-conteudo').value,
        tempoEstudado: Number(document.getElementById('edit-tempo').value),
        questoesFeitas: Number(document.getElementById('edit-questoes').value),
        questoesAcertadas: Number(document.getElementById('edit-acertos').value),
        flashcardsFeitos: Number(document.getElementById('edit-flashcards').value),
    };
    try {
        const docRef = doc(db, 'registros', docId);
        await updateDoc(docRef, dadosAtualizados);
        const index = meusRegistros.findIndex(r => r.id === docId);
        meusRegistros[index] = { ...meusRegistros[index], ...dadosAtualizados };
        renderizarHistorico();
        hideCustomModal();
        showCustomAlert("Registro atualizado com sucesso!");
    } catch (error) { 
        console.error("Erro ao atualizar o documento:", error);
        showCustomAlert("Falha ao atualizar o registro.", "erro"); 
    }
}

async function deletarRegistro(event) {
    const docId = event.currentTarget.dataset.id;
    const fazerExclusao = async () => {
        try {
            await deleteDoc(doc(db, "registros", docId));
            meusRegistros = meusRegistros.filter(r => r.id !== docId);
            renderizarHistorico();
            processarMetricas();
            showCustomAlert("Registro excluído com sucesso.");
        } catch (error) { 
            console.error("Erro ao excluir o documento:", error);
            showCustomAlert("Falha ao excluir o registro.", "erro"); 
        }
    };
    showCustomConfirm("Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.", fazerExclusao);
}

function configurarModalPrincipal() {
    const modal = document.getElementById('main-modal');
    modal.addEventListener('click', (e) => {
        // Fecha se clicar no X ou fora do conteúdo
        if (e.target.classList.contains('close-modal-btn') || e.target === modal) {
            hideCustomModal();
        }
    });
}

function showCustomModal(contentHTML) {
    const modalBody = document.getElementById('modal-body');
    const modalContainer = document.getElementById('main-modal');
    modalBody.innerHTML = contentHTML;
    modalContainer.classList.remove('hidden');
}

function hideCustomModal() {
    document.getElementById('main-modal').classList.add('hidden');
}

function showCustomAlert(message) {
    const alertHTML = `
        <h3>Aviso</h3>
        <p>${message}</p>
        <div class="modal-buttons">
            <button class="modal-btn btn-cancel">OK</button>
        </div>`;
    showCustomModal(alertHTML);
    document.querySelector('#main-modal .btn-cancel').addEventListener('click', hideCustomModal);
}

function showCustomConfirm(message, onConfirm) {
    const confirmHTML = `
        <h3>Confirmação</h3>
        <p>${message}</p>
        <div class="modal-buttons">
            <button class="modal-btn btn-cancel">Cancelar</button>
            <button class="modal-btn btn-confirm">Excluir</button>
        </div>`;
    showCustomModal(confirmHTML);
    document.querySelector('#main-modal .btn-cancel').addEventListener('click', hideCustomModal);
    document.querySelector('#main-modal .btn-confirm').onclick = () => {
        hideCustomModal();
        onConfirm();
    };
}

function processarMetricas() {
    const grid = document.querySelector('#sub-page-metricas .metricas-grid');
    if (!grid) return;
    
    // Popula a estrutura do grid de métricas se estiver vazia
    if (!grid.innerHTML.trim()) {
        grid.innerHTML = `
            <div class="grid-item" id="coluna-stats"><div class="stat-card"><h4>Tempo Total de Estudo</h4><p id="stat-tempo-total">--</p></div><div class="stat-card"><h4>Total de Questões</h4><p id="stat-questoes-total">--</p></div><div class="stat-card"><h4>Total de Acertos</h4><p id="stat-acertos-total">--</p></div><div class="stat-card"><h4>Desempenho Geral</h4><p id="stat-desempenho-geral">--</p></div></div>
            <div class="grid-item" id="coluna-heatmap"><div class="heatmap-container"><h4>Mapa de Atividades (Últimos 90 dias)</h4><div id="heatmap-calendario"></div><div class="sequencia-container"><h4>Sequência de Estudos</h4><p id="stat-sequencia">0 dias</p></div></div></div>
            <div class="grid-item" id="coluna-donut"><div class="chart-container"><h3>Desempenho Geral</h3><canvas id="grafico-desempenho-geral"></canvas></div></div>
            <div class="grid-item" id="item-semanal"><div class="chart-container"><h3>Desempenho nos Últimos 7 Dias</h3><canvas id="grafico-semanal"></canvas></div></div>
            <div class="grid-item" id="item-desempenho-materia"><div class="chart-container"><h3>Desempenho (%) por Matéria</h3><canvas id="grafico-desempenho"></canvas></div></div>
            <div class="grid-item" id="item-questoes-materia"><div class="chart-container"><h3>Questões Feitas por Matéria</h3><canvas id="grafico-materias"></canvas></div></div>
            <div class="grid-item" id="item-flashcards-materia"><div class="chart-container"><h3>Flashcards Feitos por Matéria</h3><canvas id="grafico-flashcards-materia"></canvas></div></div>`;
    }

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

    const desempenhoGeral = questoesTotal > 0 ? (acertosTotal / questoesTotal) * 100 : 0;
    document.getElementById('stat-tempo-total').textContent = `${tempoTotal} min`;
    document.getElementById('stat-questoes-total').textContent = questoesTotal;
    document.getElementById('stat-acertos-total').textContent = acertosTotal;
    document.getElementById('stat-desempenho-geral').textContent = `${desempenhoGeral.toFixed(1)}%`;
    
    let sequenciaAtual = 0;
    let hoje = new Date();
    if (!contagemPorDia[hoje.toISOString().split('T')[0]]) { hoje.setDate(hoje.getDate() - 1); }
    while (contagemPorDia[hoje.toISOString().split('T')[0]]) { sequenciaAtual++; hoje.setDate(hoje.getDate() - 1); }
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
    
    Object.values(todosOsGraficos).forEach(grafico => grafico?.destroy());

    const labelsMaterias = TODAS_AS_MATERIAS;
    const dadosQuestoes = labelsMaterias.map(m => dadosPorMateria[m].questoes);
    const dadosDesempenho = labelsMaterias.map(m => { const d = dadosPorMateria[m]; return d.questoes > 0 ? (d.acertos / d.questoes) * 100 : 0; });
    const dadosFlashcards = labelsMaterias.map(m => dadosPorMateria[m].flashcards);
    
    todosOsGraficos.donut = new Chart(document.getElementById('grafico-desempenho-geral'), { type: 'doughnut', data: { datasets: [{ data: [desempenhoGeral, 100 - desempenhoGeral], backgroundColor: ['#007BFF', '#e9edf2'], borderWidth: 0, text: `${desempenhoGeral.toFixed(0)}%` }] }, options: { responsive: true, cutout: '75%', plugins: { legend: { display: false } } }, plugins: [pluginTextoNoCentro] });
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

function processarAnalisePontos() {
    const dadosPorConteudo = {};
    meusRegistros.forEach(reg => {
        if (!reg.conteudo || !reg.questoesFeitas || reg.questoesFeitas === 0) return;
        const chave = normalizeString(reg.conteudo);
        if (!dadosPorConteudo[chave]) {
            dadosPorConteudo[chave] = {
                conteudoOriginal: reg.conteudo, materia: reg.materia,
                questoes: 0, acertos: 0, ultimaData: new Date(0)
            };
        }
        dadosPorConteudo[chave].questoes += reg.questoesFeitas;
        dadosPorConteudo[chave].acertos += reg.questoesAcertadas;
        const dataRegistro = reg.dataRegistro.toDate();
        if (dataRegistro > dadosPorConteudo[chave].ultimaData) {
            dadosPorConteudo[chave].ultimaData = dataRegistro;
        }
    });

    const pontosAMelhorar = [], pontosFortes = [];
    Object.values(dadosPorConteudo).forEach(dado => {
        const desempenho = (dado.acertos / dado.questoes) * 100;
        const item = { ...dado, desempenho: desempenho.toFixed(1) };
        if (desempenho < 50) pontosAMelhorar.push(item);
        else if (desempenho >= 80) pontosFortes.push(item);
    });
    
    renderizarTabelaAnalise('container-pontos-melhorar', pontosAMelhorar);
    renderizarTabelaAnalise('container-pontos-fortes', pontosFortes);
}

function renderizarTabelaAnalise(containerId, dados) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (dados.length === 0) {
        container.innerHTML = '<p style="padding: 20px 0;">Nenhum conteúdo encontrado para esta categoria.</p>';
        return;
    }
    
    dados.sort((a, b) => a.desempenho - b.desempenho);
    if(containerId.includes('fortes')) dados.reverse();

    container.innerHTML = `<table class="tabela-analise">
        <thead><tr><th>Matéria</th><th>Conteúdo</th><th>Questões</th><th>Acertos</th><th>Desempenho</th><th>Último Registro</th></tr></thead>
        <tbody>
            ${dados.map(d => `<tr><td>${d.materia}</td><td>${d.conteudoOriginal}</td><td>${d.questoes}</td><td>${d.acertos}</td><td>${d.desempenho}%</td><td>${d.ultimaData.toLocaleDateString('pt-br')}</td></tr>`).join('')}
        </tbody>
    </table>`;
}