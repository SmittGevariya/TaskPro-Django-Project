
export const modalState = {
    taskModal: null,
    modalForm: null,
    modalTitle: null,
    modalSaveButton: null,
    modalCloseButton: null,
    taskIdInput: null,
    confirmModal: null,
    confirmDeleteBtn: null,
    cancelDeleteBtn: null,
    modalCloseButtonX: null,
    modalCompleteButton: null,
};

export const getModalElements = () => {
    modalState.taskModal = document.getElementById('task-modal');
    modalState.modalForm = document.getElementById('modal-form');
    modalState.modalTitle = document.getElementById('modal-title');
    modalState.modalSaveButton = document.getElementById('modal-save-button');
    modalState.modalCloseButton = document.getElementById('modal-close-button');
    modalState.taskIdInput = document.getElementById('task-id');
    modalState.confirmModal = document.getElementById('confirm-delete-modal');
    modalState.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    modalState.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    modalState.modalCloseButtonX = document.getElementById('modal-close-button-x');
    modalState.modalCompleteButton = document.getElementById('modal-complete-button');
};

export const openTaskModal = () => {
    const { taskModal } = modalState;
    if (taskModal) {
        taskModal.classList.remove('hidden');
        setTimeout(() => {
            taskModal.classList.remove('opacity-0');
            const form = taskModal.querySelector('form');
            if (form) form.classList.remove('scale-95');
        }, 10);
    }
};

export const closeTaskModal = () => {
    const { taskModal } = modalState;
    if (taskModal) {
        taskModal.classList.add('opacity-0');
        const form = taskModal.querySelector('form');
        if (form) form.classList.add('scale-95');
        setTimeout(() => taskModal.classList.add('hidden'), 300);
    }
};

export const openConfirmModal = () => {
    const { confirmModal } = modalState;
    if (confirmModal) {
        confirmModal.classList.remove('hidden');
        setTimeout(() => {
            confirmModal.classList.remove('opacity-0');
            const modalContent = confirmModal.querySelector('div.relative');
            if (modalContent) modalContent.classList.remove('scale-95');
        }, 10);
    }
};

export const closeConfirmModal = () => {
    const { confirmModal } = modalState;
    if (confirmModal) {
        confirmModal.classList.add('opacity-0');
        const modalContent = confirmModal.querySelector('div.relative');
        if (modalContent) modalContent.classList.add('scale-95');
        setTimeout(() => confirmModal.classList.add('hidden'), 300);
    }
};


