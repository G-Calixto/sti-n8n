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

O n8n nao e obrigatorio no compose principal. Ele pode estar em outro diretorio ou servidor, desde que os webhooks estejam configurados no `.env`.

## Variaveis obrigatorias

```env
N8N_EXTRACTION_WEBHOOK_URL=
N8N_FEEDBACK_WEBHOOK_URL=
FRONTEND_ORIGIN=
VITE_API_BASE_URL=
```
