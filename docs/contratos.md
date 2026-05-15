# Contratos (exemplos de JSON)

1) Payload enviado do frontend para o backend (/api/submit)

```json
{
  "submissionId": "sub-1710000000000",
  "teacherName": "Gabriel",
  "correctAnswer": "35",
  "consentAccepted": "true",
  "image": "multipart/form-data file"
}
```

Obs: no endpoint real a imagem é enviada como `multipart/form-data` com o campo `image`.

2) Envio do backend para o n8n (webhook de extração)

Exemplo de corpo multipart/form-data (simplificado):

```
submissionId= sub-1710000000000
teacherName= Gabriel
correctAnswer= 35
consentAccepted= true
image= (arquivo binário)
```

3) Resposta esperada do n8n para o backend após extração

```json
{
  "ok": true,
  "submission_id": "sub-1710000000000",
  "extracao": {
    "resposta_aluno": "35",
    "outros_campos": {}
  },
  "workflow": "extracao-v1",
  "provedor_ia": "gemini",
  "modelo": "gemini-small"
}
```

4) Resposta de feedback do n8n (após solicitar feedback gerado)

```json
{
  "ok": true,
  "submission_id": "sub-1710000000000",
  "feedback_text": "O aluno acertou a operacao, recomenda-se reforcar..."
}
```

Não inclua credenciais, chaves ou dados reais nos payloads acima.
