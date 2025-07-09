// =================================================================
// SCRIPT DE LOGIN COM DIAGNÓSTICO
// =================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', function() {
    const botaoLogin = document.getElementById('botao-login');
    const campoCodigo = document.getElementById('codigo-acesso');

    const tentarLogin = async () => {
        const codigoDigitado = campoCodigo.value.trim();
        console.log("1. Tentando fazer login com o código:", codigoDigitado);

        if (codigoDigitado === "") {
            alert("Por favor, digite seu código de acesso.");
            return;
        }

        try {
            console.log("2. Criando consulta ao Firestore...");
            const q = query(collection(db, "alunos"), where("codigoDeAcesso", "==", codigoDigitado));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error("ERRO: Consulta ao Firestore não encontrou documentos para o código:", codigoDigitado);
                alert("Código de acesso inválido ou não encontrado.");
            } else {
                console.log("3. SUCESSO! Documento encontrado!");
                const doc = querySnapshot.docs[0];
                const aluno = doc.data();

                console.log("4. ID do Documento a ser salvo:", doc.id);
                console.log("5. Dados completos do aluno encontrados:", aluno);
                console.log("6. Nome do aluno a ser salvo:", aluno.nome); // Ponto crítico

                sessionStorage.setItem('alunoId', doc.id);
                sessionStorage.setItem('alunoNome', aluno.nome);
                console.log("7. Dados supostamente salvos no sessionStorage.");

                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error("ERRO GERAL ao tentar fazer login: ", error);
            alert("Ocorreu um erro na comunicação com o servidor. Tente novamente.");
        }
    };

    if (botaoLogin) {
        botaoLogin.addEventListener('click', tentarLogin);
    }
    if (campoCodigo) {
        campoCodigo.addEventListener('keypress', function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                tentarLogin();
            }
        });
    }
});