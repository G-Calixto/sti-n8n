**sti-feedback-mvp**

Descrição curta
----------------

MVP de um Sistema Tutor Inteligente (STI) para o Ensino Fundamental 1. Permite que um professor envie uma imagem de uma questão resolvida por um aluno e a resposta correta; o backend envia esses dados para um webhook do n8n que orquestra análises com IA (ex.: Gemini) e retorna feedback.

Objetivo acadêmico
-------------------

Provar a viabilidade de um fluxo simples de extração e feedback automatizado usando n8n e um provedor de IA. Projeto pensado como protótipo/MVP para experimentação.

Arquitetura geral
-----------------

frontend → backend → n8n → Gemini → n8n → backend → frontend

Tecnologias utilizadas
----------------------

- Frontend: HTML/CSS/JS (simples, estático)
- Backend: Node.js + Express
- Orquestração: n8n (webhooks)
- IA: provedor externo (ex.: Gemini) via n8n

Estrutura de pastas
-------------------

```
sti-feedback-mvp/
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── backend/
│   ├── server.js
│   ├── services/
│   └── package.json
├── docs/
│   ├── arquitetura.md
│   └── contratos.md
├── .gitignore
├── .env.example
└── README.md
```

Como rodar o backend
---------------------

1. Entre na pasta `backend`:

```bash
cd backend
```

2. Instale dependências:

```bash
npm install
```

3. Copie `backend/.env.example` para `backend/.env` e ajuste os valores (URLs do n8n, porta, FRONTEND_URL).

4. Inicie o servidor:

```bash
npm start
```

Como rodar o frontend
---------------------

O frontend é estático. Opções:

- Abrir `frontend/index.html` diretamente (ex.: com Live Server no VS Code).
- Ou servir com um servidor estático (ex.: `npx serve frontend`).

Configurar variáveis de ambiente
-------------------------------

- `frontend/.env.example` (opcional, para Vite): `VITE_BACKEND_URL` — URL base do backend (ex.: `http://localhost:3000`).
- `backend/.env.example`: `PORT`, `N8N_WEBHOOK_URL`, `N8N_FEEDBACK_WEBHOOK_URL`, `FRONTEND_URL`.

Segurança
--------

Nunca envie para o GitHub arquivos com credenciais, `.env` reais ou dados sensíveis (chaves da API, tokens, dados pessoais de alunos). Use os arquivos `.env.example` como template.

Status do projeto
-----------------

MVP em desenvolvimento — finalidade acadêmica.

