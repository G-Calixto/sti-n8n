# Workflow de feedback

Workflow exportado: `n8n/workflows/Feedback.json`

Nome no n8n: `Feedback`

Status: em aprimoramento. O backend ja possui a rota de feedback e espera o contrato abaixo, mas o workflow ainda deve ser validado antes de ser considerado estavel.

## Webhook

- Metodo: `POST`
- Path: `/feedback-sti`
- Response mode no export atual: `responseNode`.

URL usada pelo backend:

```env
N8N_FEEDBACK_WEBHOOK_URL=http://localhost:5678/webhook-test/feedback-sti
```

## Atencao ao response mode

O workflow exportado usa um node `Respond to Webhook` no final. O Webhook deve estar configurado para responder usando `Respond to Webhook`/`responseNode`.

Se o Webhook nao estiver nesse modo, o backend pode receber resposta vazia, imediata ou incompleta.

## Payload esperado

O backend deve enviar o objeto `extracao` inteiro dentro do body.

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

## Resposta esperada

`feedback_aluno` e o unico campo que o backend exige de fato. Os prompts atuais em `docs/prompts/` retornam so `{"feedback_aluno": ""}` — os demais campos abaixo (`tipo_erro`, `resumo_erro`, `feedback_professor`, `dica_proxima_acao`, `confianca_feedback`) sao **legado**: podem vir vazios, ausentes ou nao confiaveis.

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
    "feedback_professor": "legado, nao garantido",
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

## Google Sheets

O workflow exportado contem node Google Sheets. O backend nao depende do Sheets para funcionar, mas o fluxo no n8n pode falhar se o node estiver ativo e sem credencial/mapeamento correto.

Antes de usar o feedback em fluxo real, conferir:

- credenciais do Google Sheets;
- ID da planilha;
- aba usada;
- mapeamento das colunas;
- se uma falha no Sheets deve ou nao impedir a resposta ao backend.

## Observacoes do export

- O export esta presente em `n8n/workflows/`.
- O fluxo ainda esta em aprimoramento.
- O export contem referencias internas a credenciais do n8n e a Google Sheets.
- Essas referencias normalmente nao sao chaves secretas em texto puro, mas devem ser revisadas antes de publicar o repositorio.
