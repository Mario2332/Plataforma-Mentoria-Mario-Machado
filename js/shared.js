// =================================================================
// ARQUIVO DE FUNÇÕES COMPARTILHADAS (MODAIS, ETC.)
// =================================================================

// Exporta as funções para que outros arquivos possam usá-las
export function configurarModalPrincipal() {
    const modal = document.getElementById('main-modal');
    if (!modal) return;
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-modal-btn') || e.target === modal) {
            hideCustomModal();
        }
    });
}

export function showCustomModal(contentHTML) {
    const modalBody = document.getElementById('modal-body');
    const modalContainer = document.getElementById('main-modal');
    if (modalBody && modalContainer) {
        modalBody.innerHTML = contentHTML;
        modalContainer.classList.remove('hidden');
    }
}

export function hideCustomModal() {
    const modalContainer = document.getElementById('main-modal');
    if(modalContainer) modalContainer.classList.add('hidden');
}

export function showCustomAlert(message) {
    const alertHTML = `
        <h3>Aviso</h3>
        <p>${message}</p>
        <div class="modal-buttons">
            <button class="modal-btn btn-cancel">OK</button>
        </div>`;
    showCustomModal(alertHTML);
    document.querySelector('#main-modal .btn-cancel').addEventListener('click', hideCustomModal);
}

export function showCustomConfirm(message, onConfirm) {
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
        onConfirm(); // Executa a função de confirmação
    };
}