# Workflow de extracao

Workflow exportado: `n8n/workflows/Extração - STI.json`

Nome no n8n: `Extração - STI`

## Webhook

- Metodo: `POST`
- Path: `/extracao`
- Response mode no export atual: `responseNode`

URL usada pelo backend:

```env
N8N_EXTRACTION_WEBHOOK_URL=http://localhost:5678/webhook-test/extracao
```

## Payload esperado

Tipo: `multipart/form-data`

Campos:

- `submissionId`
- `teacherName`
- `correctAnswer`
- `consentAccepted`
- imagem como binario

## Campo binario da imagem

O backend usa `N8N_EXTRACTION_FILE_FIELD`, com valor padrao `image`.

O backend envia o arquivo no campo definido por `N8N_EXTRACTION_FILE_FIELD`. Se o n8n acusar binario nao encontrado:

- ajustar `N8N_EXTRACTION_FILE_FIELD=image0`; ou
- corrigir o workflow no n8n para ler o mesmo nome enviado pelo backend.

## Resposta esperada

```json
{
  "ok": true,
  "submission_id": "sub_001",
  "fluxo": "extracao_imagem",
  "status_n8n": "json_extraido_com_sucesso",
  "provedor_ia": "gemini",
  "modelo": "gemini",
  "extracao": {
    "enunciado": "texto da questao",
    "desenvolvimento_aluno": "resolucao do aluno",
    "resposta_aluno": "5",
    "legibilidade": "alta",
    "confianca_extracao": 0.98,
    "observacoes": ""
  },
  "erro_parse": null
}
```

## Observacoes do export

- O export esta presente em `n8n/workflows/`.
- O workflow contem referencias internas a credenciais do n8n e a Google Sheets.
- Essas referencias normalmente nao sao chaves secretas em texto puro, mas devem ser revisadas antes de publicar o repositorio.
- O backend nao depende do Google Sheets para funcionar; ele depende apenas da resposta do webhook.
