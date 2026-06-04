# Resumo final da reestruturacao

## 1. Arquivos criados

- `package.json`
- `apps/backend/package.json`
- `apps/backend/.env.example`
- `apps/backend/src/app.js`
- `apps/backend/src/server.js`
- `apps/backend/src/config/env.js`
- `apps/backend/src/routes/health.js`
- `apps/backend/src/routes/submissions.js`
- `apps/backend/src/services/evaluationService.js`
- `apps/backend/src/services/n8nClient.js`
- `apps/backend/src/services/submissionService.js`
- `apps/backend/src/services/submissionStore.js`
- `apps/backend/src/middleware/errorHandler.js`
- `apps/backend/src/utils/AppError.js`
- `apps/backend/tests/evaluationService.test.js`
- `apps/frontend/package.json`
- `apps/frontend/.env.example`
- `apps/frontend/index.html`
- `apps/frontend/vite.config.js`
- `apps/frontend/src/main.jsx`
- `apps/frontend/src/App.jsx`
- `apps/frontend/src/styles.css`
- `docs/contratos-api.md`
- `docs/seguranca.md`
- `docs/deploy.md`
- `docs/lgpd.md`
- `n8n/workflows/.gitkeep`
- `n8n/docs/workflow-extracao.md`
- `n8n/docs/workflow-feedback.md`
- `docker/backend.Dockerfile`
- `docker/frontend.Dockerfile`
- `docker/docker-compose.dev.yml`
- `docker/docker-compose.prod.yml`
- `.dockerignore`

## 2. Arquivos modificados

- `README.md`
- `docs/arquitetura.md`
- `.env.example`
- `.gitignore`
- `package-lock.json`
- `out.md`

## 3. Arquivos legados removidos

- `frontend/index.html`
- `frontend/script.js`
- `frontend/styles.css`
- `frontend/.env.example`
- `backend/server.js`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/.env.example`
- `backend/send_test.js`
- `backend/temp.jpg`
- `backend/services/*`
- `backend/tests/evaluationService.test.js`
- `docs/contratos.md`
- pastas legadas `backend/` e `frontend/`
- `rascunho/`
- `termo_de_consentimento.txt`
- artefato local `apps/frontend/dist/`

## 4. Estrutura final

```text
sti-com-n8n/
+-- apps/
|   +-- frontend/
|   +-- backend/
+-- n8n/
|   +-- workflows/
|   +-- docs/
+-- docs/
+-- docker/
+-- .env.example
+-- README.md
+-- package.json
```

## 5. Como rodar localmente

Instalar dependencias:

```bash
npm install
```

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://localhost:3001`

## 6. Como configurar `.env`

Copiar `.env.example` para `.env` na raiz:

```env
PORT=3001
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
N8N_EXTRACTION_WEBHOOK_URL=http://localhost:5678/webhook-test/extracao
N8N_FEEDBACK_WEBHOOK_URL=http://localhost:5678/webhook-test/feedback-sti
N8N_EXTRACTION_FILE_FIELD=image
UPLOAD_MAX_SIZE_MB=10
N8N_TIMEOUT_MS=120000
VITE_API_BASE_URL=http://localhost:3001
```

Se o workflow de extracao reclamar de binario ausente, testar `N8N_EXTRACTION_FILE_FIELD=image0` ou corrigir o node Gemini no n8n.

## 7. Como testar `/api/health`

```bash
Invoke-WebRequest -UseBasicParsing http://localhost:3001/api/health
```

Resposta esperada:

```json
{
  "ok": true,
  "service": "sti-backend",
  "status": "online"
}
```

## 8. Como testar extracao

1. Rodar o n8n.
2. Ativar ou executar em modo teste o workflow `Extracao - STI`.
3. Garantir que `N8N_EXTRACTION_WEBHOOK_URL` aponta para `/webhook-test/extracao` ou `/webhook/extracao`, conforme o modo usado.
4. Abrir o frontend.
5. Aceitar o termo.
6. Informar resposta correta e imagem.
7. Enviar.
8. Confirmar que a tela mostra `Extraindo enunciado da questao...`.
9. Confirmar que aparecem os dados extraidos e o botao `Visualizar feedback`.

## 9. Como testar feedback

1. Fazer uma extracao com sucesso.
2. Ativar ou executar em modo teste o workflow `Feedback`.
3. Garantir que `N8N_FEEDBACK_WEBHOOK_URL` aponta para `/webhook-test/feedback-sti` ou `/webhook/feedback-sti`.
4. Clicar em `Visualizar feedback`.
5. Confirmar que a tela mostra `Gerando feedback pedagogico...`.
6. Confirmar que aparecem feedback do aluno, feedback do professor, tipo de erro, resumo, dica e confianca.

## 10. Pendencias manuais no n8n

- Os exports JSON reais nao estavam presentes em `n8n/workflows/` no momento da reestruturacao.
- Importar/adicionar os exports reais em `n8n/workflows/` sem apagar os arquivos.
- Conferir se o workflow `Extracao - STI` usa path `/extracao`.
- Conferir se o webhook de extracao responde via `Respond to Webhook`/`responseNode`.
- Conferir o nome do binario da imagem (`image` versus `image0`).
- Conferir se o workflow `Feedback` usa path `/feedback-sti`.
- Configurar o webhook de feedback para responder usando `Respond to Webhook`/`responseNode`.
- Conferir mapeamentos do node Google Sheets no workflow exportado, se ele estiver presente.
- Revisar exports antes de publicar, pois podem conter IDs internos de credenciais e planilhas.

## 11. Proximos passos para deploy

- Criar `.env` real no servidor.
- Validar os webhooks de producao do n8n.
- Rodar `npm run build`.
- Testar com `docker/docker-compose.prod.yml`.
- Configurar HTTPS e proxy reverso.
- Definir `FRONTEND_ORIGIN` com o dominio real.
- Monitorar timeouts e tamanho de upload conforme imagens reais.

## 12. Validacoes executadas

```bash
npm install
npm test
node --check apps/backend/src/server.js
node --check apps/backend/src/services/submissionService.js
npm run build
```

Tambem foi iniciado o backend e validado:

```text
GET http://localhost:3001/api/health -> 200
```

E o frontend respondeu:

```text
GET http://127.0.0.1:5173 -> 200
```
