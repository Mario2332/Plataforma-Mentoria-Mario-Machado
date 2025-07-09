// =================================================================
// SCRIPT DA PÁGINA DE LOGIN (index.html) - VERSÃO CORRIGIDA
// =================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lógica de Login
document.addEventListener('DOMContentLoaded', function() {
    const botaoLogin = document.getElementById('botao-login');
    const campoCodigo = document.getElementById('codigo-acesso');

    // Função para tentar o login ao clicar no botão ou pressionar Enter
    const tentarLogin = async () => {
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
                // SUCESSO! Encontramos o aluno.
                const doc = querySnapshot.docs[0];
                const aluno = doc.data();
                
                // CORREÇÃO CRÍTICA: Salva o ID e o Nome na memória da sessão
                sessionStorage.setItem('alunoId', doc.id);
                sessionStorage.setItem('alunoNome', aluno.nome);
                
                // Redireciona para o dashboard
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error("Erro ao tentar fazer login: ", error);
            alert("Ocorreu um erro ao conectar com o servidor. Tente novamente.");
        }
    };

    // Adiciona o evento de clique ao botão
    if (botaoLogin) {
        botaoLogin.addEventListener('click', tentarLogin);
    }

    // Adiciona o evento de "Enter" no campo de texto
    if (campoCodigo) {
        campoCodigo.addEventListener('keypress', function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Impede o comportamento padrão do formulário
                tentarLogin();
            }
        });
    }
});