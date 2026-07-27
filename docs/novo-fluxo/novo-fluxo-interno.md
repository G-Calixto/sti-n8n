# Novo Fluxo Interno da Aplicação
Este documento descreve como o novo fluxo deve funcionar internamente na aplicação, a partir do fluxo atualizado proposto para o professor.

## P1 - Submissão dos dados
- **P1.A)** O frontend deve permitir o envio de uma imagem contendo um único problema matemático, com o enunciado da questão e a resposta do aluno na mesma submissão.

- **P1.B)** O frontend também deve receber, em um campo separado, a resposta correta informada pelo professor, independente da resposta apresentada pelo aluno.

- **P1.C)** Antes do envio para processamento, o professor visualiza os dados submetidos e confirma se está tudo de acordo.

- **P1.D)** Ao confirmar a submissão, o frontend envia os dados para o backend.

- **P1.E)** O backend registra e organiza a submissão recebida e aciona o fluxo de extração no n8n.

- **P1.F)** O n8n encaminha a imagem para o Gemini para extrair os dados relevantes da questão, incluindo:

	- enunciado da questão;
	- desenvolvimento do aluno;
	- resposta final do aluno;
	- legibilidade;
	- confiança da extração;
	- observações da extração, se houver.

- **P1.G)** Após o processamento, o backend recebe o retorno do n8n e devolve ao frontend os dados extraídos para exibição.

## P2 - Visualização e correção dos dados extraídos
- **P2.A)** O frontend exibe ao professor os dados extraídos da imagem, incluindo:

	- enunciado;
	- desenvolvimento do aluno;
	- resposta do aluno;
	- confiança da extração;
	- resultado da comparação entre a resposta do aluno e a resposta correta.

- **P2.B)** A aplicação realiza a comparação entre a resposta do aluno e a resposta correta informada pelo professor. Inicialmente, essa comparação pode continuar seguindo uma lógica simples, compatível com a implementação atual, mas este ponto pode evoluir posteriormente.

- **P2.C)** O professor pode corrigir manualmente os dados extraídos diretamente nos campos exibidos na interface.

- **P2.D)** Caso a extração esteja ruim ou incompleta, o professor pode reiniciar o processo e enviar uma nova submissão.

- **P2.E)** Ao clicar em iniciar processo de feedback, o frontend envia ao backend:

	- dados extraídos ou corrigidos;
	- resposta correta;
	- resultado da avaliação, indicando se a resposta está correta ou incorreta;
	- identificador da submissão, se existir.

## P3 - Questionário pedagógico
- **P3.A)** Antes da geração do feedback, o professor responde um questionário pedagógico relacionado à situação apresentada.

- **P3.B)** O questionário muda de acordo com o resultado da avaliação:

	- se a resposta do aluno estiver correta, o frontend exibe o questionário para caso de acerto;
	- se a resposta do aluno estiver incorreta, o frontend exibe o questionário para caso de erro.

- **P3.C)** O frontend deve armazenar temporariamente as respostas do questionário junto com os dados da questão enquanto o fluxo estiver em andamento.

- **P3.D)** Ao submeter o questionário, o frontend envia ao backend um payload consolidado contendo:

	- identificador da submissão;
	- resposta correta;
	- enunciado;
	- desenvolvimento do aluno;
	- resposta do aluno;
	- resultado da avaliação;
	- dados de extração;
	- respostas do questionário pedagógico;
	- campo aberto com intenção ou observação do professor.

- **P3.E)** Esses dados passam a compor o contexto enviado ao n8n e ao Gemini para a geração do feedback.

## P4 - Geração do feedback
- **P4.A)** O backend aciona o fluxo de feedback no n8n.

- **P4.B)** O n8n prepara os dados recebidos e organiza o contexto que será usado na geração do feedback.

- **P4.C)** A lógica de preparação do prompt deve ser adaptada para considerar, além dos dados atuais:

	- resultado correto ou incorreto;
	- contexto pedagógico;
	- desempenho do aluno;
	- perfil emocional;
	- intenção ou observação do professor.

- **P4.D)** O prompt enviado ao Gemini deve gerar um feedback adequado ao caso:

	- para resposta correta: reconhecimento do acerto, reforço positivo e sugestão de continuidade;
	- para resposta incorreta: reconhecimento do que o aluno tentou fazer, explicação do erro provável, orientação construtiva e próxima ação.

- **P4.E)** O Gemini retorna uma resposta estruturada.

- **P4.F)** O n8n trata a resposta da IA e organiza o conteúdo para o retorno.

- **P4.G)** O backend recebe o feedback tratado e o repassa ao frontend.

- **P4.H)** O frontend exibe o feedback em um campo editável para o professor revisar antes da finalização.

## P5 - Finalização do processo
- **P5.A)** Ao final, o professor pode:

	- aprovar o feedback;
	- editar o feedback e aprovar;
	- pedir uma nova versão ao Gemini.

- **P5.B)** Se o professor pedir uma nova versão, o frontend deve reenviar ao backend os dados da questão, o questionário e, se fizer sentido, o feedback anterior como contexto adicional.

- **P5.C)** Se o professor aprovar, o sistema deve registrar a versão final aprovada.

- **P5.D)** A versão aprovada pode ser salva junto com:

	- dados da submissão;
	- dados extraídos;
	- respostas do questionário;
	- feedback gerado;
	- feedback editado pelo professor, se houver;
	- status final do processo.

## Observações importantes para implementação futura
- Este arquivo descreve apenas a documentação do novo fluxo interno da aplicação.

- A implementação deve ser realizada depois, em etapas separadas.

- O novo fluxo exigirá mudanças futuras no frontend, no backend, nos payloads enviados ao n8n, nos prompts do Gemini e na estrutura de armazenamento e log.

- O fluxo atual não deve ser removido sem antes garantir compatibilidade com o novo fluxo.

- As alterações devem preservar o funcionamento atual até que cada etapa nova seja implementada e testada.
