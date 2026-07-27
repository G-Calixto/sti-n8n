# Deploy

## Execucao local

```bash
npm install
npm run dev:backend
npm run dev:frontend
```

## Droplet

1. Instalar Node.js 20+.
2. Clonar o repositorio.
3. Criar `.env` com as variaveis reais.
4. Rodar `npm install`.
5. Rodar build do frontend:

```bash
npm run build
```

6. Rodar o backend com process manager, por exemplo PM2:

```bash
npm run start
```

7. Configurar proxy reverso com HTTPS apontando para backend e frontend.

## Docker Compose

Arquivos base:

- `docker/docker-compose.dev.yml`
- `docker/docker-compose.prod.yml`

Os dois arquivos sobem `backend`, `frontend` e `n8n` juntos, na mesma rede do Compose. Um unico comando cuida do ambiente inteiro:

```bash
docker compose -f docker/docker-compose.prod.yml up -d
```

O n8n usa os volumes `../n8n_data` (workflows, credenciais, banco sqlite) e `../local-files`, montados a partir da raiz do `pibit-n8n`. Antes do primeiro deploy em uma droplet nova, copie essas duas pastas para o servidor (elas nao vao no `git clone`, ficam fora do versionamento de proposito).

Antes de considerar o deploy pronto:

- **Ative os dois workflows** (`Extração - STI`, `Feedback`) no n8n. Enquanto desativados, eles só respondem em `/webhook-test/...`; ativados, passam a responder em `/webhook/...`, que é o caminho esperado em producao.
- Se o backend roda **dentro** do mesmo `docker-compose` que o n8n (caso normal em producao), aponte `N8N_EXTRACTION_WEBHOOK_URL`/`N8N_FEEDBACK_WEBHOOK_URL` para `http://n8n:5678/webhook/...` (nome do servico, rede interna). Se o backend roda fora do Docker (`npm run dev:backend`) falando com um n8n publicado localmente, use `http://localhost:5678/...`.
- `N8N_ENCRYPTION_KEY` deve ser a mesma chave já usada para gerar os dados existentes em `n8n_data/` — trocar o valor torna credenciais e workflows já salvos ilegiveis.
- `N8N_HOST`, `WEBHOOK_URL` e `N8N_EDITOR_BASE_URL` devem apontar para o dominio/IP publico real da droplet, ja que o editor do n8n (porta 5678) fica exposto na internet. Configure HTTPS na frente dele tambem, nao so do backend/frontend (ver `seguranca.md`).

## Variaveis obrigatorias

```env
N8N_EXTRACTION_WEBHOOK_URL=
N8N_FEEDBACK_WEBHOOK_URL=
FRONTEND_ORIGIN=
VITE_API_BASE_URL=
N8N_ENCRYPTION_KEY=
N8N_HOST=
N8N_PROTOCOL=
WEBHOOK_URL=
N8N_EDITOR_BASE_URL=
```
