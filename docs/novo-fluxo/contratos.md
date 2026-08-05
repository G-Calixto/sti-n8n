# Contratos de dados — novo fluxo (MVP)

> Planejamento, não implementado. Este documento descreve o contrato do **próximo passo real** (o subconjunto MVP descrito em `PLANO_IMPLEMENTACAO_MVP_NOVO_FLUXO.md`), não a arquitetura ambiciosa de `PLANO_ACAO_NOVO_FLUXO.md` (`/api/v2`, Postgres, nomes em inglês, versionamento). Essa visão de longo prazo é só citada no final, sem misturar seus nomes de campo aqui.
>
> O fluxo **hoje implementado e rodando** continua documentado em `docs/contratos-api.md`. Este arquivo aqui é o contrato de onde o fluxo deve chegar a seguir, ainda sem código correspondente.

## Por que este documento existe

`docs/novo-fluxo/PLANO_ACAO_NOVO_FLUXO.md` e `PLANO_IMPLEMENTACAO_MVP_NOVO_FLUXO.md` descrevem o mesmo conceito de formas incompatíveis (nomes em português vs. inglês, rotas versionadas vs. não), e os placeholders dos prompts em `docs/prompts/` usam ainda um terceiro conjunto de nomes para o questionário pedagógico. Este documento resolve essas divergências escolhendo **um nome canônico por campo**, baseado no padrão do MVP (português, consistente com o código atual).

## Visão geral do fluxo

```text
1. Submissão inicial          POST /api/submissions/extract            (inalterado)
2. Revisão da extração        PATCH /api/submissions/:id/extraction    (novo)
3. Questionário pedagógico    (parte do body da etapa 4, não é rota própria)
4. Geração de feedback        POST /api/submissions/:id/feedback       (adaptado, agora com body)
5. Aprovação/regeneração      PATCH /api/submissions/:id/feedback/approval  (novo)
                              POST /api/submissions/:id/feedback com regenerar:true (reaproveitada)
6. Persistência                Map em memória (submissionStore.js), sem banco
```

---

## 1. Submissão inicial

Sem mudança de contrato. Continua `POST /api/submissions/extract`, mesmos campos (`correctAnswer`, `consentAccepted`, `image`), mesma resposta com `extracao` e `avaliacao_preliminar` — ver `docs/contratos-api.md`.

**Mudança de comportamento (não de contrato):** o frontend deve parar de tratar `avaliacao_preliminar` como resultado final. Ela só é preliminar até a extração ser revisada e confirmada na etapa 2.

---

## 2. Revisão da extração

Novo endpoint. O professor corrige os três campos principais extraídos da imagem antes de seguir para o questionário; o backend recalcula oficialmente correto/incorreto — nunca aceita esse resultado vindo do frontend.

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

Regras:

- `enunciado`, `desenvolvimento_aluno` e `resposta_aluno` são strings; `resposta_aluno` não pode ficar vazia.
- `avaliacao` é sempre recalculada em `evaluationService.js` a partir de `resposta_aluno` vs. `correctAnswer` já salvo na submissão — o frontend nunca envia nem decide `resposta_correta`/`status`.
- `avaliacao.status` é `"correta"` ou `"incorreta"` — só esses dois valores no MVP (sem `"parcial"`/`"a_revisar"`, que ficam para a visão futura).

---

## 3. Questionário pedagógico

Não é uma rota própria — o questionário viaja dentro do body de `POST /api/submissions/:id/feedback` (etapa 4). A estrutura muda conforme `avaliacao.status` da etapa 2: `tipo: "correta"` exige `caso_correto` (e `caso_incorreto: null`); `tipo: "incorreta"` exige `caso_incorreto` (e `caso_correto: null`).

### Schema canônico

```json
{
  "tipo": "correta | incorreta",
  "contexto_pedagogico": {
    "momento_conteudo": "recente | ja_trabalhado",
    "estrategias_usadas": ["explicacao_direta", "resolucao_em_grupo", "atividade_pratica"]
  },
  "perfil_emocional": {
    "reacao_ao_erro": "frustracao | indiferenca | busca_compreender | ansiedade | variavel",
    "relacao_com_matematica": "confianca | neutra | resistencia | ansiedade",
    "receptividade_feedback": "boa | depende_da_abordagem | tende_a_resistir"
  },
  "caso_correto": {
    "acerto_esperado": "sim_esperado | sim_com_dificuldade_usual | nao_surpresa_positiva"
  },
  "caso_incorreto": {
    "desempenho_geral": "abaixo_da_media | mediano | acima_da_media",
    "frequencia_erro": "frequente | as_vezes | primeira_vez",
    "natureza_erro": "compreensao_conceito | distracao | interpretacao_enunciado | calculo_execucao"
  },
  "intencao_professor": "texto livre opcional, campo de topo — não fica dentro do questionário"
}
```

**Correção estrutural feita nesta versão:** `receptividade_feedback` passa a ficar dentro de `perfil_emocional`, não de `contexto_pedagogico` (onde o JSON de exemplo do `PLANO_IMPLEMENTACAO_MVP_NOVO_FLUXO.md` §7 a colocou por inconsistência interna). Tanto `novo-fluxo-usuario.md` (pergunta "Esse aluno costuma receber bem o feedback do professor?" está sob "Perfil emocional estável") quanto os prompts (`{{receptividade_ao_feedback}}` aparece agrupado com `{{reacao_ao_erro}}`/`{{relacao_com_matematica}}`) concordam que é perfil emocional, não contexto pedagógico.

### Mapeamento: placeholder do prompt → nome canônico

Os prompts em `docs/prompts/feedback-resposta-correta.md` e `feedback-resposta-incorreta.md` usam nomes que **não batem** com o JSON do MVP nem com o do PLANO. Esta tabela resolve cada divergência de até três nomes para um só:

| Conceito | Placeholder no prompt | JSON do MVP | JSON do PLANO (só referência) | **Nome canônico (este doc)** |
|---|---|---|---|---|
| Quando o conteúdo foi trabalhado | `{{quando_conteudo_foi_trabalhado}}` | `momento_conteudo` | `content_timing` | **`momento_conteudo`** |
| Como o conteúdo foi trabalhado | `{{como_conteudo_foi_trabalhado}}` | `estrategias_usadas` | `teaching_strategies` | **`estrategias_usadas`** |
| Expectativa de acerto (caso correto) | `{{expectativa_do_acerto}}` | `acerto_esperado` | `success_expectation` | **`acerto_esperado`** |
| Desempenho geral (caso incorreto) | `{{desempenho_geral_matematica}}` | `desempenho_geral` | `general_performance` | **`desempenho_geral`** |
| Frequência do erro | `{{frequencia_do_erro}}` | `frequencia_erro` | `error_frequency` | **`frequencia_erro`** |
| Natureza do erro percebido | `{{tipo_erro_percebido}}` | `natureza_erro` | `perceived_error_type` | **`natureza_erro`** |
| Reação ao erro | `{{reacao_ao_erro}}` | `reacao_ao_erro` | `reaction_to_error` | **`reacao_ao_erro`** (sem mudança) |
| Relação com matemática | `{{relacao_com_matematica}}` | `relacao_com_matematica` | `relationship_with_math` | **`relacao_com_matematica`** (sem mudança) |
| Receptividade ao feedback | `{{receptividade_ao_feedback}}` | `receptividade_feedback` (mal posicionado, ver acima) | `feedback_receptivity` | **`receptividade_feedback`**, dentro de `perfil_emocional` |
| Observação/intenção do professor | `{{observacao_professor}}` | `intencao_professor` | `teacher_intention` | **`intencao_professor`**, campo de topo |

**Ação pendente sinalizada (não feita nesta passada):** os placeholders `{{quando_conteudo_foi_trabalhado}}`, `{{como_conteudo_foi_trabalhado}}`, `{{expectativa_do_acerto}}`, `{{desempenho_geral_matematica}}`, `{{frequencia_do_erro}}`, `{{tipo_erro_percebido}}` e `{{observacao_professor}}` precisam ser renomeados nos dois arquivos de `docs/prompts/` para bater com a coluna "Nome canônico" acima, quando o novo fluxo for de fato implementado.

### Valores (enum) por campo

As opções abaixo vêm do texto real em `novo-fluxo-usuario.md` (única fonte com a lista completa); os slugs são propostos por este documento e **precisam ser confirmados com a equipe pedagógica antes da implementação** — nenhum dos documentos de planejamento fecha essa lista.

| Campo | Opções (texto original → slug proposto) |
|---|---|
| `momento_conteudo` | "Foi visto recentemente" → `recente` · "Já foi bastante trabalhado" → `ja_trabalhado` |
| `estrategias_usadas` (múltipla escolha) | "Exposição direta explicação/lousa" → `explicacao_direta` · "resolução de problemas em grupo" → `resolucao_em_grupo` · "atividade prática/experimental" → `atividade_pratica` |
| `acerto_esperado` (só se `tipo: correta`) | "sim, é o esperado para ele" → `sim_esperado` · "sim, mas ele costuma ter dificuldade" → `sim_com_dificuldade_usual` · "não, foi uma surpresa positiva" → `nao_surpresa_positiva` |
| `desempenho_geral` (só se `tipo: incorreta`) | "Abaixo da média" → `abaixo_da_media` · "Na média" → `mediano` · "Acima da média" → `acima_da_media` |
| `frequencia_erro` (só se `tipo: incorreta`) | "Sim" (é frequente) → `frequente` · "As vezes" → `as_vezes` · "É a primeira Vez" → `primeira_vez` |
| `natureza_erro` (só se `tipo: incorreta`) | "Compreensão do conceito" → `compreensao_conceito` · "distração" → `distracao` · "Interpretação do enunciado" → `interpretacao_enunciado` · "cálculo/execução" → `calculo_execucao` |
| `reacao_ao_erro` | "fica frustrado" → `frustracao` · "fica indiferente" → `indiferenca` · "quer entender o erro" → `busca_compreender` · "fica ansioso" → `ansiedade` · "varia muito" → `variavel` |
| `relacao_com_matematica` | "tem confiança" → `confianca` · "é neutro" → `neutra` · "tem resistência" → `resistencia` · "demonstra ansiedade" → `ansiedade` |
| `receptividade_feedback` | "sim, acolhe bem" → `boa` · "depende de como é dado" → `depende_da_abordagem` · "tende a resistir" → `tende_a_resistir` |

**A confirmar (nenhum documento decide isso):**
- Se `estrategias_usadas` é seleção única ou múltipla — o JSON de exemplo do MVP já assume array, e a UI descrita usa checkboxes (sugerindo múltipla escolha), mas nenhum documento afirma isso explicitamente.
- Se algum destes campos deveria aceitar `"nao_informado"`/opcional em vez de ser sempre obrigatório.

---

## 4. Geração de feedback

`POST /api/submissions/:id/feedback` deixa de aceitar chamada sem corpo e passa a exigir o questionário. (Compatibilidade temporária com a chamada antiga sem body pode existir enquanto o frontend novo não estiver validado — deve ficar marcada como legado e removida depois, não como comportamento permanente.)

Frontend → backend:

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
  "intencao_professor": "Valorizar a estratégia usada antes de indicar o erro de cálculo.",
  "regenerar": false,
  "instrucao_regeneracao": ""
}
```

Backend → n8n (payload consolidado, junta extração revisada + avaliação oficial + questionário):

```json
{
  "submission_id": "sub_001",
  "feedback_generation": 1,
  "correct_answer": "25",
  "extracao": { "enunciado": "...", "desenvolvimento_aluno": "...", "resposta_aluno": "...", "legibilidade": "alta", "confianca_extracao": 0.91, "observacoes": "" },
  "avaliacao": { "status": "incorreta", "resposta_correta": false },
  "questionario": { "...schema da seção 3..." },
  "intencao_professor": "Valorizar a estratégia usada antes de indicar o erro de cálculo.",
  "regeneracao": { "solicitada": false, "instrucao": "" }
}
```

n8n → backend → frontend (resposta):

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

**`feedback_aluno` é o único campo obrigatório da resposta.** `feedback_professor`, `dica_proxima_acao`, `tipo_erro` e `confianca_feedback` podem continuar aparecendo por compatibilidade com o workflow atual, mas são opcionais e não devem ser exigidos nem exibidos pelo frontend novo — batem com o que os prompts atuais (`docs/prompts/*.md`) já retornam hoje (só `{"feedback_aluno": ""}`).

Regeneração reaproveita esta mesma rota, sem endpoint próprio:

```json
{
  "questionario": {},
  "intencao_professor": "Valorizar a estratégia usada antes de indicar o erro de cálculo.",
  "regenerar": true,
  "instrucao_regeneracao": "Criar uma versão mais curta e com uma pergunta orientadora."
}
```

Se `regenerar: true` e `questionario` vier vazio, o backend reutiliza o questionário já salvo na submissão; se não houver nenhum salvo, retorna erro (`questionnaire_not_found`) sem chamar o n8n. Falha na regeneração preserva a versão anterior de `feedback_aluno` — nunca substitui por um estado vazio/quebrado.

---

## 5. Aprovação de feedback

Novo endpoint, sem versionamento nem trilha de auditoria — só grava o texto final.

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

`feedback_aluno` não pode ser vazio. O texto salvo é exatamente o que o frontend enviar (original ou editado pelo professor) — não há identidade do aprovador nem histórico de versões anteriores no MVP.

---

## 6. Persistência

Continua tudo em `submissionStore.js` (`Map` em memória, perdido ao reiniciar o backend). Forma mínima do registro:

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

Sem banco de dados, sem persistência de imagem, sem histórico completo de versões de feedback, sem auditoria. `PLANO_ACAO_NOVO_FLUXO.md` §9 descreve a visão de longo prazo (Postgres, tabelas `submissions`/`extractions`/`feedback_versions`/`approvals`, trilha de auditoria) — não duplicada aqui; ver aquele documento diretamente se for preciso.

---

## Visão futura (não implementada, não misturar com o contrato acima)

`PLANO_ACAO_NOVO_FLUXO.md` descreve uma arquitetura de longo prazo — `/api/v2`, PostgreSQL, nomes de campo em inglês (`statement`, `student_answer`, `evaluation.status`, `feedback.student`, etc.), versionamento explícito (`feedback_version`, rotas com número de versão na URL), autenticação/identificação do professor e trilha de auditoria completa. Nada disso está implementado nem é o próximo passo — é direção de longo prazo. Se esse caminho for adotado no futuro, ele substitui este contrato inteiro; os dois não devem ser combinados campo a campo.
