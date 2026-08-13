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

O corpo consolida a extração revisada, a avaliação oficial calculada pelo backend, o questionário pedagógico, a intenção do professor e os dados de regeneração. Schema completo do questionário (todos os valores/enum aceitos por campo) em `docs/novo-fluxo/contratos.md` §3.

```json
{
  "submission_id": "sub_001",
  "feedback_generation": 1,
  "correct_answer": "25",
  "extracao": {
    "enunciado": "texto da questao",
    "desenvolvimento_aluno": "resolucao do aluno",
    "resposta_aluno": "25",
    "legibilidade": "alta",
    "confianca_extracao": 0.91,
    "observacoes": ""
  },
  "avaliacao": { "status": "incorreta", "resposta_correta": false },
  "questionario": {
    "tipo": "correta | incorreta",
    "contexto_pedagogico": { "momento_conteudo": "recente|ja_trabalhado", "estrategias_usadas": ["explicacao_direta"] },
    "perfil_emocional": { "reacao_ao_erro": "frustracao", "relacao_com_matematica": "resistencia", "receptividade_feedback": "depende_da_abordagem" },
    "caso_correto": null,
    "caso_incorreto": { "desempenho_geral": "mediano", "frequencia_erro": "as_vezes", "natureza_erro": "calculo_execucao" }
  },
  "intencao_professor": "texto livre opcional",
  "regeneracao": { "solicitada": false, "instrucao": "" }
}
```

**Importante:** `avaliacao.status`/`avaliacao.resposta_correta` já vêm calculados oficialmente pelo backend (`apps/backend/src/services/evaluationService.js`). O node `Preparar dados` **não recalcula** esse resultado — apenas lê e usa para escolher o prompt (correta/incorreta). Duplicar esse cálculo no n8n foi um bug já corrigido; não reintroduzir.

## Resposta esperada

`avaliacao.feedback_aluno` é o único campo que o backend exige de fato. Os prompts atuais em `docs/prompts/` retornam só `{"feedback_aluno": ""}` — os demais campos abaixo (`acertou`, `status_avaliacao`, `tipo_erro`, `resumo_erro`, `feedback_professor`, `dica_proxima_acao`, `confianca_feedback`) são **legado**: vêm `null` quando a IA não os retorna (o node `Tratar resposta da IA` não fabrica mais texto artificial para eles — antes gerava frases sintéticas tipo "Muito bem! Sua resposta está correta.", isso foi removido).

**Atenção ao formato de saída do node "Gerar feedback Gemini":** com `simplify` no padrão (`true`, não sobrescrito nos parâmetros), o node retorna o candidate já "desembrulhado" (`{ content: { parts: [{ text: "..." }] }, finishReason, ... }`), não o formato bruto `{ candidates: [...] }`. A função `getText()` em `Tratar resposta da IA` precisa reconhecer esse formato (`value.content.parts`) além do formato bruto — sem isso, `raw_ai_response` fica vazio, `feedback_aluno` cai no fallback `""`, e o backend rejeita a resposta com `invalid_feedback_response` mesmo com a execução do n8n aparentando sucesso (nada lança exceção). Isso já está corrigido no node atual; se o node for reescrito do zero, replicar esse caso (o parser do workflow de extração, `Code - Limpar Resposta Gemini1`, já cobre o mesmo formato via `jsonGemini.content?.parts?.[0]?.text`).

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
    "feedback_aluno": "texto para o aluno",
    "acertou": false,
    "status_avaliacao": "incorreta",
    "tipo_erro": null,
    "resumo_erro": null,
    "feedback_professor": null,
    "dica_proxima_acao": null,
    "confianca_feedback": null
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

## Regeneração

Quando `regeneracao.solicitada` é `true`, o node `Preparar dados` anexa ao prompt um bloco extra com `regeneracao.instrucao` (texto livre do professor pedindo ajustes), pedindo uma nova versão do feedback mantendo as mesmas regras de escrita. O bloco fica visível na coluna `prompt_feedback` do log no Sheets, útil para conferir se a instrução foi de fato incorporada.

## Google Sheets

O node "Append row in sheet" grava, além dos campos de extração e avaliação, o questionário pedagógico, a intenção do professor, os dados de regeneração e o prompt exato enviado ao Gemini (`prompt_feedback`) — útil para análise desta pesquisa. O `columns.value` do node já vem preenchido com o mapeamento `{{ $json.<campo> }} ` para cada coluna do `schema`; se novas colunas forem adicionadas no futuro, o mapeamento precisa ser estendido do mesmo jeito (mapear por nome, não por posição).

Colunas novas em relação à versão anterior: `feedback_generation`, `status_avaliacao_oficial`, `resposta_correta`, `tipo_prompt`, `entrada_valida`, `questionario_tipo`, `momento_conteudo`, `estrategias_usadas`, `reacao_ao_erro`, `relacao_com_matematica`, `receptividade_feedback`, `acerto_esperado`, `desempenho_geral`, `frequencia_erro`, `natureza_erro`, `intencao_professor`, `regeneracao_solicitada`, `regeneracao_instrucao`, `prompt_feedback`.

O node roda **depois** de "Respond to Webhook" (`Tratar resposta da IA -> Respond to Webhook -> Append row in sheet`), não antes — a resposta ao backend nunca fica esperando o Sheets nem é afetada por uma falha nele. Tem também `retryOnFail: true` e `onError: "continueErrorOutput"` como reforço extra.

Antes de usar o feedback em fluxo real, conferir:

- credenciais do Google Sheets;
- ID da planilha;
- aba usada;
- que a linha de cabeçalho da aba "feedback" tem as colunas novas listadas acima (o node mapeia por nome de coluna, a coluna precisa existir na planilha).

## Observacoes do export

- O export esta presente em `n8n/workflows/`.
- `n8n/workflows/Feedback.json` pode estar desatualizado frente à instância viva do n8n (ver `docs/novo-fluxo/TODO-n8n.md`, que também menciona um terceiro workflow `Extração - STI otimizado` não presente neste repositório). Reexporte o workflow `Feedback` da instância viva antes de aplicar mudanças, e reconcilie manualmente com o que está documentado aqui, em vez de sobrescrever cegamente o export vivo.
- O export contem referencias internas a credenciais do n8n e a Google Sheets.
- Essas referencias normalmente nao sao chaves secretas em texto puro, mas devem ser revisadas antes de publicar o repositorio.
