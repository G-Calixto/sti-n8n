# Contratos de API

> Este documento descreve o contrato **hoje implementado e rodando**: extração, revisão da extração, questionário pedagógico, geração de feedback e aprovação/regeneração de feedback. A fonte de verdade para o schema completo do questionário pedagógico (nomes canônicos de campo e valores/enum aceitos) é `docs/novo-fluxo/contratos.md` §3 — consulte esse arquivo para o detalhe completo.

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

> `avaliacao_preliminar` não é o resultado final: o frontend não deve tratá-la como definitiva. O resultado oficial só é (re)calculado a partir da extração revisada na etapa seguinte.

## Revisão da extração

`PATCH /api/submissions/:id/extraction`

Requisição:

```json
{
  "extracao": {
    "enunciado": "Em uma festa havia 70 doces e foram consumidos 45. Quantos sobraram?",
    "desenvolvimento_aluno": "70 - 45 = 25",
    "resposta_aluno": "25",
    "legibilidade": "alta",
    "confianca_extracao": 0.91,
    "observacoes": ""
  }
}
```

Resposta:

```json
{
  "ok": true,
  "submission_id": "sub_001",
  "status": "extracao_revisada",
  "extracao": {
    "enunciado": "Em uma festa havia 70 doces e foram consumidos 45. Quantos sobraram?",
    "desenvolvimento_aluno": "70 - 45 = 25",
    "resposta_aluno": "25",
    "legibilidade": "alta",
    "confianca_extracao": 0.91,
    "observacoes": ""
  },
  "avaliacao": {
    "resposta_correta": true,
    "status": "correta"
  }
}
```

Regras (`apps/backend/src/services/submissionService.js`, `confirmExtraction`):

- `resposta_aluno` não pode ficar vazia.
- `avaliacao` é sempre recalculada a partir de `resposta_aluno` vs. o `correctAnswer` já salvo na submissão (`evaluationService.js`) — o frontend nunca envia nem decide `resposta_correta`/`status`.
- `avaliacao.status` só assume `"correta"` ou `"incorreta"` no MVP.

## Frontend -> Backend: feedback

`POST /api/submissions/:id/feedback`

O corpo agora é obrigatório (o questionário pedagógico viaja dentro dele — não é uma rota própria). Schema completo do questionário (todos os valores/enum aceitos por campo): `docs/novo-fluxo/contratos.md` §3.

```json
{
  "questionario": {
    "tipo": "incorreta",
    "contexto_pedagogico": {
      "momento_conteudo": "recente",
      "estrategias_usadas": ["explicacao_direta"]
    },
    "perfil_emocional": {
      "reacao_ao_erro": "frustracao",
      "relacao_com_matematica": "resistencia",
      "receptividade_feedback": "depende_da_abordagem"
    },
    "caso_correto": null,
    "caso_incorreto": {
      "desempenho_geral": "mediano",
      "frequencia_erro": "as_vezes",
      "natureza_erro": "calculo_execucao"
    }
  },
  "intencao_professor": "Valorizar a estrategia usada antes de indicar o erro de calculo.",
  "regenerar": false,
  "instrucao_regeneracao": ""
}
```

Regras (`apps/backend/src/routes/submissions.js` + `submissionService.generateFeedback`):

- Exige que a extração já tenha sido revisada e confirmada.
- `questionario.tipo` deve bater com o `avaliacao.status` já salvo; se `tipo: "correta"`, `caso_correto` deve estar preenchido e `caso_incorreto` deve ser `null` (e vice-versa para `"incorreta"`).
- `regenerar: true` com `questionario: {}` reaproveita o último questionário salvo na submissão; se não houver nenhum salvo, retorna erro sem chamar o n8n.
- `intencao_professor`: texto livre opcional, até 1000 caracteres.
- `instrucao_regeneracao`: texto livre opcional, até 500 caracteres, só relevante quando `regenerar: true`.

## Backend -> n8n: feedback

Webhook configurado em `N8N_FEEDBACK_WEBHOOK_URL`.

```json
{
  "submission_id": "sub_001",
  "feedback_generation": 1,
  "correct_answer": "25",
  "extracao": {
    "enunciado": "Em uma festa havia 70 doces e foram consumidos 45. Quantos sobraram?",
    "desenvolvimento_aluno": "70 - 45 = 25",
    "resposta_aluno": "25",
    "legibilidade": "alta",
    "confianca_extracao": 0.91,
    "observacoes": ""
  },
  "avaliacao": { "status": "incorreta", "resposta_correta": false },
  "questionario": { "...schema completo, ver docs/novo-fluxo/contratos.md §3..." },
  "intencao_professor": "Valorizar a estrategia usada antes de indicar o erro de calculo.",
  "regeneracao": { "solicitada": false, "instrucao": "" }
}
```

`avaliacao.status`/`avaliacao.resposta_correta` já são o resultado oficial calculado pelo backend (`evaluationService.js`) — o workflow n8n não deve recalculá-los, apenas usá-los para escolher o prompt certo (ver `n8n/docs/workflow-feedback.md`).

## n8n feedback -> Backend

`avaliacao.feedback_aluno` é o único campo que o backend exige de fato (ver `apps/backend/src/services/submissionService.js`, `feedbackEvaluationSchema`). O backend aceita tanto o formato aninhado abaixo quanto um formato "achatado" (mesmos campos no nível raiz) ou embutido em `resposta_backend`/`resposta_backend_json` — ver `normalizeFeedbackResponse`. Os prompts atuais em `docs/prompts/` retornam só `{"feedback_aluno": ""}` — os demais campos abaixo (`acertou`, `status_avaliacao`, `tipo_erro`, `resumo_erro`, `feedback_professor`, `dica_proxima_acao`, `confianca_feedback`) são **legado**: podem vir ausentes/nulos e não devem ser tratados como garantidos.

```json
{
  "ok": true,
  "submission_id": "sub_001",
  "fluxo": "geracao_feedback",
  "status_n8n": "feedback_gerado_com_sucesso",
  "feedback_generation": 1,
  "provedor_ia": "gemini",
  "modelo": "gemini",
  "avaliacao": {
    "feedback_aluno": "texto para o aluno"
  },
  "entrada": {
    "correct_answer": "25",
    "enunciado": "texto da questao",
    "desenvolvimento_aluno": "resolucao do aluno",
    "resposta_aluno": "25",
    "legibilidade": "alta",
    "confianca_extracao": 0.91,
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
  "status_n8n": "feedback_gerado_com_sucesso",
  "feedback_generation": 1,
  "avaliacao": {
    "feedback_aluno": "texto para o aluno"
  }
}
```

Regeneração reaproveita a mesma rota (`POST /api/submissions/:id/feedback`), sem endpoint próprio:

```json
{
  "questionario": {},
  "intencao_professor": "Valorizar a estrategia usada antes de indicar o erro de calculo.",
  "regenerar": true,
  "instrucao_regeneracao": "Criar uma versão mais curta e com uma pergunta orientadora."
}
```

Falha na regeneração preserva a versão anterior de `feedback_aluno` — nunca substitui por um estado vazio/quebrado.

## Aprovação de feedback

`PATCH /api/submissions/:id/feedback/approval`

Requisição:

```json
{ "feedback_aluno": "Texto final revisado e aprovado pelo professor." }
```

Resposta:

```json
{
  "ok": true,
  "submission_id": "sub_001",
  "status": "feedback_aprovado",
  "avaliacao": { "feedback_aluno": "Texto final revisado e aprovado pelo professor." }
}
```

`feedback_aluno` não pode ser vazio. O texto salvo é exatamente o que o frontend enviar (original ou editado pelo professor) — sem identidade do aprovador nem histórico de versões anteriores no MVP.

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

Códigos usados hoje pelas rotas de submissão (`apps/backend/src/routes/submissions.js`, `apps/backend/src/services/submissionService.js`):

| Código | Quando ocorre |
|---|---|
| `invalid_submission_fields` | campos inválidos em `POST /submissions/extract` |
| `missing_image` / `invalid_image_type` | imagem ausente ou não é um arquivo de imagem |
| `missing_extraction_webhook` / `missing_feedback_webhook` | variável de ambiente do webhook n8n não configurada |
| `invalid_extraction_response` | resposta do workflow de extração não bate com o schema esperado |
| `invalid_extraction_fields` | campos inválidos em `PATCH /submissions/:id/extraction` (ex.: `resposta_aluno` vazia) |
| `submission_not_found` | `submission_id` não existe (armazenamento em memória, perdido ao reiniciar o backend) |
| `extraction_not_reviewed` | tentativa de gerar feedback sem confirmar a extração revisada antes |
| `invalid_feedback_request` | corpo inválido em `POST /submissions/:id/feedback` (schema zod ou questionário ausente) |
| `questionario_incompatible` | `questionario.tipo` não bate com `avaliacao.status`, ou `caso_correto`/`caso_incorreto` preenchidos incorretamente |
| `questionnaire_not_found` | `regenerar: true` sem questionário salvo para reaproveitar |
| `invalid_feedback_response` | resposta do workflow de feedback não bate com nenhum dos schemas aceitos (`feedback_aluno` ausente/vazio) |
| `invalid_approval_request` | `feedback_aluno` vazio em `PATCH /submissions/:id/feedback/approval` |
