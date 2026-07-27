# Plano de Ação — Novo Fluxo STI

> Documento de planejamento. Nenhuma mudança de frontend, backend, workflow, prompt, credencial ou configuração é realizada nesta etapa.
>
> Este plano está em `pibit-n8n/docs/novo-fluxo/` porque essa é a pasta que já concentra a arquitetura, os contratos de API, a segurança, a LGPD e o deploy da aplicação executável. Os documentos de origem do novo fluxo estão junto, em `novo-fluxo-usuario.md` e `novo-fluxo-interno.md`.

## 1. Resumo executivo

O novo fluxo transforma o MVP atual, que hoje executa submissão, extração e geração imediata de feedback, em um processo revisável e rastreável controlado pelo professor:

1. envio da imagem e da resposta correta;
2. revisão e correção dos dados extraídos;
3. classificação da resposta;
4. preenchimento de questionário pedagógico condicional;
5. geração de feedback contextualizado;
6. edição, regeneração e aprovação final;
7. registro das versões e decisões tomadas.

Parte da base já existe: upload, consentimento, preview da imagem, resposta correta, integração backend–n8n, extração, comparação simples, geração de feedback e logs parciais em Google Sheets. As maiores mudanças serão a separação explícita das etapas, a edição da extração, os contratos versionados, o questionário, a persistência, a regeneração e a aprovação final.

A estratégia recomendada é incremental: preservar as rotas atuais durante a transição, introduzir contratos `v2` ou novos endpoints, persistir o estado no backend e somente então ativar os novos workflows.

## 2. Estado atual identificado no repositório

### 2.1 Frontend

Tecnologia: React com Vite.

Arquivos principais:

- `apps/frontend/src/App.jsx`: concentra toda a interface, estado, chamadas HTTP e transições do fluxo.
- `apps/frontend/src/styles.css`: estilos de formulário, preview, estados de carregamento, erro e resultados.
- `apps/frontend/src/main.jsx`: inicialização da aplicação.

Fluxo atual em `App.jsx`:

1. tela inicial;
2. leitura e aceite do termo LGPD;
3. formulário com imagem e `correctAnswer`;
4. preview local via `URL.createObjectURL`;
5. `POST /api/submissions/extract`;
6. exibição não editável da extração;
7. comparação preliminar exibida como correta/incorreta;
8. `POST /api/submissions/:id/feedback`, sem body;
9. exibição não editável de `feedback_aluno` e `dica_proxima_acao`;
10. reinício integral do processo.

Estados atuais:

- `view`: `inicio`, `consentimento_lgpd`, `formulario_submissao`, `extraindo_imagem`, `extracao_concluida`, `gerando_feedback`, `feedback_concluido` ou `erro`;
- `form.correctAnswer`;
- `form.image`;
- `consentAccepted`;
- `consentScrolledToEnd`;
- `submission`;
- `feedback`;
- `error`.

Compatibilidades já existentes:

- uma imagem por submissão;
- campo separado de resposta correta;
- preview antes do envio;
- imagem e resposta correta mantidas visíveis durante o fluxo enquanto o arquivo permanece no estado local;
- loading e mensagens de erro;
- reinício;
- consumo exclusivo do backend, sem acesso direto ao n8n.

Lacunas:

- não há confirmação explícita separada do formulário, embora o preview já permita revisão;
- campos extraídos são somente leitura;
- `confianca_extracao` é recebida, mas não é exibida;
- não há bloqueio ou alerta por baixa confiança/legibilidade;
- não há questionário;
- não há edição de feedback;
- não há aprovação, regeneração ou histórico;
- toda a aplicação está em um único componente, o que aumentará o risco de regressão ao adicionar novas etapas.

### 2.2 Backend

Tecnologia: Node.js, Express, Multer, Zod e Axios.

Arquivos principais:

- `apps/backend/src/app.js`: middlewares, CORS, JSON de 1 MB e montagem das rotas em `/api`.
- `apps/backend/src/routes/submissions.js`: rotas de extração e feedback.
- `apps/backend/src/services/submissionService.js`: orquestra extração, comparação, feedback e normalização.
- `apps/backend/src/services/evaluationService.js`: normalização e comparação exata.
- `apps/backend/src/services/submissionStore.js`: armazenamento em um `Map` em memória.
- `apps/backend/src/services/n8nClient.js`: chamadas HTTP aos dois webhooks.
- `apps/backend/src/middleware/errorHandler.js`: erros de upload, timeout e comunicação com n8n.
- `apps/backend/src/config/env.js`: validação das variáveis de ambiente.
- `apps/backend/tests/evaluationService.test.js`: testes unitários básicos de comparação e normalização do feedback.

Rotas atuais:

- `POST /api/submissions/extract`
  - recebe `multipart/form-data`;
  - valida imagem, `correctAnswer` e `consentAccepted`;
  - gera `submission_id`;
  - chama o workflow de extração;
  - calcula `avaliacao_preliminar`;
  - salva a submissão em memória.
- `POST /api/submissions/:id/feedback`
  - não recebe body;
  - recupera os dados em memória;
  - envia `submission_id`, `correct_answer` e `extracao` ao n8n;
  - salva a avaliação retornada em memória.

Comparação atual:

- `evaluationService.normalizeAnswer()` remove espaços externos e compacta espaços internos;
- `evaluateAnswer()` usa igualdade textual exata;
- não trata vírgula decimal, unidade, expressão equivalente, fração equivalente, múltiplas formas válidas ou resposta parcialmente correta.

### 2.3 Integração com n8n

Configurações:

- `N8N_EXTRACTION_WEBHOOK_URL`;
- `N8N_FEEDBACK_WEBHOOK_URL`;
- `N8N_EXTRACTION_FILE_FIELD`, padrão `image`;
- `N8N_TIMEOUT_MS`, padrão 120 segundos.

O backend envia:

- extração em `multipart/form-data`;
- feedback em JSON.

Os exports versionados são:

- `n8n/workflows/Extração - STI.json`;
- `n8n/workflows/Feedback.json`.

Documentação associada:

- `n8n/docs/workflow-extracao.md`;
- `n8n/docs/workflow-feedback.md`.

### 2.4 Integração com Gemini

Extração:

- nó `Gemini Analisa Imagem`;
- modelo configurado no export: `models/gemini-2.5-flash`;
- prompt exige JSON com `enunciado`, `desenvolvimento_aluno`, `resposta_aluno`, `legibilidade`, `confianca_extracao` e `observacoes`;
- nó `Code - Limpar Resposta Gemini` remove markdown, tenta localizar JSON e produz fallback de erro de parse.

Feedback:

- nó `Gerar feedback Gemini`;
- modelo configurado no export: `models/gemini-2.0-flash-lite`;
- nó `Preparar dados` escolhe prompt de resposta correta ou incorreta;
- nó `Tratar resposta da IA` tenta extrair JSON e gera fallback.

Pontos de atenção identificados nos exports:

- em `Extração - STI.json`, `IF - Usar Mock?` está com condição fixa verdadeira e encaminha para `Code - Mock Extração`; assim, o caminho Gemini não é usado no export atual;
- o webhook declara binário `image`, o backend usa por padrão `image`, mas o nó Gemini lê `image0`;
- o nó `If` de validação da extração contém uma terceira condição vazia e deve ser revisto;
- o campo `modelo` registrado pelos nós de código é genericamente `gemini`, não o identificador real;
- o workflow de feedback compara respostas novamente com uma normalização diferente da usada no backend;
- o cálculo de `ok` do feedback exige `feedback_professor` não vazio, podendo marcar como erro uma resposta válida em que esse campo venha vazio;
- o parser possui fallback útil, mas ainda não valida integralmente enumerações, limites de confiança e coerência entre `acertou` e `status_avaliacao`.

### 2.5 Estrutura atual de payloads

Os contratos correntes estão documentados em `docs/contratos-api.md` e validados parcialmente por Zod em `submissionService.js`.

Extração:

- frontend → backend: `correctAnswer`, `consentAccepted`, `image`;
- backend → n8n: `submissionId`, `correctAnswer`, `consentAccepted`, binário;
- retorno: metadados do workflow e objeto `extracao`;
- backend → frontend: extração normalizada e `avaliacao_preliminar`.

Feedback:

- frontend → backend: somente ID na URL;
- backend → n8n: `submission_id`, `correct_answer`, `extracao`;
- retorno: objeto `avaliacao` com feedbacks e classificação.

O arquivo raiz `contratos_de_dados.json` contém exemplos históricos em formato JavaScript, não JSON válido, e não representa integralmente o contrato executado hoje. Deve ser tratado como artefato conceitual e posteriormente substituído ou identificado como legado.

### 2.6 Armazenamento e logs

Backend:

- `submissionStore.js` usa `Map`;
- dados são perdidos ao reiniciar o processo;
- imagem não é persistida;
- não há histórico de correções, questionário, versões ou aprovação.

n8n:

- extrações são encaminhadas à aba `extracoes` da planilha `logs_sti`;
- feedbacks são encaminhados à aba `feedback`;
- o workflow de extração possui mapeamento explícito de colunas;
- o nó Google Sheets do feedback apresenta `value: {}` no export, portanto o mapeamento efetivo precisa ser confirmado;
- os nós Google Sheets estão no caminho síncrono antes de `Respond to Webhook`; falha de planilha pode impedir a resposta ao backend;
- o feedback registra `raw_ai_response` e `resposta_backend_json`;
- não há registro estruturado de correções do professor, questionário, regenerações e versão aprovada.

### 2.7 Pontos já compatíveis com o novo fluxo

- consentimento antes da submissão;
- upload único de imagem;
- resposta correta separada;
- preview da imagem;
- backend como fronteira de integração;
- IDs de submissão;
- dois workflows separados;
- extração dos seis campos requeridos;
- comparação preliminar;
- prompts separados para acerto e erro;
- retorno estruturado;
- tratamento parcial de JSON inválido;
- loading, timeout e erros amigáveis;
- logs parciais em Sheets.

### 2.8 Pontos que precisarão ser modificados

- máquina de estados e componentes do frontend;
- contratos de API e validações Zod;
- persistência;
- atualização dos dados extraídos;
- questionário condicional;
- geração com contexto pedagógico;
- edição e versionamento do feedback;
- aprovação final;
- regeneração;
- política de comparação;
- workflows e prompts;
- logs, privacidade e retenção;
- testes unitários, integração e ponta a ponta.

## 3. Diferenças entre fluxo atual e novo fluxo

| Área | Hoje | Novo fluxo | Impacto técnico | Complexidade |
|---|---|---|---|---|
| Submissão | Imagem, resposta correta e consentimento | Mesmos dados, com revisão/confirmacão explícita e metadados | Ajustar UX e contrato versionado | Baixa |
| Extração | Resultado somente leitura | Resultado editável e confirmável | Estado de rascunho, validação e endpoint de atualização | Média |
| Confiança | Recebida, não exibida | Exibida e usada para alertas | UI, regras e critérios de bloqueio | Baixa |
| Comparação | Igualdade textual simples | Resultado confiável, recalculado após edição | Política única no backend e casos ambíguos | Média/alta |
| Questionário | Inexistente | Condicional para correto/incorreto | Novos formulários, esquema e persistência | Alta |
| Feedback | Gerado imediatamente pelo ID | Gerado com extração revisada e contexto pedagógico | Novo payload e prompt | Alta |
| Revisão final | Somente leitura | Editar, aprovar ou regenerar | Versionamento, endpoints e auditoria | Alta |
| Persistência | `Map` em memória | Processo recuperável e rastreável | Banco/repositório persistente | Alta |
| Logs | Sheets parcial | Eventos e versões completos | Novo modelo de auditoria e LGPD | Alta |
| Compatibilidade | Rotas simples atuais | Migração gradual | Versionar contratos e manter rota legada | Média |

## 4. Mudanças necessárias no frontend

### 4.1 Estrutura recomendada

Manter `App.jsx` como orquestrador inicialmente, mas extrair componentes antes ou durante a Fase 2:

- `components/SubmissionForm.jsx`;
- `components/SubmissionReview.jsx`;
- `components/ExtractionReview.jsx`;
- `components/PedagogicalQuestionnaire.jsx`;
- `components/CorrectAnswerQuestionnaire.jsx`;
- `components/IncorrectAnswerQuestionnaire.jsx`;
- `components/FeedbackReview.jsx`;
- `components/StepIndicator.jsx`;
- `services/api.js`;
- `state/flowReducer.js` ou hook `hooks/useSubmissionFlow.js`.

Arquivos prováveis a alterar:

- `apps/frontend/src/App.jsx`;
- `apps/frontend/src/styles.css`;
- novos arquivos sob `apps/frontend/src/components`, `services`, `hooks` ou `state`;
- possivelmente `apps/frontend/package.json` apenas se for adotada biblioteca de formulário/esquema. Não é obrigatória.

### 4.2 Máquina de estados sugerida

Substituir strings dispersas por estados explícitos:

- `consent`;
- `submission_editing`;
- `submission_review`;
- `extracting`;
- `extraction_review`;
- `questionnaire_correct`;
- `questionnaire_incorrect`;
- `generating_feedback`;
- `feedback_review`;
- `regenerating_feedback`;
- `approving`;
- `completed`;
- `error`.

Estados de dados:

- `submissionDraft`: imagem, preview, resposta correta e metadados;
- `submissionId`;
- `extractionOriginal`;
- `extractionDraft`;
- `evaluation`;
- `questionnaire`;
- `feedbackVersions`;
- `activeFeedbackVersion`;
- `feedbackDraft`;
- `finalApproval`;
- `operationError`;
- flags de loading por ação.

### 4.3 Submissão e revisão

Mudanças:

- manter imagem e resposta correta obrigatórias;
- criar ação “Revisar dados” antes de “Submeter para extração”;
- exibir nome, tipo e tamanho do arquivo;
- validar limite e MIME antes da chamada;
- manter imagem e resposta correta visíveis até a conclusão;
- avisar que a imagem deve conter um único problema e evitar dados pessoais.

Impacto para o professor:

- um passo adicional reduz submissões acidentais;
- deve existir “Voltar e editar” sem perder os dados;
- o botão final deve deixar claro que inicia processamento externo.

### 4.4 Revisão da extração

Substituir `Field` somente leitura por campos controlados:

- `textarea` para `enunciado`;
- `textarea` para `desenvolvimento_aluno`;
- `input` para `resposta_aluno`;
- legibilidade e observações visíveis, inicialmente somente leitura;
- confiança como percentual e indicador visual;
- selo `correta`, `incorreta`, `parcial` ou `a revisar`.

Ao editar `resposta_aluno`, o frontend pode exibir uma prévia local, mas o resultado oficial deve vir do backend. A ação “Confirmar dados e continuar” deve persistir a revisão antes de abrir o questionário.

Registrar no estado:

- valor original;
- valor revisado;
- campos alterados;
- data da revisão.

### 4.5 Baixa confiança e reinício

Regras sugeridas:

- confiança abaixo do limiar configurado: alerta;
- legibilidade `baixa`: solicitar revisão cuidadosa;
- resposta vazia: impedir continuação até edição ou reinício;
- extração ruim: “Enviar outra imagem”, com confirmação para descartar o rascunho.

O limiar deve vir do backend/configuração ou ser documentado; sugestão inicial: alerta abaixo de `0.70`, sem bloqueio automático. A decisão é “a confirmar”.

### 4.6 Questionário pedagógico

Renderizar o formulário com base no `evaluation.status`, nunca apenas em uma comparação local.

Campos comuns:

- quando o conteúdo foi trabalhado;
- estratégias usadas em aula;
- reação ao erro;
- relação com matemática;
- receptividade ao feedback;
- intenção/observação aberta.

Campos de acerto:

- se o acerto era esperado.

Campos de erro:

- desempenho geral;
- frequência do erro;
- natureza percebida do erro.

Decisões de formulário:

- definir se “como foi trabalhado” aceita uma ou várias opções; pelo texto atual, múltipla seleção parece adequada, mas está “a confirmar”;
- definir limites do campo aberto;
- exigir todas as perguntas fechadas ou permitir “não sei/não se aplica”;
- preservar respostas ao navegar para trás.

### 4.7 Feedback gerado e finalização

Exibir:

- feedback para o aluno em `textarea` editável;
- feedback para o professor;
- dica/próxima ação;
- confiança;
- alerta de fallback/parse;
- número da versão e data.

Ações:

- “Aprovar” quando não houve edição;
- “Salvar edição e aprovar” quando o texto mudou;
- “Pedir nova versão” com motivo opcional;
- alternar entre versões anteriores;
- nunca substituir silenciosamente o feedback original.

Enquanto aprova ou regenera, bloquear somente a ação em curso e impedir cliques duplicados.

### 4.8 Tratamento de loading, erro e retomada

Cada etapa deve distinguir:

- erro de validação;
- timeout;
- n8n indisponível;
- resposta inválida da IA;
- submissão não encontrada;
- conflito de versão;
- falha de persistência;
- baixa confiança sem erro técnico.

Se houver persistência, recarregar o processo por `submission_id`. Se a primeira versão continuar em memória, informar claramente que atualizar a página perde o processo.

## 5. Mudanças necessárias no backend

### 5.1 Estratégia de compatibilidade

Manter temporariamente:

- `POST /api/submissions/extract`;
- `POST /api/submissions/:id/feedback`.

Introduzir endpoints novos ou uma versão `/api/v2`. Recomendação:

- manter a extração atual como fachada;
- adicionar operações explícitas de revisão, questionário, geração, regeneração e aprovação;
- descontinuar a rota antiga de feedback somente após o frontend novo estar estável.

### 5.2 Endpoints sugeridos

| Método e rota | Finalidade |
|---|---|
| `POST /api/v2/submissions` | Criar submissão e executar extração |
| `GET /api/v2/submissions/:id` | Recuperar estado completo permitido |
| `PATCH /api/v2/submissions/:id/extraction` | Salvar correções e recalcular avaliação |
| `PUT /api/v2/submissions/:id/questionnaire` | Validar e salvar questionário |
| `POST /api/v2/submissions/:id/feedback-versions` | Gerar primeira versão |
| `POST /api/v2/submissions/:id/feedback-versions/:version/regenerate` | Gerar nova versão |
| `POST /api/v2/submissions/:id/approval` | Aprovar texto original ou editado |

Alternativa: adaptar as rotas existentes sem `/v2`, porém isso aumenta o risco de clientes antigos enviarem/receberem contratos incompatíveis.

### 5.3 Services e responsabilidades

Arquivos a adaptar:

- `routes/submissions.js`;
- `services/submissionService.js`;
- `services/evaluationService.js`;
- `services/submissionStore.js`;
- `services/n8nClient.js`;
- `middleware/errorHandler.js`;
- `config/env.js`;
- testes.

Novos módulos recomendados:

- `services/questionnaireService.js`;
- `services/feedbackService.js`;
- `services/approvalService.js`;
- `repositories/submissionRepository.js`;
- `schemas/submissionSchemas.js`;
- `schemas/questionnaireSchemas.js`;
- `schemas/feedbackSchemas.js`.

Separar a normalização de respostas n8n dos casos de uso para reduzir o tamanho de `submissionService.js`.

### 5.4 Contratos e validações

Validar com Zod:

- UUID/ID e versão do contrato;
- MIME e tamanho do arquivo;
- consentimento;
- resposta correta não vazia;
- enumerações;
- confiança entre 0 e 1;
- campos extraídos revisados;
- questionário correspondente ao resultado;
- tamanho dos textos;
- existência e estado da submissão;
- versão de feedback;
- transição de status permitida;
- aprovação idempotente.

Regras de transição sugeridas:

- só revisar após extração;
- só salvar questionário após revisão da extração;
- só gerar feedback com questionário válido;
- só regenerar após existir versão anterior;
- só aprovar versão existente;
- após aprovação, novas alterações exigem reabertura explícita, se essa capacidade for desejada.

### 5.5 Comparação oficial

Centralizar no backend e enviar o resultado ao n8n. O frontend apenas apresenta uma prévia.

Evolução incremental:

1. igualdade textual normalizada, preservando compatibilidade;
2. normalização numérica segura para decimal e unidade;
3. status `parcial`/`indefinida`, com decisão do professor;
4. opcionalmente, equivalência matemática assistida, nunca como única decisão automática.

O n8n não deve recalcular com algoritmo diferente. Deve consumir:

```json
{
  "status": "correct",
  "method": "normalized_exact_match_v1",
  "teacher_override": false
}
```

### 5.6 Persistência

`submissionStore.js` deve virar interface/repositório. Para além de demonstração local, usar banco persistente.

Entidades mínimas:

- `submissions`;
- `extractions`;
- `extraction_revisions`;
- `questionnaire_answers`;
- `feedback_versions`;
- `approvals`;
- `integration_events` ou `audit_events`.

Banco recomendado para implantação simples: PostgreSQL. SQLite pode servir para protótipo local, mas não para concorrência e operação distribuída. A escolha final está “a confirmar”.

### 5.7 Tratamento de erro

Adicionar códigos:

- `invalid_state_transition`;
- `invalid_extraction_revision`;
- `questionnaire_mismatch`;
- `questionnaire_incomplete`;
- `feedback_version_not_found`;
- `feedback_generation_failed`;
- `feedback_already_approved`;
- `approval_conflict`;
- `persistence_error`.

Não retornar resposta bruta da IA ao frontend por padrão. Guardá-la em log protegido e retornar um identificador de correlação.

### 5.8 Risco de quebra do fluxo atual

Riscos principais:

- mudar o body da rota de feedback;
- substituir o `Map` antes de implementar um repositório compatível;
- alterar nomes `correctAnswer`/`correct_answer`;
- unificar a comparação e mudar resultados existentes;
- tornar novos campos obrigatórios antes do frontend estar publicado.

Mitigação:

- contratos versionados;
- campos novos inicialmente opcionais apenas na rota legada;
- testes de contrato;
- feature flag para novo fluxo;
- dupla leitura dos nomes durante período curto e controlado;
- migração do frontend e backend coordenada.

## 6. Mudanças necessárias no n8n

### 6.1 Fluxo de extração

No workflow `Extração - STI`:

- remover/desativar o desvio fixo para mock apenas quando o ambiente real estiver validado;
- transformar mock em configuração explícita de ambiente/teste;
- alinhar `image`, `image0` e `N8N_EXTRACTION_FILE_FIELD`;
- corrigir a validação do nó `If`;
- validar `consentAccepted`, `submissionId` e resposta correta;
- registrar o identificador real do modelo;
- validar o schema e os limites de confiança;
- retornar erro estruturado sem exigir resposta do Gemini válida;
- considerar logs assíncronos ou rota de erro para Sheets.

### 6.2 Fluxo de feedback

No workflow `Feedback`:

- receber contrato consolidado e versionado;
- parar de recalcular a correção com regra própria;
- usar `evaluation.status` vindo do backend;
- incluir questionário, intenção do professor e metadados de versão;
- escolher prompt correto/incorreto/parcial/indefinido;
- aceitar `previous_feedback` e `regeneration_reason`;
- devolver `feedback_version`, `prompt_version`, modelo real e correlação;
- revisar a regra de `ok`;
- validar todos os campos do JSON retornado;
- preservar resposta bruta somente em log protegido.

### 6.3 Webhooks e versionamento

Recomendação segura:

- duplicar workflows como `Extração - STI v2` e `Feedback STI v2`;
- usar paths como `/v2/extracao` e `/v2/feedback-sti`;
- manter os workflows atuais durante homologação;
- publicar novas URLs em variáveis separadas;
- somente migrar as variáveis padrão após testes.

### 6.4 Preparação de dados

O nó `Preparar dados` deverá organizar:

- `contract_version`;
- submissão e extração revisada;
- avaliação oficial;
- questionário comum e específico;
- intenção do professor;
- número da versão;
- feedback anterior;
- motivo da regeneração;
- política de linguagem/idade.

Evitar interpolar dados sem delimitadores claros. Montar contexto JSON e instruções separadas reduz ambiguidades e risco de o conteúdo do usuário ser interpretado como instrução.

### 6.5 Tratamento da resposta

O nó equivalente a `Tratar resposta da IA` deverá:

- remover cercas de markdown;
- parsear JSON;
- validar campos, tipos, enums e limites;
- conferir coerência com o resultado oficial;
- aplicar fallback explícito sem apresentá-lo como feedback plenamente personalizado;
- incluir `parse_ok`, `validation_ok`, `warnings` e `error_code`;
- não considerar `feedback_professor` obrigatório se o contrato assim não definir.

### 6.6 Logs

Registrar:

- IDs de submissão, execução e correlação;
- versão de contrato, workflow e prompt;
- provedor/modelo;
- duração;
- status de parse/validação;
- hash ou referência do contexto, evitando duplicar dados sensíveis;
- versão gerada;
- erro técnico sanitizado.

Google Sheets não deve impedir a resposta ao backend. Opções:

- `continueOnFail` com registro de alerta;
- branch paralela;
- persistência principal no backend e Sheets apenas para exportação de pesquisa.

### 6.7 Novo workflow ou versão do atual

Versionar é preferível a editar o workflow em produção. A mudança de contrato e contexto é grande o suficiente para justificar `v2`, mantendo rollback simples.

## 7. Mudanças necessárias nos prompts do Gemini

### 7.1 Princípios comuns

Os prompts devem:

- declarar o papel pedagógico e a faixa escolar;
- distinguir dados do sistema de dados fornecidos pelo professor;
- tratar a avaliação do backend como fonte oficial;
- proibir invenção de características do aluno;
- usar o perfil emocional para ajustar tom, não para diagnosticar;
- respeitar a intenção do professor sem produzir conteúdo humilhante ou punitivo;
- retornar somente JSON;
- indicar incerteza quando extração ou contexto forem insuficientes.

### 7.2 Caso correto

Orientar o modelo a:

- reconhecer o acerto;
- destacar estratégia/raciocínio observável;
- evitar elogio genérico excessivo;
- adequar o tom ao perfil informado;
- sugerir consolidação ou desafio seguinte;
- sinalizar ao professor desenvolvimento incompleto, sem transformar acerto em punição.

### 7.3 Caso incorreto

Orientar o modelo a:

- reconhecer a tentativa;
- usar a natureza do erro indicada pelo professor como hipótese, não verdade absoluta;
- explicar uma pista, sem necessariamente entregar toda a solução;
- oferecer próxima ação concreta;
- adaptar tom a frustração, ansiedade ou resistência;
- evitar rótulos de capacidade.

### 7.4 Caso parcial ou indefinido

Adicionar prompt específico ou regra explícita:

- `partial`: reconhecer partes corretas e indicar o ponto de revisão;
- `needs_review`: não afirmar acerto/erro, pedir verificação ao professor;
- baixa confiança: reduzir afirmações categóricas.

### 7.5 Formato JSON recomendado

```json
{
  "status": "success",
  "evaluation_status": "correct",
  "feedback_student": "string",
  "feedback_teacher": "string",
  "next_action": "string",
  "error_hypothesis": null,
  "tone_strategy": "encouraging",
  "confidence": 0.92,
  "warnings": []
}
```

Campos que devem continuar:

- feedback do aluno;
- feedback do professor;
- próxima ação;
- confiança;
- status/tipo de erro quando aplicável.

Novos campos recomendados:

- `evaluation_status`;
- `error_hypothesis`;
- `tone_strategy`;
- `warnings`;
- `prompt_version`.

### 7.6 Redução de respostas inválidas

- usar saída estruturada/schema quando o nó e o modelo suportarem;
- temperatura baixa;
- enums fechados;
- exemplo válido curto;
- instrução “sem markdown”;
- validação posterior;
- uma tentativa de reparo controlada;
- fallback explícito;
- testes de prompt com casos corretos, incorretos, vazios, ambíguos e baixa confiança.

## 8. Estrutura de dados e contratos sugeridos

Todos os contratos devem incluir `contract_version`, por exemplo `2.0`.

### 8.1 Submissão inicial

Transporte recomendado: `multipart/form-data`, com `metadata` em JSON e imagem binária.

```json
{
  "contract_version": "2.0",
  "correct_answer": "25",
  "consent": {
    "accepted": true,
    "term_version": "2026-01"
  },
  "metadata": {
    "teacher_id": "prof_anon_01",
    "locale": "pt-BR",
    "client_timestamp": "2026-06-23T14:00:00-03:00"
  },
  "image": "<binary>"
}
```

`teacher_id` deve ser pseudônimo e é “a confirmar”, pois não existe autenticação no MVP.

### 8.2 Retorno da extração

```json
{
  "ok": true,
  "contract_version": "2.0",
  "submission_id": "sub_001",
  "status": "extraction_review_required",
  "extraction": {
    "statement": "Em uma festa...",
    "student_work": "70 - 45 = 15",
    "student_answer": "15",
    "legibility": "high",
    "confidence": 0.91,
    "notes": ""
  },
  "evaluation": {
    "status": "incorrect",
    "method": "normalized_exact_match_v1",
    "teacher_override": false,
    "correct_answer_normalized": "25",
    "student_answer_normalized": "15"
  },
  "warnings": []
}
```

### 8.3 Questionário pedagógico

```json
{
  "contract_version": "2.0",
  "evaluation_status": "incorrect",
  "common": {
    "content_timing": "recent",
    "teaching_strategies": ["direct_instruction", "group_problem_solving"],
    "reaction_to_error": "wants_to_understand",
    "relationship_with_math": "neutral",
    "feedback_receptivity": "depends_on_delivery"
  },
  "correct_case": null,
  "incorrect_case": {
    "general_performance": "average",
    "error_frequency": "sometimes",
    "perceived_error_type": "calculation"
  },
  "teacher_intention": "Valorizar a estratégia antes de apontar o cálculo.",
  "answered_at": "2026-06-23T17:05:00Z"
}
```

Para caso correto:

```json
{
  "correct_case": {
    "success_expectation": "expected_but_usually_struggles"
  },
  "incorrect_case": null
}
```

### 8.4 Solicitação de geração de feedback

```json
{
  "contract_version": "2.0",
  "submission_id": "sub_001",
  "feedback_version": 1,
  "correct_answer": "25",
  "reviewed_extraction": {
    "statement": "Em uma festa...",
    "student_work": "70 - 45 = 15",
    "student_answer": "15",
    "legibility": "high",
    "confidence": 0.91,
    "notes": ""
  },
  "evaluation": {
    "status": "incorrect",
    "method": "normalized_exact_match_v1",
    "teacher_override": false
  },
  "questionnaire": {
    "common": {},
    "incorrect_case": {},
    "teacher_intention": "Valorizar a estratégia."
  },
  "regeneration": {
    "is_regeneration": false,
    "previous_version": null,
    "reason": null
  }
}
```

### 8.5 Retorno do feedback

```json
{
  "ok": true,
  "contract_version": "2.0",
  "submission_id": "sub_001",
  "feedback_version": 1,
  "status": "feedback_review_required",
  "feedback": {
    "student": "Você escolheu a operação certa...",
    "teacher": "O procedimento indica compreensão...",
    "next_action": "Retomar o cálculo com material concreto.",
    "error_hypothesis": "calculation",
    "confidence": 0.9
  },
  "ai": {
    "provider": "gemini",
    "model": "models/<modelo>",
    "prompt_version": "feedback-v2.0"
  },
  "warnings": [],
  "error": null
}
```

Em erro:

```json
{
  "ok": false,
  "status": "feedback_generation_failed",
  "error": {
    "code": "invalid_ai_response",
    "message": "Não foi possível validar a resposta da IA.",
    "correlation_id": "corr_001"
  }
}
```

### 8.6 Aprovação final

```json
{
  "contract_version": "2.0",
  "submission_id": "sub_001",
  "approved_feedback_version": 2,
  "original_feedback": "Texto gerado pelo modelo.",
  "final_feedback": "Texto revisado pelo professor.",
  "was_edited": true,
  "final_status": "approved",
  "approved_by": "prof_anon_01",
  "approved_at": "2026-06-23T17:15:00Z",
  "metadata": {
    "edit_distance": 34,
    "approval_source": "web"
  }
}
```

## 9. Armazenamento e logs

### 9.1 Dados a persistir

- submissão e versão do consentimento;
- referência segura da imagem ou hash, conforme política aprovada;
- extração original;
- extração corrigida;
- diff/campos alterados;
- resposta correta;
- avaliação e método;
- override do professor;
- questionário;
- intenção do professor;
- versão de workflow, prompt e modelo;
- resposta bruta da IA em armazenamento restrito, se aprovada pela política de pesquisa;
- cada feedback gerado;
- feedback final editado;
- aprovação;
- status e timestamps;
- erros e IDs de correlação.

### 9.2 Google Sheets

A estrutura atual não é suficiente como persistência principal porque:

- não garante transações;
- não modela versões e relacionamentos com segurança;
- o mapeamento do feedback está “a confirmar”;
- está no caminho crítico;
- possui controles limitados de acesso, retenção e auditoria;
- pode expor textos sensíveis a mais pessoas do que o necessário.

Recomendação:

- banco do backend como fonte oficial;
- Sheets como exportação pseudonimizada para pesquisa;
- job assíncrono/reprocessável para exportação;
- política de colunas, acesso e retenção;
- nunca salvar credenciais ou dados identificáveis de aluno.

### 9.3 Prompt e resposta bruta

Salvar prompt completo somente se necessário ao protocolo de pesquisa e com acesso restrito. Alternativa preferível:

- versão do prompt;
- hash do template;
- contexto estruturado;
- resposta bruta criptografada ou com retenção curta.

Essa decisão exige validação de LGPD e do protocolo de pesquisa.

## 10. Plano de implementação por fases

### Fase 1 — Mapeamento e preparação

Objetivo: criar fundações sem alterar o comportamento atual.

Arquivos prováveis:

- `docs/contratos-api.md`;
- novos schemas no backend;
- testes;
- configuração de feature flag;
- cópias versionadas dos workflows, sem ativação.

Tarefas:

1. aprovar contratos `v2`, enums e estados;
2. definir política de comparação;
3. definir persistência e LGPD;
4. criar testes de caracterização das rotas atuais;
5. registrar os problemas atuais dos workflows;
6. definir estratégia de IDs, autenticação/pseudônimo e retenção.

Critérios de aceite:

- contrato revisado por frontend, backend e responsável pedagógico;
- testes atuais verdes;
- fluxo legado inalterado;
- decisões pendentes registradas.

Riscos: iniciar UI antes de estabilizar enums e contratos.

Ordem: contratos → estados → persistência → workflows v2 → UI.

### Fase 2 — Submissão e extração

Objetivo: revisar, editar e confirmar a extração.

Arquivos prováveis:

- `App.jsx`, `styles.css`, novos componentes;
- `routes/submissions.js`;
- `submissionService.js`;
- `evaluationService.js`;
- repositório;
- workflow de extração v2.

Tarefas:

1. criar etapa de confirmação;
2. estabilizar extração real e binário;
3. exibir confiança;
4. adicionar edição;
5. persistir revisão;
6. recalcular avaliação no backend;
7. tratar baixa confiança.

Critérios:

- professor envia e revisa;
- Gemini real ou mock explicitamente configurado;
- extração original e revisada preservadas;
- resultado recalculado;
- reinício seguro.

Riscos: divergência entre avaliação local, backend e n8n.

Ordem: backend/repositório → workflow → contrato → frontend.

### Fase 3 — Questionário pedagógico

Objetivo: coletar contexto condicional validado.

Arquivos prováveis:

- componentes de questionário;
- schemas e `questionnaireService.js`;
- rota de questionário;
- repositório e migrações.

Tarefas:

1. aprovar opções e cardinalidade;
2. criar formulário comum e específico;
3. preservar rascunho;
4. validar correspondência com resultado;
5. persistir respostas.

Critérios:

- questionário correto aparece;
- dados não somem ao voltar;
- payload inválido é rejeitado;
- questionário salvo pode ser recuperado.

Riscos: opções pedagógicas mudarem após implementação.

Ordem: validação pedagógica → schema → backend → frontend.

### Fase 4 — Geração de feedback contextualizado

Objetivo: gerar feedback usando o contexto completo.

Arquivos prováveis:

- `feedbackService.js`;
- `n8nClient.js`;
- schemas;
- `Feedback STI v2`;
- documentação de prompt.

Tarefas:

1. montar payload consolidado;
2. implementar prompt versionado;
3. validar saída estruturada;
4. persistir versão;
5. tratar fallback e erro;
6. retirar Sheets do caminho crítico.

Critérios:

- n8n recebe todos os campos;
- prompt correto é selecionado;
- retorno inválido não é tratado como sucesso silencioso;
- versão e modelo são registrados.

Riscos: prompt longo, resposta inconsistente e exposição de dados.

Ordem: contrato → testes de payload → workflow → backend → frontend.

### Fase 5 — Revisão, edição e aprovação

Objetivo: garantir controle final do professor.

Arquivos prováveis:

- `FeedbackReview.jsx`;
- rotas de regeneração e aprovação;
- `feedbackService.js`;
- `approvalService.js`;
- tabelas de versões/aprovação.

Tarefas:

1. textarea editável;
2. preservar original;
3. regenerar com nova versão;
4. permitir motivo de regeneração;
5. aprovar de forma idempotente;
6. registrar edição final.

Critérios:

- nenhuma versão é sobrescrita;
- professor pode aprovar original ou edição;
- regeneração cria número novo;
- versão aprovada é recuperável e auditável.

Riscos: clique duplo, aprovação de versão obsoleta e perda de edição.

Ordem: modelo de dados → endpoints → UI → concorrência/idempotência.

### Fase 6 — Testes e estabilização

Objetivo: validar o fluxo completo e a compatibilidade.

Arquivos prováveis:

- testes backend;
- testes frontend;
- fixtures de payload;
- documentação;
- workflows de homologação.

Tarefas:

1. testes unitários de normalização;
2. testes de schemas;
3. integração backend–n8n;
4. testes de timeout/parse/Sheets;
5. testes ponta a ponta;
6. segurança e LGPD;
7. migração controlada e rollback.

Critérios:

- cenários corretos, incorretos, parciais, baixa confiança e erro passam;
- rota legada continua funcional durante a transição;
- logs não expõem dados além do aprovado;
- métricas e IDs de correlação disponíveis.

Riscos: testar apenas o caminho feliz e usar `webhook-test` em produção.

Ordem: unitário → contrato → integração → E2E → homologação → ativação.

## 11. Critérios de aceite gerais

- O professor aceita o termo e envia uma única imagem válida.
- A resposta correta é obrigatória e separada.
- Há revisão explícita antes do processamento.
- Imagem e resposta correta permanecem disponíveis durante o fluxo.
- Os seis campos da extração são retornados.
- Confiança e legibilidade são exibidas.
- O professor edita enunciado, desenvolvimento e resposta.
- Original e correções são preservados.
- A avaliação oficial é recalculada no backend.
- Casos de baixa confiança são sinalizados.
- O professor reinicia sem gerar registros inconsistentes.
- O questionário corresponde ao resultado.
- O questionário é validado e persistido.
- O n8n/Gemini recebem o contexto pedagógico completo.
- A resposta da IA segue schema ou produz erro/fallback explícito.
- O feedback é editável.
- Regeneração cria nova versão.
- O professor aprova original ou edição.
- A versão aprovada e a versão original ficam registradas.
- O fluxo sobrevive a reinício do backend quando a persistência estiver ativa.
- O fluxo legado permanece disponível até a migração ser concluída.
- Dados e logs seguem a política de LGPD aprovada.

## 12. Riscos técnicos e decisões pendentes

### 12.1 Onde comparar respostas

Decisão recomendada: backend como fonte oficial; frontend apenas para prévia; n8n recebe o resultado. Isso elimina as duas normalizações divergentes atuais.

### 12.2 Como versionar sem quebrar

Recomendação: API e workflows `v2`, feature flag e coexistência temporária. Não alterar obrigatoriedade da rota legada antes da migração.

### 12.3 Respostas parcialmente corretas

Criar status `partial` e permitir confirmação/override do professor. Não inferir “parcial” apenas por igualdade textual. Critérios pedagógicos precisam ser aprovados.

### 12.4 Baixa confiança

Usar alerta e revisão obrigatória, não reprovação automática. Limiar inicial e possibilidade de override estão “a confirmar”.

### 12.5 Dados sensíveis e de pesquisa

Definir:

- base legal e finalidade;
- dados permitidos;
- pseudonimização;
- retenção;
- acesso;
- descarte;
- armazenamento de imagem, prompt e resposta bruta;
- uso de Sheets.

### 12.6 Nova versão do Gemini

Fixar modelo por ambiente, registrar identificador real e versão do prompt, executar suíte de regressão antes de atualizar e manter rollback.

### 12.7 Controle final do professor

Feedback nunca deve ser finalizado automaticamente. Exigir aprovação explícita, preservar versões e registrar quem/quando aprovou.

### 12.8 Decisões adicionais

- autenticação e identidade do professor: a confirmar;
- banco de dados e hospedagem: a confirmar;
- necessidade de guardar imagem: a confirmar com LGPD/pesquisa;
- cardinalidade das perguntas: a confirmar;
- campos obrigatórios do feedback: a confirmar;
- comportamento depois da aprovação: bloquear ou permitir reabertura;
- Sheets como exportação ou remoção: a confirmar;
- política de retry do n8n/Gemini: a confirmar.

### 12.9 Riscos já presentes que devem ser tratados antes da ativação

- extração em mock fixo no export;
- divergência `image`/`image0`;
- validação incompleta no workflow de extração;
- Google Sheets no caminho crítico;
- mapeamento vazio no nó Sheets do feedback;
- comparação divergente backend/n8n;
- modelo real não registrado;
- store volátil;
- feedback sem aprovação;
- uso de URLs `/webhook-test/` em exemplos, inadequadas para produção.

## 13. Checklist final para implementação

### Preparação

- [ ] Aprovar contrato `2.0`.
- [ ] Aprovar enums e estados.
- [ ] Aprovar perguntas e opções com a equipe pedagógica.
- [ ] Definir comparação e override.
- [ ] Definir banco e migrações.
- [ ] Aprovar política LGPD, retenção e acesso.
- [ ] Criar testes de caracterização do legado.
- [ ] Criar feature flag.

### Frontend

- [ ] Separar etapas/componentes.
- [ ] Criar revisão da submissão.
- [ ] Manter imagem e resposta correta visíveis.
- [ ] Exibir confiança e legibilidade.
- [ ] Permitir edição da extração.
- [ ] Implementar alerta de baixa confiança.
- [ ] Implementar questionários condicionais.
- [ ] Preservar rascunhos.
- [ ] Exibir feedback em campo editável.
- [ ] Implementar aprovar, editar/aprovar e regenerar.
- [ ] Exibir versões.
- [ ] Tratar loading, erro e retry por ação.

### Backend

- [ ] Versionar endpoints.
- [ ] Criar schemas Zod.
- [ ] Substituir `Map` por repositório persistente.
- [ ] Persistir original e revisão.
- [ ] Centralizar comparação.
- [ ] Salvar questionário.
- [ ] Montar payload consolidado.
- [ ] Versionar feedback.
- [ ] Implementar regeneração.
- [ ] Implementar aprovação idempotente.
- [ ] Adicionar auditoria e correlação.
- [ ] Preservar rota legada durante a transição.

### n8n e Gemini

- [ ] Criar workflows v2.
- [ ] Remover mock fixo do caminho real.
- [ ] Alinhar campo binário.
- [ ] Corrigir validações.
- [ ] Receber avaliação oficial.
- [ ] Incorporar questionário.
- [ ] Versionar prompts.
- [ ] Validar JSON e coerência.
- [ ] Registrar modelo real.
- [ ] Tirar Sheets do caminho crítico.
- [ ] Confirmar mapeamento das abas.
- [ ] Testar fallback, timeout e parse.

### Dados, segurança e operação

- [ ] Definir acesso aos dados.
- [ ] Pseudonimizar IDs.
- [ ] Definir armazenamento da imagem.
- [ ] Definir retenção de prompts e respostas brutas.
- [ ] Evitar corpos sensíveis em logs comuns.
- [ ] Usar webhooks de produção no ambiente de produção.
- [ ] Preparar rollback.
- [ ] Monitorar erros por etapa.

### Testes e aceite

- [ ] Testar resposta correta.
- [ ] Testar resposta incorreta.
- [ ] Testar resposta parcial/indefinida.
- [ ] Testar baixa confiança.
- [ ] Testar edição da extração.
- [ ] Testar questionário incompatível.
- [ ] Testar regeneração múltipla.
- [ ] Testar aprovação com e sem edição.
- [ ] Testar clique duplo e conflito de versão.
- [ ] Testar reinício do backend.
- [ ] Testar n8n/Gemini indisponível.
- [ ] Testar falha do Sheets sem bloquear resposta.
- [ ] Testar compatibilidade do fluxo atual.
- [ ] Validar o fluxo completo com professores antes da ativação geral.
