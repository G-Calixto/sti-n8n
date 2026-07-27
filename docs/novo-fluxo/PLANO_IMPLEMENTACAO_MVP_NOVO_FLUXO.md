# Plano de Implementação MVP — Novo Fluxo da Pesquisa

> Este documento descreve somente o necessário para validar o novo fluxo pedagógico. Não inclui implementação de código, arquitetura definitiva de produção ou substituição do fluxo atual antes da validação do novo.

## 1. Objetivo do MVP

Permitir que o professor percorra o fluxo completo:

1. enviar a imagem e informar a resposta correta;
2. revisar a submissão antes do processamento;
3. conferir e corrigir os dados extraídos;
4. visualizar a confiança da extração e o resultado correto/incorreto;
5. responder a um questionário pedagógico condicional;
6. gerar feedback com os dados corrigidos e o contexto informado;
7. editar e aprovar o feedback do aluno;
8. solicitar uma nova versão do feedback;
9. reiniciar o processo quando necessário.

O objetivo é validar a experiência e a utilidade pedagógica do novo fluxo com o menor número possível de mudanças seguras. Para este MVP, o estado pode continuar em memória e será perdido ao reiniciar o backend ou atualizar a página.

## 2. O que será implementado agora

### Frontend

- Etapa de revisão da imagem e da resposta correta antes da extração.
- Permanência da imagem e da resposta correta na tela durante todo o processo.
- Revisão editável de:
  - enunciado;
  - desenvolvimento do aluno;
  - resposta do aluno.
- Exibição de legibilidade, observações e confiança da extração.
- Alerta visual de baixa confiança, sem bloqueio automático.
- Resultado oficial correto/incorreto calculado pelo backend após a revisão.
- Questionário específico para resposta correta ou incorreta.
- Campo aberto para observação/intenção do professor.
- Envio do contexto completo para geração do feedback.
- Exibição final apenas do `feedback_aluno`.
- Edição local do `feedback_aluno`.
- Aprovação simples do texto final, com persistência no `Map`.
- Solicitação de nova versão do feedback.
- Reinício integral do fluxo.

### Backend

- Manutenção das rotas atuais sempre que possível.
- Inclusão de uma única rota para confirmar a extração corrigida e recalcular o resultado.
- Adaptação da rota atual de feedback para receber questionário, intenção do professor e opção de regeneração.
- Comparação oficial centralizada em `evaluationService.js`.
- Persistência temporária no `Map` atual.
- Validação dos novos payloads com Zod.
- Envio do payload consolidado ao n8n.
- Normalização e validação do retorno do n8n.

### n8n/Gemini

- Adaptação do workflow atual de feedback, preferencialmente em uma cópia de trabalho até sua validação.
- Recebimento do novo payload sem recalcular correto/incorreto.
- Prompt adaptado para incorporar dados da questão, resultado e contexto pedagógico.
- Retorno estruturado contendo `feedback_aluno` como único campo obrigatório do conteúdo gerado.
- Manutenção do workflow atual disponível até o novo caminho ser validado.

## 3. O que ficará para depois

- PostgreSQL ou qualquer banco definitivo.
- API v2.
- Feature flag.
- Autenticação e identificação persistente do professor.
- Recuperação de uma submissão após reinício do backend ou atualização da página.
- Persistência da imagem.
- Histórico completo de versões do feedback.
- Aprovação final auditável.
- Histórico e auditoria da aprovação simples realizada no MVP.
- Auditoria detalhada, trilha de alterações e diffs.
- Concorrência, idempotência avançada e controle de versão.
- Classificação parcial ou override manual do resultado.
- Comparação matemática semântica ou por equivalência algébrica.
- LGPD avançada além das medidas já existentes.
- Reestruturação completa do frontend.
- Separação ampla de services, repositories ou schemas.
- Refatoração geral dos workflows n8n.
- Mudanças em credenciais, banco, deploy ou infraestrutura.

O ponto futuro de entrada do banco será a substituição de `apps/backend/src/services/submissionStore.js` por um repositório persistente com a mesma responsabilidade de salvar, consultar e atualizar submissões.

## 4. Alterações mínimas no frontend

### Arquivos prováveis

- `apps/frontend/src/App.jsx`
  - manter como orquestrador do MVP;
  - incluir as novas etapas, estados, formulários e chamadas HTTP.
- `apps/frontend/src/styles.css`
  - estilos dos campos editáveis, confiança, resultado, questionário e feedback final.
- Opcionalmente, para evitar crescimento excessivo de `App.jsx`:
  - `apps/frontend/src/components/ExtractionReview.jsx`;
  - `apps/frontend/src/components/PedagogicalQuestionnaire.jsx`;
  - `apps/frontend/src/components/FeedbackReview.jsx`.

Não é necessário adicionar biblioteca de formulário ou gerenciamento global de estado.

### Estados necessários

- `view`, acrescentando etapas equivalentes a:
  - `revisao_submissao`;
  - `extracao_concluida`;
  - `salvando_revisao`;
  - `questionario`;
  - `gerando_feedback`;
  - `feedback_concluido`.
- `extractionDraft`:
  - cópia editável da extração recebida.
- `evaluation`:
  - resultado oficial retornado pelo backend após a revisão.
- `questionnaire`:
  - respostas comuns e respostas condicionais.
- `teacherIntention`:
  - observação ou intenção livre do professor.
- `feedbackDraft`:
  - `feedback_aluno`.
- `feedbackGeneration`:
  - contador simples da versão exibida;
  - estado de regeneração;
  - erro da última tentativa.
- `feedbackApproval`:
  - estado de envio da aprovação;
  - indicação de texto aprovado.

### Fluxo mínimo de telas

1. **Submissão:** professor seleciona imagem e informa a resposta correta.
2. **Revisão da submissão:** imagem e resposta correta são conferidas antes de chamar a extração.
3. **Revisão da extração:** os dados extraídos são exibidos e os três campos principais são editáveis.
4. **Confirmação da extração:** frontend envia os dados corrigidos ao backend e recebe o resultado oficial.
5. **Questionário:** formulário correto ou incorreto é exibido conforme o resultado retornado.
6. **Geração:** dados revisados e questionário são enviados pela rota de feedback.
7. **Revisão final:** somente o feedback do aluno fica visível e editável.
8. **Aprovação, regeneração ou reinício:** professor aprova o texto, solicita outra versão ou começa novamente.

### Regras de interface

- Imagem e resposta correta devem permanecer em uma seção de contexto durante as etapas 3 a 7.
- A confiança deve ser apresentada como percentual, com alerta quando for menor que `70%`. Esse limiar é apenas de interface no MVP e não impede a continuidade.
- O resultado deve ser exibido somente após a confirmação dos dados corrigidos.
- Alterar a resposta do aluno depois da confirmação deve invalidar o resultado anterior e exigir nova confirmação.
- O botão de geração deve permanecer desabilitado enquanto faltarem respostas obrigatórias do questionário.
- “Pedir nova versão” reutiliza os mesmos dados revisados e o mesmo questionário.
- A nova versão substitui somente a versão exibida no frontend e no `Map`; não haverá histórico completo no MVP.
- Se a regeneração falhar, a versão anterior deve continuar visível.
- “Aprovar” envia o valor atual de `feedback_aluno`, inclusive quando editado, e salva esse texto como feedback final aprovado.
- Após aprovação, a interface deve confirmar o sucesso sem exigir histórico, identidade do professor ou trilha de auditoria.
- “Reiniciar processo” limpa todo o estado local, incluindo imagem, questionário e feedback.

### Ordem de implementação no frontend

1. revisão da submissão e permanência do contexto;
2. extração editável e confiança;
3. confirmação da extração e resultado oficial;
4. questionários condicionais;
5. envio do novo payload;
6. feedback final editável;
7. aprovação simples;
8. regeneração e reinício;
9. estados de loading e erro de cada etapa.

## 5. Alterações mínimas no backend

### Rotas

#### Manter

- `POST /api/submissions/extract`
  - continua recebendo imagem, resposta correta e consentimento;
  - continua executando a extração e salvando a submissão em memória;
  - pode continuar retornando `avaliacao_preliminar`, mas o frontend não deve tratá-la como resultado final antes da revisão.

#### Adicionar

- `PATCH /api/submissions/:id/extraction`
  - recebe os dados extraídos corrigidos;
  - valida e salva a revisão no `Map`;
  - recalcula correto/incorreto no backend;
  - retorna a extração revisada e a avaliação oficial.

Essa rota é necessária para que o questionário condicional use o resultado recalculado pelo backend.

#### Adaptar

- `POST /api/submissions/:id/feedback`
  - passa a receber body JSON;
  - recebe questionário, intenção do professor e indicador de regeneração;
  - busca no `Map` a resposta correta, a extração revisada e a avaliação oficial;
  - rejeita a solicitação caso a extração ainda não tenha sido confirmada;
  - monta o payload consolidado para o n8n;
  - salva apenas o último feedback retornado.

- `PATCH /api/submissions/:id/feedback/approval`
  - recebe somente o `feedback_aluno` final;
  - aceita o texto original ou editado pelo professor;
  - salva no `Map` o texto final e o estado simples `aprovado`;
  - não cria histórico, usuário aprovador ou trilha de auditoria.

Para compatibilidade temporária, a rota pode aceitar body vazio e executar o comportamento atual enquanto o frontend novo não estiver validado. Esse fallback deve ser claramente marcado como legado e removido somente em etapa posterior.

### Arquivos e services

- `apps/backend/src/routes/submissions.js`
  - schema da revisão;
  - nova rota `PATCH`;
  - schema do questionário e da solicitação de feedback;
  - schema e rota da aprovação simples.
- `apps/backend/src/services/submissionService.js`
  - função para confirmar a extração;
  - montagem do novo payload de feedback;
  - controle simples de regeneração;
  - aprovação simples do `feedback_aluno`;
  - validação do retorno atualizado.
- `apps/backend/src/services/evaluationService.js`
  - permanece como única fonte da comparação;
  - sem ampliar a comparação para equivalência matemática neste MVP.
- `apps/backend/src/services/submissionStore.js`
  - permanece usando `Map`;
  - passa a guardar extração original, extração revisada, avaliação, questionário, último feedback e feedback final aprovado.
- `apps/backend/src/services/n8nClient.js`
  - não precisa de nova função; `callFeedbackWorkflow` continua enviando JSON.
- `apps/backend/tests/evaluationService.test.js`
  - manter os testes atuais e acrescentar casos de comparação após revisão.
- Arquivo de teste de rota/service, se a estrutura atual permitir sem grande preparação:
  - revisão inexistente;
  - questionário incompatível com o resultado;
  - payload válido correto e incorreto;
  - regeneração.

### Estado mínimo da submissão em memória

```json
{
  "submission_id": "sub_001",
  "correctAnswer": "25",
  "extracao_original": {},
  "extracao_revisada": {},
  "avaliacao": {},
  "questionario": {},
  "feedback": {},
  "feedback_generation": 1,
  "feedback_final_aprovado": "",
  "feedback_aprovado": false
}
```

### Validações necessárias

- ID da submissão deve existir no `Map`.
- `enunciado`, `desenvolvimento_aluno` e `resposta_aluno` devem ser strings.
- `resposta_aluno` não pode ficar vazia ao confirmar a revisão.
- A avaliação deve sempre ser recalculada pelo backend; não aceitar `correta/incorreta` informado pelo frontend como fonte oficial.
- O tipo do questionário deve corresponder à avaliação:
  - `correta` exige `caso_correto`;
  - `incorreta` exige `caso_incorreto`.
- Campos fechados devem aceitar apenas os valores previstos.
- Intenção do professor pode ser opcional, com limite de tamanho.
- Geração de feedback exige extração revisada e avaliação oficial.
- Retorno do n8n deve conter uma string não vazia em `feedback_aluno`.
- Campos como `feedback_professor`, `dica_proxima_acao`, `tipo_erro` e `confianca_feedback` podem ser aceitos por compatibilidade, mas não são obrigatórios para o MVP.
- Se `regenerar: true` e `questionario` estiver vazio, reutilizar o questionário salvo na submissão.
- Se a regeneração não receber questionário e não houver questionário salvo, retornar erro claro, por exemplo `questionnaire_not_found`.
- Erro de regeneração não deve apagar o feedback anterior.
- Aprovação exige `feedback_aluno` não vazio e salva exatamente o texto enviado pelo frontend.

## 6. Alterações mínimas no n8n

### Estratégia segura

- Não remover nem sobrescrever imediatamente o workflow atual.
- Criar uma cópia do workflow `Feedback` para ajuste e teste, ou exportar um backup antes da alteração.
- Manter o mesmo webhook configurado no backend somente após a cópia ajustada passar pelos testes do fluxo completo.
- Não alterar credenciais.
- Não reestruturar o workflow de extração para este MVP, exceto se um problema atual impedir o teste real.

### Entrada do workflow de feedback

O workflow deve passar a ler:

- `submission_id`;
- `feedback_generation`;
- `correct_answer`;
- `reviewed_extraction`;
- `evaluation`;
- `questionnaire`;
- `teacher_intention`;
- `regeneration`.

O n8n não deve comparar novamente as respostas. Deve usar `evaluation.status` enviado pelo backend.

### Preparação do prompt

Adaptar o nó `Preparar dados` para montar um prompt que use:

- enunciado;
- desenvolvimento do aluno;
- resposta do aluno;
- resposta correta;
- resultado correto/incorreto;
- contexto pedagógico;
- desempenho;
- perfil emocional;
- intenção do professor.

Mapeamento mínimo:

- **contexto pedagógico:** momento em que o conteúdo foi trabalhado, estratégias usadas e receptividade ao feedback;
- **desempenho:** expectativa de acerto, no caso correto, ou desempenho geral e frequência do erro, no caso incorreto;
- **perfil emocional:** reação ao erro e relação com matemática;
- **intenção do professor:** campo aberto enviado separadamente.

O prompt deve:

- tratar as informações do questionário como contexto, não como diagnóstico definitivo;
- evitar rótulos sobre capacidade do aluno;
- produzir linguagem adequada ao aluno;
- retornar somente JSON;
- gerar somente o feedback direcionado ao aluno como conteúdo obrigatório;
- considerar `regeneration.instruction`, quando houver, para variar a nova versão.

### Resposta do Gemini

Formato mínimo esperado:

```json
{
  "feedback_aluno": "Texto direcionado ao aluno."
}
```

O nó de tratamento deve:

- remover cercas de markdown, se existirem;
- tentar extrair o objeto JSON;
- considerar sucesso quando houver `feedback_aluno` válido;
- devolver erro explícito se o conteúdo não puder ser validado;
- preservar os metadados atuais úteis, como modelo e status, sem torná-los obrigatórios para a tela final.

O workflow pode continuar retornando `feedback_professor`, `dica_proxima_acao`, `tipo_erro`, `confianca_feedback` e outros campos existentes. Eles serão opcionais e poderão ser ignorados pelo backend ou preservados apenas para compatibilidade legada/log. O frontend do MVP não deve depender deles.

## 7. Payloads MVP sugeridos

Os nomes abaixo preservam o padrão atual em português para a extração e evitam uma migração ampla de contrato.

### Dados extraídos corrigidos

Requisição:

`PATCH /api/submissions/sub_001/extraction`

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

### Questionário

Caso correto:

```json
{
  "tipo": "correta",
  "contexto_pedagogico": {
    "momento_conteudo": "recente",
    "estrategias_usadas": ["explicacao_direta", "resolucao_em_grupo"],
    "receptividade_feedback": "boa"
  },
  "perfil_emocional": {
    "reacao_ao_erro": "busca_compreender",
    "relacao_com_matematica": "neutra"
  },
  "caso_correto": {
    "acerto_esperado": "sim"
  },
  "caso_incorreto": null
}
```

Caso incorreto:

```json
{
  "tipo": "incorreta",
  "contexto_pedagogico": {
    "momento_conteudo": "recente",
    "estrategias_usadas": ["explicacao_direta", "resolucao_em_grupo"],
    "receptividade_feedback": "depende_da_abordagem"
  },
  "perfil_emocional": {
    "reacao_ao_erro": "frustracao",
    "relacao_com_matematica": "insegura"
  },
  "caso_correto": null,
  "caso_incorreto": {
    "desempenho_geral": "mediano",
    "frequencia_erro": "as_vezes",
    "natureza_erro": "calculo"
  }
}
```

Os valores finais das opções devem ser confirmados com a equipe pedagógica antes da implementação, mas a estrutura deve permanecer pequena e estável.

### Solicitação de feedback

Frontend para backend:

`POST /api/submissions/sub_001/feedback`

```json
{
  "questionario": {
    "tipo": "incorreta",
    "contexto_pedagogico": {
      "momento_conteudo": "recente",
      "estrategias_usadas": ["explicacao_direta"],
      "receptividade_feedback": "depende_da_abordagem"
    },
    "perfil_emocional": {
      "reacao_ao_erro": "frustracao",
      "relacao_com_matematica": "insegura"
    },
    "caso_correto": null,
    "caso_incorreto": {
      "desempenho_geral": "mediano",
      "frequencia_erro": "as_vezes",
      "natureza_erro": "calculo"
    }
  },
  "intencao_professor": "Valorizar a estratégia usada antes de indicar o erro de cálculo.",
  "regenerar": false,
  "instrucao_regeneracao": ""
}
```

Payload consolidado do backend para o n8n:

```json
{
  "submission_id": "sub_001",
  "feedback_generation": 1,
  "correct_answer": "25",
  "reviewed_extraction": {
    "enunciado": "Em uma festa havia 70 doces e foram consumidos 45. Quantos sobraram?",
    "desenvolvimento_aluno": "70 - 45 = 15",
    "resposta_aluno": "15",
    "legibilidade": "alta",
    "confianca_extracao": 0.91,
    "observacoes": ""
  },
  "evaluation": {
    "status": "incorreta",
    "resposta_correta": false
  },
  "questionnaire": {
    "tipo": "incorreta",
    "contexto_pedagogico": {
      "momento_conteudo": "recente",
      "estrategias_usadas": ["explicacao_direta"],
      "receptividade_feedback": "depende_da_abordagem"
    },
    "perfil_emocional": {
      "reacao_ao_erro": "frustracao",
      "relacao_com_matematica": "insegura"
    },
    "caso_correto": null,
    "caso_incorreto": {
      "desempenho_geral": "mediano",
      "frequencia_erro": "as_vezes",
      "natureza_erro": "calculo"
    }
  },
  "teacher_intention": "Valorizar a estratégia usada antes de indicar o erro de cálculo.",
  "regeneration": {
    "requested": false,
    "instruction": ""
  }
}
```

Para pedir nova versão, o frontend repete a chamada com:

```json
{
  "questionario": {},
  "intencao_professor": "Valorizar a estratégia usada antes de indicar o erro de cálculo.",
  "regenerar": true,
  "instrucao_regeneracao": "Criar uma versão mais curta e com uma pergunta orientadora."
}
```

Quando `regenerar: true` e `questionario` vier vazio, o backend deve reutilizar o questionário salvo na submissão. Se não existir questionário salvo, deve retornar erro claro e não chamar o n8n. A nova versão mantém `feedback_aluno` como único campo obrigatório e só substitui o feedback anterior após sucesso.

### Retorno do feedback

```json
{
  "ok": true,
  "submission_id": "sub_001",
  "status": "feedback_concluido",
  "feedback_generation": 1,
  "avaliacao": {
    "feedback_aluno": "Você escolheu a operação adequada. Revise com atenção a subtração de 70 por 45."
  }
}
```

Para o MVP, será mantido `avaliacao.feedback_aluno` porque esse formato é compatível com o backend e o frontend atuais. Conceitualmente, o contrato ideal seria:

```json
{
  "feedback": {
    "feedback_aluno": "Texto direcionado ao aluno."
  }
}
```

Essa mudança de envelope fica para depois, evitando uma alteração ampla agora. O frontend novo deve ler `avaliacao.feedback_aluno`.

### Aprovação simples do feedback

Requisição:

`PATCH /api/submissions/sub_001/feedback/approval`

```json
{
  "feedback_aluno": "Texto final revisado e aprovado pelo professor."
}
```

Resposta:

```json
{
  "ok": true,
  "submission_id": "sub_001",
  "status": "feedback_aprovado",
  "avaliacao": {
    "feedback_aluno": "Texto final revisado e aprovado pelo professor."
  }
}
```

A aprovação salva somente o texto final e o estado simples no `Map`. Aprovação auditável, identificação do aprovador e histórico ficam fora do MVP.

## 8. Ordem recomendada de implementação

### Etapa 1 — Fixar o contrato mínimo

Tarefas:

- confirmar perguntas, opções e obrigatoriedade do questionário;
- registrar os quatro payloads deste documento;
- definir `correta` e `incorreta` como os únicos resultados do MVP.

Critério de aceite:

- frontend, backend e responsável pedagógico usam os mesmos nomes de campos e valores.

### Etapa 2 — Confirmar extração revisada no backend

Tarefas:

- criar `PATCH /api/submissions/:id/extraction`;
- validar os campos corrigidos;
- salvar a revisão no `Map`;
- recalcular a avaliação em `evaluationService.js`.

Critério de aceite:

- alterar `resposta_aluno` e confirmar a revisão atualiza o resultado correto/incorreto retornado pelo backend.

### Etapa 3 — Criar a revisão no frontend

Tarefas:

- incluir revisão antes da extração;
- manter imagem e resposta correta visíveis;
- transformar os três campos extraídos em campos editáveis;
- exibir confiança, legibilidade, observações e resultado;
- permitir reinício.

Critério de aceite:

- o professor revisa a submissão, corrige a extração e vê o resultado recalculado sem perder imagem ou resposta correta.

### Etapa 4 — Implementar questionário condicional

Tarefas:

- criar campos comuns;
- criar bloco de caso correto;
- criar bloco de caso incorreto;
- preservar as respostas ao navegar dentro do fluxo;
- validar campos obrigatórios antes da geração.

Critério de aceite:

- somente o questionário correspondente ao resultado oficial aparece e um payload válido é produzido.

### Etapa 5 — Adaptar a rota de feedback

Tarefas:

- validar questionário e intenção;
- exigir extração confirmada;
- montar o payload consolidado;
- manter compatibilidade temporária com a chamada sem body;
- salvar questionário e último feedback no `Map`.

Critério de aceite:

- testes ou inspeção controlada confirmam que o n8n recebe dados corrigidos, resposta correta, avaliação, questionário e intenção.

### Etapa 6 — Adaptar workflow e prompt

Tarefas:

- trabalhar em cópia segura do workflow;
- atualizar o nó de preparação;
- retirar a comparação duplicada;
- adaptar o prompt;
- validar o JSON de retorno;
- testar um caso correto e um incorreto.

Critério de aceite:

- os dois casos retornam `feedback_aluno` válido, usando informações do questionário.

### Etapa 7 — Exibir e editar o feedback

Tarefas:

- exibir somente `feedback_aluno`;
- usar um `textarea` controlado;
- manter as edições no estado local;
- permitir aprovação do texto atual;
- permitir reinício.

Critério de aceite:

- o professor consegue revisar, alterar e aprovar o `feedback_aluno` sem visualizar campos internos desnecessários.

### Etapa 8 — Implementar nova versão

Tarefas:

- repetir a chamada à rota atual com `regenerar: true`;
- permitir instrução curta opcional;
- reutilizar o questionário salvo quando o body enviar `questionario` vazio;
- retornar erro claro quando não houver questionário salvo;
- manter o feedback anterior na tela enquanto a chamada ocorre;
- substituir a versão exibida apenas após sucesso.

Critério de aceite:

- uma nova chamada gera outro `feedback_aluno`; ausência de questionário salvo produz erro claro e qualquer falha preserva a versão anterior.

### Etapa 9 — Teste ponta a ponta do MVP

Executar:

- resposta correta;
- resposta incorreta;
- correção da resposta extraída que muda o resultado;
- baixa confiança;
- erro do n8n;
- resposta inválida do Gemini;
- regeneração;
- aprovação do texto original e do texto editado;
- reinício do processo;
- confirmação de que o fluxo atual não foi removido.

Critério de aceite:

- um professor conclui o novo fluxo nos dois caminhos, corrige os dados, recebe feedback contextualizado, edita ou aprova o texto e solicita uma nova versão.

## 9. Riscos principais do MVP

- **Divergência de comparação:** o n8n ainda pode recalcular o resultado e divergir do backend. Mitigação: enviar e usar somente a avaliação oficial do backend.
- **Perda de estado:** o `Map` perde os dados ao reiniciar o backend e a página perde o estado local ao ser atualizada. Aceitar e comunicar essa limitação durante a validação.
- **Contrato do questionário mudar durante a implementação:** validar previamente nomes, opções e campos obrigatórios com a equipe pedagógica.
- **`App.jsx` crescer demais:** extrair apenas os três blocos maiores se a alteração ficar difícil de testar; não iniciar uma refatoração geral.
- **Resposta inválida do Gemini:** validar `feedback_aluno` e manter erro explícito, sem tratar texto vazio como sucesso.
- **Regeneração apagar feedback válido:** conservar a versão anterior até a nova chamada terminar com sucesso.
- **Workflow atual ser afetado:** editar uma cópia ou manter backup e não remover o fluxo atual antes do teste ponta a ponta.
- **Google Sheets bloquear o webhook:** confirmar se os nós atuais estão no caminho crítico; durante o MVP, uma falha de log não deve invalidar um feedback já gerado.
- **Extração real não estar ativa no export:** confirmar se o workflow em uso está no caminho Gemini ou mock antes da validação com professores.
- **Campo binário divergente (`image`/`image0`):** confirmar o nome usado pelo workflow ativo para evitar falha na extração.

## Resumo da decisão de escopo

O MVP adiciona somente as rotas mínimas de confirmação da extração e aprovação simples, adapta a rota atual de feedback, mantém a persistência em memória e modifica apenas o workflow de feedback necessário. Não cria API v2, banco, feature flag, autenticação, auditoria complexa ou histórico completo. O sucesso será medido pela capacidade de validar o novo fluxo pedagógico completo com professores, não pela prontidão para produção.

## Próximo passo recomendado

A primeira implementação deve começar por:

1. criar a rota `PATCH /api/submissions/:id/extraction`;
2. adaptar o `submissionStore.js` para guardar extração original, extração revisada e avaliação oficial;
3. garantir que `evaluationService.js` seja a única fonte da comparação;
4. adicionar testes mínimos para confirmação da extração revisada;
5. depois disso, adaptar a geração de feedback para considerar apenas `feedback_aluno` como campo obrigatório no MVP.
