# Seguranca

## Variaveis de ambiente

- Nunca commitar `.env`.
- Usar `.env.example` como referencia.
- Webhooks do n8n devem ficar apenas no backend.
- Chaves Gemini devem ficar no n8n ou no ambiente seguro do orquestrador, nunca no frontend.

## CORS

O backend usa `FRONTEND_ORIGIN` para restringir origem.

Em desenvolvimento:

```env
FRONTEND_ORIGIN=http://localhost:5173
```

Em producao, configurar o dominio real do frontend.

## Upload

- O backend usa Multer em memoria.
- Imagens nao sao salvas permanentemente.
- `UPLOAD_MAX_SIZE_MB` define o limite maximo.
- O backend aceita apenas MIME type iniciado por `image/`.

## n8n e Gemini

- O frontend nao acessa o n8n.
- URLs dos webhooks ficam em `N8N_EXTRACTION_WEBHOOK_URL` e `N8N_FEEDBACK_WEBHOOK_URL`.
- Exports de workflows podem conter IDs internos de credenciais e planilhas. Revise antes de publicar.

## Google Sheets

O backend nao depende de Google Sheets. Se algum workflow exportado usar Sheets, a configuracao deve ser validada dentro do n8n.

## Deploy

- Usar HTTPS em producao.
- Restringir CORS.
- Evitar logs com corpos completos de respostas sensiveis.
- Configurar timeouts e limites de upload.
