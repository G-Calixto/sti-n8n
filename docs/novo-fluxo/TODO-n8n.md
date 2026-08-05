# TODO n8n — adaptação para o novo fluxo (arquivo temporário)

> Este arquivo é um checklist de trabalho, não documentação permanente do projeto. Apague ou mova o conteúdo relevante para `n8n/docs/workflow-feedback.md` quando o workflow `Feedback` for de fato adaptado.

A aplicação (backend + frontend) já implementa o contrato descrito em `docs/novo-fluxo/contratos.md`. O workflow `Feedback` do n8n **ainda não foi tocado** — ele continua recebendo o payload novo (mais rico), mas só usa os campos que já conhecia. Isto é o que falta ajustar nele.

## 1. [Correção obrigatória] Parar de recalcular correto/incorreto dentro do n8n

O node **"Preparar dados"** (`n8n/workflows/Feedback.json`) hoje faz sua própria comparação normalizada entre `resposta_aluno` e `correct_answer` (função `normalizarResposta` + `resposta_correta`) e decide sozinho qual prompt usar (`resposta_correta`/`resposta_incorreta`). Isso duplica o cálculo que o backend já faz oficialmente em `apps/backend/src/services/evaluationService.js` e agora envia pronto no payload, no campo `avaliacao` (`{resposta_correta, status}`).

**Isso não deveria acontecer.** Para fins de pesquisa, o cálculo de acerto/erro precisa existir em um único lugar. O node deve:
- parar de recalcular `resposta_correta` a partir de `extracao`/`correct_answer`;
- ler `body.avaliacao.status` (`"correta"`/`"incorreta"`) e `body.avaliacao.resposta_correta` diretamente do payload recebido;
- escolher o prompt (correta/incorreta) com base nisso, não em um recálculo próprio.

## 2. Ler e usar o questionário pedagógico e a intenção do professor

O node hoje ignora tudo isso — o payload chega, mas nada em `questionario`, `intencao_professor` ou `regeneracao` é lido. O prompt precisa incorporar (mapeamento completo em `docs/novo-fluxo/contratos.md` §3-4 e em `PLANO_IMPLEMENTACAO_MVP_NOVO_FLUXO.md` §6):

- `questionario.contexto_pedagogico.momento_conteudo` / `estrategias_usadas`
- `questionario.perfil_emocional.reacao_ao_erro` / `relacao_com_matematica` / `receptividade_feedback`
- `questionario.caso_correto.acerto_esperado` (quando `tipo: correta`)
- `questionario.caso_incorreto.desempenho_geral` / `frequencia_erro` / `natureza_erro` (quando `tipo: incorreta`)
- `intencao_professor` (campo de topo, texto livre)
- `regeneracao.solicitada` / `regeneracao.instrucao` — quando `solicitada: true`, usar `instrucao` para variar a nova versão do feedback

## 3. Reduzir o formato de saída pedido ao Gemini

O prompt embutido no código do node ainda pede o formato antigo completo:

```json
{
  "acertou": true,
  "status_avaliacao": "correta",
  "tipo_erro": "nenhum",
  "resumo_erro": "",
  "feedback_aluno": "",
  "feedback_professor": "",
  "dica_proxima_acao": "",
  "confianca_feedback": 0.95
}
```

Precisa passar a pedir só:

```json
{ "feedback_aluno": "" }
```

Isso já está alinhado com os templates em `docs/prompts/feedback-resposta-correta.md` e `feedback-resposta-incorreta.md` — mas atenção: os placeholders desses templates (`{{tipo_erro_percebido}}`, `{{desempenho_geral_matematica}}`, `{{frequencia_do_erro}}`, `{{expectativa_do_acerto}}`, `{{observacao_professor}}`, `{{quando_conteudo_foi_trabalhado}}`, `{{como_conteudo_foi_trabalhado}}`) **não batem** com os nomes canônicos definidos em `docs/novo-fluxo/contratos.md` §3 (ex.: `tipo_erro_percebido` → `natureza_erro`). A tabela de mapeamento completa já existe lá — os prompts precisam ser renomeados para bater com o payload que o backend envia agora.

## 4. Nó "Tratar resposta da IA"

Depois do ajuste do prompt, este node (que hoje monta o `avaliacao` completo com `acertou`/`status_avaliacao`/`dica_proxima_acao`/etc.) pode ser simplificado para só exigir `feedback_aluno` como obrigatório — os demais campos continuam aceitáveis por compatibilidade (o backend já trata isso como opcional/legado), mas não precisam mais ser construídos artificialmente quando ausentes.

## 5. Estratégia seguindo o que já está descrito no plano

Seguir a "Estratégia segura" de `PLANO_IMPLEMENTACAO_MVP_NOVO_FLUXO.md` §6: trabalhar em uma cópia do workflow `Feedback`, não remover o atual até validar o caminho completo com o payload novo.

## Nota sobre o export

`n8n/workflows/Feedback.json` já está desatualizado frente à instância viva (`pibit-n8n/n8n_data/`), que tem um terceiro workflow (`Extração - STI otimizado`) não presente neste export. Reexporte o workflow `Feedback` da instância viva antes de editar, para não trabalhar em cima de uma versão obsoleta.

## Estado até essa correção acontecer

A aplicação funciona de ponta a ponta (extração → revisão → questionário → geração de feedback → aprovação/regeneração), mas o texto do feedback gerado **não reflete** o questionário pedagógico nem a intenção do professor, e o resultado correto/incorreto usado internamente pelo n8n ainda pode divergir do resultado oficial calculado pelo backend — é justamente a duplicação descrita no item 1.
