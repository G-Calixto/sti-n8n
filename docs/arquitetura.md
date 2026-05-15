# Arquitetura

Fluxo geral do sistema (MVP):

frontend → backend → n8n → Gemini → n8n → backend → frontend

Descrição resumida:

- O professor usa o frontend para enviar uma imagem da questão e a resposta correta.
- O frontend faz um POST para o `backend` com a imagem e metadados.
- O `backend` encaminha a imagem para um webhook do `n8n` responsável por extrair os dados da imagem (usando IA generativa, ex.: Gemini).
- O `n8n` orquestra chamadas ao provedor de IA e processa a extração (resposta do aluno, metadados).
- Após extrair a resposta, o `backend` realiza uma validação simples (comparação exata neste MVP) e solicita ao `n8n` um feedback gerado pela IA.
- O `n8n` retorna o feedback ao `backend`, que repassa o resultado ao frontend.

Notas:
- Nesta versão, as comunicações entre `backend` e `n8n` são realizadas via webhooks HTTP.
- Não são armazenados dados sensíveis no repositório. Configurações (URLs e chaves) devem ficar em variáveis de ambiente.
