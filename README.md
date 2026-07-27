# STI com n8n

MVP academico de um Sistema Tutor Inteligente para matematica do Ensino Fundamental 1.

O sistema permite que um professor aceite um termo LGPD simplificado, informe seu nome, envie uma imagem da questao resolvida pelo aluno e informe a resposta correta. O backend chama workflows do n8n que usam Gemini para extracao da imagem e geracao de feedback pedagogico.

## Fluxo

1. `Frontend -> Backend -> n8n Extracao -> Gemini -> n8n -> Backend -> Frontend`
2. `Frontend -> Backend -> n8n Feedback -> Gemini -> n8n -> Backend -> Frontend`

O frontend nunca chama o n8n diretamente. Webhooks e chaves devem ficar apenas no backend/n8n.

## Estrutura

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

## Requisitos

- Node.js 20 ou superior.
- npm 10 ou superior.
- Docker e Docker Compose (para rodar o n8n; ver secao "Rodando tudo com Docker Compose" abaixo).

## Configuracao

Copie `.env.example` para `.env` na raiz ou use as variaveis diretamente no ambiente do backend.

Principais variaveis:

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
N8N_EXTRACTION_WEBHOOK_URL=http://localhost:5678/webhook-test/extracao
N8N_FEEDBACK_WEBHOOK_URL=http://localhost:5678/webhook-test/feedback-sti
N8N_EXTRACTION_FILE_FIELD=image
UPLOAD_MAX_SIZE_MB=10
N8N_TIMEOUT_MS=120000
VITE_API_BASE_URL=http://localhost:3001

N8N_ENCRYPTION_KEY=defina-uma-chave-e-nunca-a-altere-depois
N8N_HOST=localhost
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/
N8N_EDITOR_BASE_URL=http://localhost:5678/
```

Se o n8n reclamar que o binario da imagem nao foi encontrado, ajuste `N8N_EXTRACTION_FILE_FIELD` para `image0` ou corrija o nome do binario no workflow.

`N8N_ENCRYPTION_KEY` nao pode mudar depois que ja existem credenciais/workflows salvos em `n8n_data/` — trocar o valor torna tudo que ja foi salvo ilegivel.

## Execucao local

Instale as dependencias:

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

Isso sobe backend e frontend direto com Node/Vite, mas nao sobe o n8n — para isso, use o Docker Compose (proxima secao) ou aponte `N8N_EXTRACTION_WEBHOOK_URL`/`N8N_FEEDBACK_WEBHOOK_URL` para uma instancia de n8n ja rodando em outro lugar.

URLs locais:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Healthcheck: `http://localhost:3001/api/health`

## Rodando tudo com Docker Compose

`backend`, `frontend` e `n8n` sobem juntos, na mesma rede, com um unico comando:

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Editor do n8n: `http://localhost:5678`

Dentro dessa rede o backend fala com o n8n por `http://n8n:5678/...` (nome do servico), nao por `localhost`. Os dados do n8n (workflows, credenciais, execucoes) ficam em `n8n_data/` e `local-files/` na raiz do projeto — nao sao versionados, entao precisam existir na maquina/servidor antes do primeiro `up` (copie de um ambiente ja configurado ou deixe o n8n criar do zero e configure os workflows pela UI).

Para producao (droplet), use `docker/docker-compose.prod.yml` e consulte `docs/deploy.md`.

## Endpoints

- `GET /api/health`
- `POST /api/submissions/extract`
- `POST /api/submissions/:id/feedback`

Consulte `docs/contratos-api.md` para os contratos completos.

## Workflows n8n

O estado real do n8n (workflows, credenciais, execucoes) fica em `n8n_data/`, que roda dentro do Docker Compose. Os arquivos abaixo em `n8n/workflows/` sao exports JSON de referencia/versionamento, nao a fonte de verdade:

- `n8n/workflows/Extração - STI.json`
- `n8n/workflows/Feedback.json`

O workflow de extracao ja esta integrado ao contrato do backend:

- Workflow `Extração - STI`, path `/extracao`.

O workflow de feedback tambem esta exportado, mas ainda esta em aprimoramento:

- Workflow `Feedback`, path `/feedback-sti`.
- Antes de tratar como estavel, conferir o modo de resposta do Webhook e os mapeamentos internos do fluxo.

Enquanto um workflow estiver desativado no n8n, ele so responde em `/webhook-test/...` (o que os `.env.example` usam por padrao). Para producao, **ative os workflows** no n8n para que passem a responder em `/webhook/...`, e atualize `N8N_EXTRACTION_WEBHOOK_URL`/`N8N_FEEDBACK_WEBHOOK_URL` de acordo.

Os exports podem conter IDs internos de credenciais e referencias a planilhas. Revise antes de publicar o repositorio em ambiente publico.

Consulte:

- `n8n/docs/workflow-extracao.md`
- `n8n/docs/workflow-feedback.md`

## Testes

Teste do backend:

```bash
npm test
```

Build do frontend:

```bash
npm run build
```
