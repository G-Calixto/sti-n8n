// Backend URL resolution order:
// 1) Vite build: import.meta.env.VITE_BACKEND_URL
// 2) Browser global `window.__BACKEND_URL__` (optional runtime override)
// 3) Fallback to localhost for development
const BASE_URL = (import.meta.env && import.meta.env.VITE_BACKEND_URL) || window.__BACKEND_URL__ || 'http://localhost:3000';
const API_URL = `${BASE_URL.replace(/\/$/, '')}/api/submit`;

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const continueButton = document.getElementById('continueButton');
const consentInput = document.getElementById('consentAccepted');
const openTermBtn = document.getElementById('openTermBtn');
const consentModal = document.getElementById('consentModal');
const consentContent = document.getElementById('consentContent');
const agreeModalBtn = document.getElementById('agreeModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const submissionForm = document.getElementById('submissionForm');
const statusMessage = document.getElementById('statusMessage');

let teacherData = {
  teacherName: 'Anônimo',
  consentAccepted: false
};

// Carrega o texto do termo e prepara o modal
async function loadConsentText() {
  try {
    const resp = await fetch('../termo_de_consentimento.txt');
    if (!resp.ok) throw new Error('Falha ao carregar o termo.');
    const text = await resp.text();
    consentContent.textContent = text;
  } catch (err) {
    consentContent.textContent = 'Não foi possível carregar o termo.';
    console.error(err);
  }
}

function openModal() {
  consentModal.classList.remove('hidden-modal');
  consentModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  consentModal.classList.add('hidden-modal');
  consentModal.setAttribute('aria-hidden', 'true');
}

// Eventos do modal
if (openTermBtn) openTermBtn.addEventListener('click', openModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (agreeModalBtn) agreeModalBtn.addEventListener('click', () => {
  consentInput.checked = true;
  teacherData.consentAccepted = true;
  closeModal();
});

// Fecha o modal ao clicar fora do conteúdo
if (consentModal) consentModal.addEventListener('click', (e) => {
  if (e.target === consentModal) closeModal();
});

loadConsentText();

continueButton.addEventListener('click', () => {
  const consentAccepted = consentInput.checked;
  if (!consentAccepted) {
    alert('Você precisa aceitar o termo para continuar.');
    return;
  }

  teacherData = { teacherName: 'Anônimo', consentAccepted };

  step1.classList.add('hidden');
  step2.classList.remove('hidden');
});

submissionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusMessage.textContent = 'Enviando...';

  const formData = new FormData();
  const imageFile = document.getElementById('image').files[0];
  const correctAnswer = document.getElementById('correctAnswer').value.trim();

  formData.append('teacherName', teacherData.teacherName);
  formData.append('consentAccepted', String(teacherData.consentAccepted));
  formData.append('correctAnswer', correctAnswer);
  formData.append('submissionId', `sub-${Date.now()}`); // Gera um id simples para o MVP.
  formData.append('image', imageFile);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao enviar.');
    }

    statusMessage.textContent = 'Envio concluído com sucesso.';
    submissionForm.reset();
  } catch (error) {
    statusMessage.textContent = error.message;
  }
});
