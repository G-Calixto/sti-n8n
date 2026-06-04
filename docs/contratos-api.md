# Contratos de API

## Frontend -> Backend: extracao

`POST /api/submissions/extract`

Tipo: `multipart/form-data`

Campos:

- `correctAnswer`: resposta correta.
- `consentAccepted`: deve ser `true`.
- `image`: arquivo de imagem.

## Backend -> n8n: extracao

Webhook configurado em `N8N_EXTRACTION_WEBHOOK_URL`.

Tipo: `multipart/form-data`

Campos:

- `submissionId`
- `correctAnswer`
- `consentAccepted`
- arquivo no campo configurado por `N8N_EXTRACTION_FILE_FIELD`, padrao `image`.

## n8n extracao -> Backend

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

## Backend -> Frontend: extracao concluida

```json
{
  "ok": true,
  "submission_id": "sub_001",
  "status": "extracao_concluida",
  "avaliacao_preliminar": {
    "resposta_correta": true,
    "correct_answer_normalizada": "5",
    "resposta_aluno_normalizada": "5"
  },
  "extracao": {
    "enunciado": "texto da questao",
    "desenvolvimento_aluno": "resolucao do aluno",
    "resposta_aluno": "5",
    "legibilidade": "alta",
    "confianca_extracao": 0.98,
    "observacoes": ""
  },
  "can_request_feedback": true
}
```

## Frontend -> Backend: feedback

`POST /api/submissions/:id/feedback`

O frontend envia apenas o ID pela URL. O backend busca a extracao na memoria.

## Backend -> n8n: feedback

Webhook configurado em `N8N_FEEDBACK_WEBHOOK_URL`.

```json
{
  "submission_id": "sub_001",
  "correct_answer": "5",
  "extracao": {
    "enunciado": "texto da questao",
    "desenvolvimento_aluno": "resolucao do aluno",
    "resposta_aluno": "5",
    "legibilidade": "alta",
    "confianca_extracao": 0.98,
    "observacoes": ""
  }
}
```

## n8n feedback -> Backend

```json
{
  "ok": true,
  "submission_id": "sub_001",
  "fluxo": "geracao_feedback",
  "status_n8n": "feedback_gerado_com_sucesso",
  "provedor_ia": "gemini",
  "modelo": "gemini",
  "avaliacao": {
    "acertou": true,
    "status_avaliacao": "correta",
    "tipo_erro": "nenhum",
    "resumo_erro": "",
    "feedback_aluno": "texto para o aluno",
    "feedback_professor": "texto para o professor",
    "dica_proxima_acao": "proxima acao sugerida",
    "confianca_feedback": 0.95
  },
  "entrada": {
    "correct_answer": "5",
    "enunciado": "texto da questao",
    "desenvolvimento_aluno": "resolucao do aluno",
    "resposta_aluno": "5",
    "legibilidade": "alta",
    "confianca_extracao": 0.98,
    "observacoes_extracao": ""
  },
  "erro": null
}
```

## Backend -> Frontend: feedback concluido

```json
{
  "ok": true,
  "submission_id": "sub_001",
  "status": "feedback_concluido",
  "avaliacao": {
    "acertou": true,
    "status_avaliacao": "correta",
    "tipo_erro": "nenhum",
    "resumo_erro": "",
    "feedback_aluno": "texto para o aluno",
    "feedback_professor": "texto para o professor",
    "dica_proxima_acao": "proxima acao sugerida",
    "confianca_feedback": 0.95
  }
}
```

## Erros do backend

```json
{
  "ok": false,
  "error": {
    "code": "codigo_do_erro",
    "message": "Mensagem amigavel.",
    "details": {}
  }
}
```
