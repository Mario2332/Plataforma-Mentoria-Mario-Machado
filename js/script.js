// =================================================================
// SCRIPT DA PÁGINA DE LOGIN
// =================================================================

// 1. IMPORTAR AS FERRAMENTAS DO FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 2. CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCL2Lx5ccKeGVpybuxKZKLRscWYbcPgjJc",
    authDomain: "mentoria-mario-machado.firebaseapp.com",
    projectId: "mentoria-mario-machado",
    storageBucket: "mentoria-mario-machado.firebasestorage.app",
    messagingSenderId: "855508085159",
    appId: "1:855508085159:web:32f0dfe2f8244435796e82",
  };

// 3. INICIALIZAR O FIREBASE E O FIRESTORE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. ENCONTRAR OS ELEMENTOS HTML
const botaoLogin = document.getElementById('botao-login');
const campoCodigo = document.getElementById('codigo-acesso');

// 5. FUNÇÃO PRINCIPAL DE LOGIN
async function verificarLogin() {
    const codigoDigitado = campoCodigo.value.trim();

    if (codigoDigitado === "") {
        alert("Por favor, digite seu código de acesso.");
        return;
    }

    try {
        const q = query(collection(db, "alunos"), where("codigoDeAcesso", "==", codigoDigitado));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("Código de acesso inválido ou não encontrado.");
        } else {
            // ----- INÍCIO DA MUDANÇA -----
            // Pegamos os dados do primeiro documento que a consulta encontrou
            const doc = querySnapshot.docs[0];
            const aluno = doc.data(); // .data() pega os campos (nome, codigoDeAcesso)
            
            // Guardamos o ID do documento e o nome do aluno na memória do navegador
            sessionStorage.setItem('alunoId', doc.id);
            sessionStorage.setItem('alunoNome', aluno.nome);
            
            // Agora redirecionamos para o dashboard
            window.location.href = 'dashboard.html';
            // ----- FIM DA MUDANÇA -----
        }

    } catch (error) {
        console.error("Erro ao tentar fazer login: ", error);
        alert("Ocorreu um erro ao tentar conectar. Tente novamente mais tarde.");
    }
}

// 6. ADICIONAR O "OUVINTE" DE CLIQUE AO BOTÃO
botaoLogin.addEventListener('click', verificarLogin);