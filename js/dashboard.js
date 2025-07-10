// =================================================================
// SCRIPT DO DASHBOARD (VERSÃO FINAL E COMPLETA - 09/07/2025)
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

// --- VARIÁVEIS GLOBAIS E CONSTANTES ---
let meusRegistros = []; 
let todosOsGraficos = {};
const TODAS_AS_MATERIAS = ["Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Linguagens", "Redação"];
const MAPA_DE_AREAS = {
    "Matemática": "Matemática", "Física": "Ciências da Natureza", "Química": "Ciências da Natureza", "Biologia": "Ciências da Natureza",
    "História": "Ciências Humanas", "Geografia": "Ciências Humanas", "Filosofia": "Ciências Humanas", "Sociologia": "Ciências Humanas",
    "Linguagens": "Linguagens", "Redação": "Redação"
};
const CORES_AREAS = { "Matemática": "#3498db", "Ciências da Natureza": "#2ecc71", "Ciências Humanas": "#f1c40f", "Linguagens": "#9b59b6", "Redação": "#e74c3c" };

// Estado dos filtros e ordenação
let sortStateHistorico = { column: 'dataRegistro', direction: 'desc' };
let sortStateMelhorar = { column: 'desempenho', direction: 'asc' };
let sortStateFortes = { column: 'desempenho', direction: 'desc' };
let filtroTempoDiario = '14d', filtroTempoMateria = 'total', filtroTempoArea = 'total';

// Variáveis do Cronômetro
let cronometroInterval, tempoEmSegundos = 0, cronometroAtivo = false;

// Plugin do Gráfico de Rosca
const pluginTextoNoCentro = { id: 'text-center', afterDatasetsDraw(chart) { const { ctx, data } = chart; const text = data.datasets[0].text; if (!text) return; ctx.save(); const x = chart.getDatasetMeta(0).data[0].x; const y = chart.getDatasetMeta(0).data[0].y; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 30px sans-serif'; ctx.fillStyle = '#1c3d5a'; ctx.fillText(text, x, y); ctx.restore(); } };

// --- FUNÇÕES DE INICIALIZAÇÃO E UTILITÁRIAS ---

function normalizeString(str) {
    if (!str) return '';
    return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function filtrarRegistrosPorPeriodo(periodo) {
    const agora = new Date();
    let dataInicio = new Date();
    dataInicio.setHours(0, 0, 0, 0); // Zera a hora para comparações precisas

    switch (periodo) {
        case '7d': dataInicio.setDate(agora.getDate() - 6); break;
        case '14d': dataInicio.setDate(agora.getDate() - 13); break;
        case '30d': dataInicio.setDate(agora.getDate() - 29); break;
        case 'ano': dataInicio = new Date(agora.getFullYear(), 0, 1); break;
        case '12m': dataInicio.setFullYear(agora.getFullYear() - 1); break;
        default: return meusRegistros;
    }
    
    return meusRegistros.filter(reg => reg.dataRegistro.toDate() >= dataInicio);
}

function formatarMinutosParaHorasMinutos(totalMinutos) {
    if (isNaN(totalMinutos) || totalMinutos === 0) return "0min";
    const horas = Math.floor(totalMinutos / 60);
    const minutos = Math.round(totalMinutos % 60);
    let resultado = '';
    if (horas > 0) {
        resultado += `${horas}h `;
    }
    if (minutos > 0) {
        resultado += `${minutos}min`;
    }
    return resultado.trim() || '0min';
}

document.addEventListener('DOMContentLoaded', async () => {
    const alunoId = sessionStorage.getItem('alunoId');
    if (!alunoId) {
        alert("Sessão não encontrada. Redirecionando para o login.");
        window.location.href = 'index.html';
        return;
    }
    
    configurarNavegacao();
    configurarFormulario(alunoId);
    configurarTabelasOrdenaveis();
    configurarModalPrincipal();
    configurarCronometro(alunoId);
    configurarFiltrosGraficos();
    
    const nomeAluno = sessionStorage.getItem('alunoNome');
    if (nomeAluno) {
        document.querySelector('.student-info h3').textContent = `Olá, ${nomeAluno}!`;
    }
    
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
        document.getElementById('nav-registro').click();
    } catch (error) { console.error("Erro ao buscar dados iniciais: ", error); }
}

function configurarNavegacao() {
    const navItems = { registro: document.getElementById('nav-registro'), metricas: document.getElementById('nav-metricas'), historico: document.getElementById('nav-historico'), cronometro: document.getElementById('nav-cronometro') };
    const sections = { registro: document.getElementById('registro-estudos'), metricas: document.getElementById('minhas-metricas'), historico: document.getElementById('historico-estudos'), cronometro: document.getElementById('cronometro-estudos') };
    
    const btnSubNavMetricas = document.getElementById('btn-subnav-metricas');
    const btnSubNavPontos = document.getElementById('btn-subnav-pontos');
    const pageMetricas = document.getElementById('sub-page-metricas');
    const pagePontos = document.getElementById('sub-page-pontos');

    function mudarAbaPrincipal(abaAtiva) {
        Object.keys(sections).forEach(key => sections[key]?.classList.toggle('hidden', key !== abaAtiva));
        Object.keys(navItems).forEach(key => navItems[key]?.classList.remove('active'));
        navItems[abaAtiva]?.classList.add('active');
        if (abaAtiva === 'metricas') {
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
    
    if (btnSubNavMetricas && btnSubNavPontos) {
        btnSubNavMetricas.addEventListener('click', () => mudarSubAba('metricas'));
        btnSubNavPontos.addEventListener('click', () => mudarSubAba('pontos'));
    }
}

function configurarFormulario(alunoId) {
    const formRegistro = document.getElementById('form-registro');
    if (!formRegistro) return;
    formRegistro.addEventListener('submit', async (event) => {
        event.preventDefault();
        const materiaSelecionada = document.getElementById('materia').value;
        if (!materiaSelecionada) { showCustomAlert("Por favor, selecione a matéria estudada.", "erro"); return; }
        const novoRegistro = {
            alunoId, materia: materiaSelecionada,
            conteudo: document.getElementById('conteudo').value,
            tempoEstudado: Number(document.getElementById('tempo').value) || 0,
            questoesFeitas: Number(document.getElementById('questoes').value) || 0,
            questoesAcertadas: Number(document.getElementById('acertos').value) || 0,
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

function configurarTabelasOrdenaveis() {
    document.getElementById('tabela-historico')?.querySelector('thead')?.addEventListener('click', (e) => {
        const header = e.target.closest('th');
        if (!header || !header.classList.contains('sortable')) return;
        const column = header.dataset.sort;
        const direction = sortStateHistorico.column === column && sortStateHistorico.direction === 'desc' ? 'asc' : 'desc';
        sortStateHistorico = { column, direction };
        renderizarHistorico();
    });
    document.getElementById('container-pontos-melhorar')?.addEventListener('click', (e) => {
        const header = e.target.closest('th');
        if (!header || !header.classList.contains('sortable')) return;
        const column = header.dataset.sort;
        const direction = sortStateMelhorar.column === column && sortStateMelhorar.direction === 'desc' ? 'asc' : 'desc';
        sortStateMelhorar = { column, direction };
        processarAnalisePontos();
    });
    document.getElementById('container-pontos-fortes')?.addEventListener('click', (e) => {
        const header = e.target.closest('th');
        if (!header || !header.classList.contains('sortable')) return;
        const column = header.dataset.sort;
        const direction = sortStateFortes.column === column && sortStateFortes.direction === 'desc' ? 'asc' : 'desc';
        sortStateFortes = { column, direction };
        processarAnalisePontos();
    });
}

function renderizarHistorico() {
    const tbody = document.querySelector('#tabela-historico tbody');
    if (!tbody) return;
    
    // Ordena uma cópia dos registros para não afetar a ordem original ao salvar
    const registrosOrdenados = [...meusRegistros].sort((a, b) => {
        let valA = a[sortStateHistorico.column]; 
        let valB = b[sortStateHistorico.column];
        
        if (sortStateHistorico.column === 'desempenho') {
            valA = a.questoesFeitas > 0 ? (a.questoesAcertadas / a.questoesFeitas) : -1;
            valB = b.questoesFeitas > 0 ? (b.questoesAcertadas / b.questoesFeitas) : -1;
        }
        
        if (valA?.toDate) valA = valA.toDate();
        if (valB?.toDate) valB = valB.toDate();

        if (valA < valB) return sortStateHistorico.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortStateHistorico.direction === 'asc' ? 1 : -1;
        return 0;
    });

    tbody.innerHTML = ''; 
    if (registrosOrdenados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Nenhum registro de estudo encontrado.</td></tr>';
        return;
    }

    registrosOrdenados.forEach((reg) => {
        const tr = document.createElement('tr');
        // Guarda o ID do documento na linha da tabela para fácil acesso
        tr.dataset.id = reg.id; 
        
        const desempenho = reg.questoesFeitas > 0 ? ((reg.questoesAcertadas / reg.questoesFeitas) * 100).toFixed(1) + '%' : 'N/A';
        const data = reg.dataRegistro?.toDate ? reg.dataRegistro.toDate().toLocaleDateString('pt-BR') : 'Agora';
        
        tr.innerHTML = `
            <td>${data}</td>
            <td>${reg.materia || ''}</td>
            <td>${reg.conteudo || ''}</td>
            <td>${formatarMinutosParaHorasMinutos(reg.tempoEstudado || 0)}</td>
            <td>${reg.questoesFeitas || 0}</td>
            <td>${reg.questoesAcertadas || 0}</td>
            <td>${desempenho}</td>
            <td>${reg.flashcardsFeitos || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" title="Editar">✏️</button>
                    <button class="action-btn delete-btn" title="Excluir">🗑️</button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });

    // Adiciona os eventos aos novos botões
    tbody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', abrirFormularioEdicao));
    tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', deletarRegistro));
    
    // Atualiza o visual dos cabeçalhos
    document.querySelectorAll('#tabela-historico th.sortable').forEach(th => {
        th.classList.remove('active-sort');
        if (th.dataset.sort === sortStateHistorico.column) {
            th.classList.add('active-sort');
        }
    });
}

function abrirFormularioEdicao(event) {
    const docId = event.currentTarget.closest('tr').dataset.id;
    const registro = meusRegistros.find(r => r.id === docId);
    if (!registro) return;

    const formHTML = `
        <h2>Editar Registro</h2>
        <form id="form-edicao" data-id="${docId}">
            <div class="form-group">
                <label for="edit-materia">Matéria:</label>
                <select id="edit-materia" required>
                    ${TODAS_AS_MATERIAS.map(m => `<option value="${m}" ${m === registro.materia ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="edit-conteudo">Conteúdo:</label>
                <input type="text" id="edit-conteudo" value="${registro.conteudo || ''}">
            </div>
            <div class="form-group">
                <label for="edit-tempo">Tempo (min):</label>
                <input type="number" id="edit-tempo" value="${registro.tempoEstudado || 0}">
            </div>
            <div class="form-group">
                <label for="edit-questoes">Questões:</label>
                <input type="number" id="edit-questoes" value="${registro.questoesFeitas || 0}" min="0">
            </div>
            <div class="form-group">
                <label for="edit-acertos">Acertos:</label>
                <input type="number" id="edit-acertos" value="${registro.questoesAcertadas || 0}" min="0">
            </div>
            <div class="form-group">
                <label for="edit-flashcards">Flashcards:</label>
                <input type="number" id="edit-flashcards" value="${registro.flashcardsFeitos || 0}" min="0">
            </div>
            <div class="modal-buttons">
                <button type="button" class="modal-btn btn-cancel">Cancelar</button>
                <button type="submit" class="modal-btn edit-btn">Salvar Alterações</button>
            </div>
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
    const docId = event.currentTarget.closest('tr').dataset.id;
    
    const fazerExclusao = async () => {
        try {
            await deleteDoc(doc(db, "registros", docId));
            meusRegistros = meusRegistros.filter(r => r.id !== docId);
            renderizarHistorico();
            if(!document.getElementById('minhas-metricas').classList.contains('hidden')) {
                processarMetricas();
            }
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
        if (e.target.classList.contains('close-modal-btn') || e.target === modal) {
            hideCustomModal();
        }
    });
}

function showCustomModal(contentHTML) {
    const modalBody = document.getElementById('modal-body');
    if(modalBody) {
        modalBody.innerHTML = contentHTML;
    }
    document.getElementById('main-modal').classList.remove('hidden');
}

function hideCustomModal() {
    document.getElementById('main-modal').classList.add('hidden');
}

function showCustomAlert(message, type = 'sucesso') {
    const alertHTML = `
        <h3 style="color: ${type === 'erro' ? '#dc3545' : '#1c3d5a'}">Aviso</h3>
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

function configurarFiltrosGraficos() {
    document.body.addEventListener('click', (e) => {
        const isFiltroBtn = e.target.closest('.filtro-btn');
        document.querySelectorAll('.filtro-dropdown').forEach(d => {
            if (!isFiltroBtn || d.id !== isFiltroBtn.dataset.filtroId) {
                d.classList.add('hidden');
            }
        });
        if (isFiltroBtn) {
            document.getElementById(isFiltroBtn.dataset.filtroId).classList.toggle('hidden');
            return;
        }
        const linkFiltro = e.target.closest('.filtro-dropdown a');
        if (linkFiltro) {
            e.preventDefault();
            const dropdown = linkFiltro.closest('.filtro-dropdown');
            const periodo = linkFiltro.dataset.periodo;
            const btn = document.querySelector(`[data-filtro-id="${dropdown.id}"]`);
            if (dropdown.id === 'filtro-tempo-diario') filtroTempoDiario = periodo;
            if (dropdown.id === 'filtro-tempo-materia') filtroTempoMateria = periodo;
            if (dropdown.id === 'filtro-tempo-area') filtroTempoArea = periodo;
            btn.innerHTML = `${linkFiltro.textContent} <span>▾</span>`;
            processarMetricas();
        }
    });
}

function processarMetricas() {
    Object.values(todosOsGraficos).forEach(grafico => grafico?.destroy());
    
    // 1. CÁLCULO GERAL DOS DADOS
    let tempoTotal = 0, questoesTotal = 0, acertosTotal = 0;
    const contagemPorDia = {}, dadosPorMateria = {};
    TODAS_AS_MATERIAS.forEach(materia => { dadosPorMateria[materia] = { questoes: 0, acertos: 0, flashcards: 0, tempo: 0 }; });

    meusRegistros.forEach(reg => {
        tempoTotal += reg.tempoEstudado || 0;
        questoesTotal += reg.questoesFeitas || 0;
        acertosTotal += reg.questoesAcertadas || 0;
        const data = reg.dataRegistro?.toDate ? reg.dataRegistro.toDate().toISOString().split('T')[0] : null;
        if (data) { contagemPorDia[data] = (contagemPorDia[data] || 0) + 1; }
        if (dadosPorMateria.hasOwnProperty(reg.materia)) {
            dadosPorMateria[reg.materia].questoes += reg.questoesFeitas || 0;
            dadosPorMateria[reg.materia].acertos += reg.questoesAcertadas || 0;
            dadosPorMateria[reg.materia].flashcards += (reg.flashcardsFeitos || 0);
            dadosPorMateria[reg.materia].tempo += (reg.tempoEstudado || 0);
        }
    });

    // 2. ATUALIZAÇÃO DOS CARDS DE ESTATÍSTICAS E HEATMAP
    const desempenhoGeral = questoesTotal > 0 ? (acertosTotal / questoesTotal) * 100 : 0;
    document.getElementById('stat-tempo-total').textContent = formatarMinutosParaHorasMinutos(tempoTotal);
    document.getElementById('stat-questoes-total').textContent = questoesTotal;
    document.getElementById('stat-acertos-total').textContent = acertosTotal;
    document.getElementById('stat-desempenho-geral').textContent = `${desempenhoGeral.toFixed(1)}%`;
    
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
    dataInicio.setDate(new Date().getDate() - diasAtras);
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
    
    // 3. DESENHO DOS GRÁFICOS
    const labelsMaterias = TODAS_AS_MATERIAS;
    
    todosOsGraficos.donut = new Chart(document.getElementById('grafico-desempenho-geral'), {
        type: 'doughnut',
        data: { datasets: [{ data: [desempenhoGeral, 100 - desempenhoGeral], backgroundColor: ['#007BFF', '#e9edf2'], borderWidth: 0, text: `${desempenhoGeral.toFixed(0)}%` }] },
        options: { responsive: true, cutout: '70%', plugins: { legend: { display: false } } },
        plugins: [pluginTextoNoCentro]
    });
    
    todosOsGraficos.materias = new Chart(document.getElementById('grafico-materias'), { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Questões Feitas', data: labelsMaterias.map(m => dadosPorMateria[m].questoes), backgroundColor: 'rgba(54, 162, 235, 0.7)' }] }, options: { scales: { y: { beginAtZero: true } } } });
    todosOsGraficos.desempenho = new Chart(document.getElementById('grafico-desempenho'), { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Desempenho (%)', data: labelsMaterias.map(m => { const d = dadosPorMateria[m]; return d.questoes > 0 ? (d.acertos / d.questoes) * 100 : 0; }), backgroundColor: 'rgba(255, 206, 86, 0.7)' }] }, options: { scales: { y: { beginAtZero: true, max: 100 } } } });
    todosOsGraficos.flashcards = new Chart(document.getElementById('grafico-flashcards-materia'), { type: 'bar', data: { labels: labelsMaterias, datasets: [{ label: 'Flashcards Feitos', data: labelsMaterias.map(m => dadosPorMateria[m].flashcards), backgroundColor: 'rgba(153, 102, 255, 0.7)' }] }, options: { scales: { y: { beginAtZero: true } } } });
    
    const hojeFiltro = new Date();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hojeFiltro.getDate() - 6);
    const registrosDaSemana = meusRegistros.filter(reg => reg.dataRegistro?.toDate() >= seteDiasAtras);
    const labelsSemanais = [], dadosAcertosSemanais = [], dadosErrosSemanais = [];
    for (let i = 0; i < 7; i++) {
        const dia = new Date(seteDiasAtras);
        dia.setDate(dia.getDate() + i);
        labelsSemanais.push(String(dia.getDate()).padStart(2, '0') + '/' + String(dia.getMonth() + 1).padStart(2, '0'));
        let acertosNoDia = 0, errosNoDia = 0;
        registrosDaSemana.forEach(reg => {
            if (reg.dataRegistro?.toDate().toDateString() === dia.toDateString()) {
                acertosNoDia += reg.questoesAcertadas;
                errosNoDia += reg.questoesFeitas - reg.questoesAcertadas;
            }
        });
        dadosAcertosSemanais.push(acertosNoDia);
        dadosErrosSemanais.push(errosNoDia);
    }
    todosOsGraficos.semanal = new Chart(document.getElementById('grafico-semanal'), { type: 'line', data: { labels: labelsSemanais, datasets: [ { label: 'Acertos', data: dadosAcertosSemanais, borderColor: 'rgba(75, 192, 192, 1)', fill: true, tension: 0.1 }, { label: 'Erros', data: dadosErrosSemanais, borderColor: 'rgba(255, 99, 132, 1)', fill: true, tension: 0.1 } ] }, options: { scales: { y: { beginAtZero: true } } } });

    const registrosTempoDiario = filtrarRegistrosPorPeriodo(filtroTempoDiario);
    const dadosTempoDiario = {};
    const labelsTempoDiario = [];
    const hojeData = new Date();
    const diasNoFiltro = parseInt(filtroTempoDiario.replace('d', ''));
    for (let i = diasNoFiltro - 1; i >= 0; i--) {
        const data = new Date();
        data.setDate(hojeData.getDate() - i);
        const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        labelsTempoDiario.push(dataFormatada);
        dadosTempoDiario[dataFormatada] = 0;
    }
    registrosTempoDiario.forEach(reg => {
        const dataFormatada = reg.dataRegistro.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (dadosTempoDiario.hasOwnProperty(dataFormatada)) {
            dadosTempoDiario[dataFormatada] += reg.tempoEstudado || 0;
        }
    });
    todosOsGraficos.tempoDiario = new Chart(document.getElementById('grafico-tempo-diario'), {
    type: 'bar',
    data: {
        labels: labelsTempoDiario,
        datasets: [{
            label: 'Tempo Estudado',
            data: Object.values(dadosTempoDiario),
            backgroundColor: 'rgba(0, 123, 255, 0.7)'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, // <-- MUDANÇA CRÍTICA: Permite que o gráfico preencha a caixa
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: value => `${formatarMinutosParaHorasMinutos(value)}`
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (c) => `Tempo: ${formatarMinutosParaHorasMinutos(c.raw)}`
                }
            }
        }
    }
});

    const registrosTempoMateria = filtrarRegistrosPorPeriodo(filtroTempoMateria);
    const dadosTempoPorMateria = {};
    TODAS_AS_MATERIAS.forEach(m => { dadosTempoPorMateria[m] = 0; });
    registrosTempoMateria.forEach(reg => {
        if (dadosTempoPorMateria.hasOwnProperty(reg.materia)) {
            dadosTempoPorMateria[reg.materia] += reg.tempoEstudado || 0;
        }
    });
    todosOsGraficos.tempoMateria = new Chart(document.getElementById('grafico-tempo-materia'), {
        type: 'bar',
        data: {
            labels: TODAS_AS_MATERIAS,
            datasets: [{
                label: 'Tempo Total',
                data: Object.values(dadosTempoPorMateria),
                backgroundColor: 'rgba(75, 192, 192, 0.7)'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false, // <-- CORREÇÃO: Permite que o gráfico preencha a altura do contêiner
            scales: { x: { ticks: { callback: value => formatarMinutosParaHorasMinutos(value) } } },
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `Tempo: ${formatarMinutosParaHorasMinutos(c.raw)}` } } }
        }
    });

    const registrosTempoArea = filtrarRegistrosPorPeriodo(filtroTempoArea);
    const dadosTempoPorArea = { "Matemática": 0, "Ciências da Natureza": 0, "Ciências Humanas": 0, "Linguagens": 0, "Redação": 0 };
    registrosTempoArea.forEach(reg => {
        const area = MAPA_DE_AREAS[reg.materia];
        if (area) {
            dadosTempoPorArea[area] += reg.tempoEstudado || 0;
        }
    });
    const totalTempoArea = Object.values(dadosTempoPorArea).reduce((soma, v) => soma + v, 0);
    todosOsGraficos.tempoArea = new Chart(document.getElementById('grafico-tempo-area'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(dadosTempoPorArea),
            datasets: [{
                data: Object.values(dadosTempoPorArea),
                backgroundColor: Object.values(CORES_AREAS)
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(c) {
                            const label = c.label || '';
                            const valor = c.raw;
                            const porcentagem = totalTempoArea > 0 ? ((valor / totalTempoArea) * 100).toFixed(1) : 0;
                            return `${label}: ${formatarMinutosParaHorasMinutos(valor)} (${porcentagem}%)`;
                        }
                    }
                }
            }
        }
    });
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
        const item = { ...dado, desempenho: desempenho };
        if (desempenho < 50) pontosAMelhorar.push(item);
        else if (desempenho >= 80) pontosFortes.push(item);
    });
    
    renderizarTabelaAnalise('container-pontos-melhorar', pontosAMelhorar, sortStateMelhorar);
    renderizarTabelaAnalise('container-pontos-fortes', pontosFortes, sortStateFortes);
}

function renderizarTabelaAnalise(containerId, dados, sortState) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    dados.sort((a, b) => {
        let valA = a[sortState.column]; let valB = b[sortState.column];
        if(valA?.toDate) valA = valA.toDate();
        if(valB?.toDate) valB = valB.toDate();
        if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (dados.length === 0) {
        container.innerHTML = '<p style="padding: 20px 0; text-align: center; color: #6b7280;">Nenhum conteúdo encontrado para esta categoria.</p>';
        return;
    }

    let headers = `
        <th class="sortable" data-sort="materia">Matéria</th>
        <th class="sortable" data-sort="conteudoOriginal">Conteúdo</th>
        <th class="sortable" data-sort="questoes">Questões</th>
        <th class="sortable" data-sort="acertos">Acertos</th>
        <th class="sortable" data-sort="desempenho">Desempenho</th>
        <th class="sortable" data-sort="ultimaData">Último Registro</th>`;

    container.innerHTML = `<table class="tabela-analise">
        <thead><tr>${headers}</tr></thead>
        <tbody>
            ${dados.map(d => `<tr><td>${d.materia}</td><td>${d.conteudoOriginal}</td><td>${d.questoes}</td><td>${d.acertos}</td><td>${d.desempenho.toFixed(1)}%</td><td>${d.ultimaData.toLocaleDateString('pt-br')}</td></tr>`).join('')}
        </tbody>
    </table>`;
    
    container.querySelectorAll('th.sortable').forEach(th => {
        if (th.dataset.sort === sortState.column) {
            th.classList.add('active-sort');
        }
    });
}

function configurarCronometro(alunoId) {
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');
    const btnSalvar = document.getElementById('btn-salvar-cronometro');
    const formCronometro = document.getElementById('form-cronometro');

    if(!btnStart || !btnPause || !btnReset || !btnSalvar || !formCronometro) return;

    btnPause.disabled = true;

    btnStart.addEventListener('click', () => {
        if (cronometroAtivo) return;
        cronometroAtivo = true;
        btnStart.disabled = true;
        btnPause.disabled = false;
        cronometroInterval = setInterval(() => {
            tempoEmSegundos++;
            atualizarDisplayCronometro();
        }, 1000);
    });

    btnPause.addEventListener('click', () => {
        clearInterval(cronometroInterval);
        cronometroAtivo = false;
        btnStart.disabled = false;
        btnPause.disabled = true;
    });

    btnReset.addEventListener('click', () => {
        clearInterval(cronometroInterval);
        cronometroAtivo = false;
        tempoEmSegundos = 0;
        atualizarDisplayCronometro();
        btnStart.disabled = false;
        btnPause.disabled = true;
    });

    btnSalvar.addEventListener('click', async () => {
        clearInterval(cronometroInterval);
        cronometroAtivo = false;
        btnStart.disabled = false;
        btnPause.disabled = true;

        const materiaSelecionada = document.getElementById('cronometro-materia').value;
        if (!materiaSelecionada) {
            showCustomAlert("Por favor, selecione a matéria antes de salvar.", "erro");
            return;
        }
        if (tempoEmSegundos === 0) {
             showCustomAlert("Inicie o cronômetro para registrar uma sessão.", "erro");
            return;
        }
        
        const tempoFinalEmMinutos = Math.round(tempoEmSegundos / 60);
        if (tempoFinalEmMinutos === 0) {
            showCustomAlert("Sessões com menos de 1 minuto não são salvas.", "info");
            return;
        }
        
        const novoRegistro = {
            alunoId,
            materia: materiaSelecionada,
            conteudo: document.getElementById('cronometro-conteudo').value,
            tempoEstudado: tempoFinalEmMinutos,
            questoesFeitas: Number(document.getElementById('cronometro-questoes').value) || 0,
            questoesAcertadas: Number(document.getElementById('cronometro-acertos').value) || 0,
            flashcardsFeitos: Number(document.getElementById('cronometro-flashcards').value) || 0,
            dataRegistro: Timestamp.fromDate(new Date())
        };
        try {
            const docRef = await addDoc(collection(db, "registros"), novoRegistro);
            meusRegistros.push({ id: docRef.id, ...novoRegistro });
            renderizarHistorico();
            showCustomAlert(`Sessão de ${tempoFinalEmMinutos} minuto(s) salva com sucesso!`);
            formCronometro.reset();
            btnReset.click(); // Reseta o cronômetro
        } catch (e) { showCustomAlert("Ocorreu um erro ao salvar a sessão.", "erro"); }
    });
}

function atualizarDisplayCronometro() {
    const display = document.getElementById('cronometro-display');
    if(!display) return;
    const horas = Math.floor(tempoEmSegundos / 3600);
    const minutos = Math.floor((tempoEmSegundos % 3600) / 60);
    const segundos = tempoEmSegundos % 60;
    display.textContent = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}