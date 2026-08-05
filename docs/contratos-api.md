# Contratos de API

> Este documento descreve só o que está **hoje implementado e rodando** (extração + geração de feedback, 2 chamadas do frontend). O contrato do próximo passo planejado (revisão da extração, questionário pedagógico, aprovação/regeneração de feedback) está em `docs/novo-fluxo/contratos.md` — ainda sem código correspondente.

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

`feedback_aluno` é o único campo que o backend exige de fato (ver `apps/backend/src/services/submissionService.js`, `feedbackEvaluationSchema`). Os prompts atuais em `docs/prompts/` retornam só `{"feedback_aluno": ""}` — os demais campos abaixo (`tipo_erro`, `resumo_erro`, `feedback_professor`, `dica_proxima_acao`, `confianca_feedback`) são **legado**: podem vir vazios, ausentes ou não confiáveis, e não devem ser tratados como garantidos.

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
    "feedback_professor": "texto para o professor (legado, nao garantido)",
    "dica_proxima_acao": "legado, nao garantido - o prompt atual nao gera mais este campo",
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
    "feedback_professor": "legado, nao garantido",
    "dica_proxima_acao": "legado, nao garantido",
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
