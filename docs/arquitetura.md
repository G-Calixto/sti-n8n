# Arquitetura

## Visao geral

O projeto esta organizado em duas aplicacoes:

- `apps/frontend`: React com Vite.
- `apps/backend`: Node.js com Express.

O n8n fica fora do frontend e e chamado exclusivamente pelo backend.

## Fluxo de extracao

```text
Frontend
  -> Backend: POST /api/submissions/extract
  -> n8n Workflow Extracao - STI
  -> Gemini
  -> n8n Respond to Webhook
  -> Backend
  -> Frontend
```

O backend recebe a imagem em `multipart/form-data`, valida o envio, gera `submissionId`, envia o arquivo ao n8n e guarda em memoria a extracao retornada.

## Fluxo de feedback

```text
Frontend
  -> Backend: POST /api/submissions/:id/feedback
  -> n8n Workflow Feedback
  -> Gemini
  -> n8n Respond to Webhook
  -> Backend
  -> Frontend
```

O backend busca a submissao na memoria, monta o payload com `submission_id`, `correct_answer` e `extracao`, chama o workflow de feedback e retorna a avaliacao pedagogica.

## Persistencia

Nao ha banco de dados neste MVP. As submisssoes ficam em memoria no backend. Se o processo reiniciar, e necessario enviar a imagem novamente.

## Seguranca de integracao

- O frontend fala apenas com o backend.
- Webhooks do n8n ficam em variaveis de ambiente do backend.
- Chaves Gemini ficam no n8n, nao no frontend.
- Imagens nao sao salvas permanentemente.
