# Prompt validado — questionário v2

Este documento registra o prompt validado na ferramenta `prompt-maker-sti`, que
substituirá o prompt em produção. Ele foi **gerado executando o próprio código da
ferramenta** (`src/App.jsx`: `DEFAULT_TEXTS`, `MAP`, `buildContexto`,
`buildDadosQuestao`, `buildPromptFinal`), e não transcrito à mão — o texto abaixo
é caractere por caractere o que a ferramenta produz.

Versão do questionário: `2026-06-novo-questionario`.

> **Ressalva importante.** No `prompt-maker` os blocos de início e de final do
> prompt são **editáveis na tela**, com um botão para restaurar o padrão. O que
> está aqui é o padrão (`DEFAULT_TEXTS`). Se durante a validação vocês editaram
> algum desses blocos, o texto realmente testado está nos registros salvos —
> exporte o histórico em JSON e dá para conferir campo a campo.

---

## Estrutura do prompt

Quatro blocos concatenados, nesta ordem:

```text
[1] Início           varia conforme correta/incorreta
[2] Dados da questão idêntico nas duas variantes
[3] Contexto do aluno    montado a partir do questionário
[4] Final            estrutura obrigatória + regras + formato de saída
```

Um único prompt é enviado por chamada. A escolha entre as variantes A e B vem do
resultado da comparação determinística feita no backend — **não é a IA que decide
se o aluno acertou**.

---

## Variante A — resposta correta

```text
Crie um feedback em linguagem acessível, acolhedora e adequada para crianças dos anos iniciais do Ensino Fundamental.

O aluno acertou a resposta. Sua tarefa é produzir um feedback que valorize o acerto, reconheça o progresso e ajude o aluno a continuar avançando, sem apenas parabenizar de forma genérica.

## Dados da questão

Enunciado da questão:
{{enunciado}}

Desenvolvimento do aluno:
{{desenvolvimento_aluno}}

Resposta final do aluno:
{{resposta_aluno}}

Resposta correta esperada:
{{resposta_correta}}

Observação importante: a resposta correta esperada é uma informação interna para orientar sua análise. Não revele explicitamente a resposta correta no feedback.

## Contexto do aluno

Este conteúdo foi trabalhado {{quando_conteudo_trabalhado}}. Em relação à profundidade, {{profundidade_conteudo}}. Em aula, foi trabalhado por meio de {{como_conteudo_trabalhado}}.

O acerto {{acerto_esperado}}.

Perfil emocional: esse aluno {{reacao_ao_erro}} quando erra; {{relacao_com_matematica}} em relação à matemática; e {{receptividade_feedback}} ao feedback.

Informação adicional do professor, se houver:
{{intencao_professor}}

## Estrutura obrigatória do feedback

O feedback deve seguir esta estrutura:

1. Reconhecimento inicial do acerto.
2. Menção específica ao que o aluno demonstrou compreender ou fazer bem.
3. Reconhecimento do esforço, aprofundamento do conceito, generalização para novos contextos e um pequeno desafio para continuar avançando.

## Regras de escrita

* Use linguagem simples, respeitosa e encorajadora.
* Escreva diretamente para o aluno.
* Não use tom excessivamente infantilizado.
* Não invente informações sobre o aluno, a turma ou a aula.
* Use apenas os dados fornecidos.
* Adapte o tom ao perfil emocional informado pelo professor.
* Não revele explicitamente a resposta correta.
* Não diga apenas "parabéns"; explique o motivo do acerto.
* O feedback deve ter no máximo 10 linhas.
* Não use markdown no texto do feedback.
* Não use listas numeradas no texto do feedback.

## Formato de saída obrigatório

Retorne apenas um JSON válido, sem markdown, no seguinte formato:

{
  "feedback_aluno": ""
}

No campo "feedback_aluno", escreva o feedback direcionado ao aluno.
```

---

## Variante B — resposta incorreta

```text
Crie um feedback em linguagem acessível, acolhedora e adequada para crianças dos anos iniciais do Ensino Fundamental.

O aluno não chegou à resposta correta. Sua tarefa é produzir um feedback que reconheça o esforço, oriente passo a passo, sem constranger, punir ou entregar diretamente a resposta correta e encoraje o aluno, provocando uma reflexão sobre o erro.

## Dados da questão

Enunciado da questão:
{{enunciado}}

Desenvolvimento do aluno:
{{desenvolvimento_aluno}}

Resposta final do aluno:
{{resposta_aluno}}

Resposta correta esperada:
{{resposta_correta}}

Observação importante: a resposta correta esperada é uma informação interna para orientar sua análise. Não revele explicitamente a resposta correta no feedback.

## Contexto do aluno

Este conteúdo foi trabalhado {{quando_conteudo_trabalhado}}. Em relação à profundidade, {{profundidade_conteudo}}. Em aula, foi trabalhado por meio de {{como_conteudo_trabalhado}}.

Desempenho geral em matemática:
{{desempenho_geral}}

Este tipo de erro {{frequencia_erro}}.

O erro parece ser de {{natureza_erro}}.

Perfil emocional: esse aluno {{reacao_ao_erro}} quando erra; {{relacao_com_matematica}} em relação à matemática; e {{receptividade_feedback}} ao feedback.

Informação adicional do professor, se houver:
{{intencao_professor}}

## Estrutura obrigatória do feedback

O feedback deve seguir esta estrutura:

1. Reconhecimento inicial do esforço ou da tentativa do aluno.
2. Orientação passo a passo sobre onde o raciocínio pode ter se desviado.
3. Encorajamento, provocação de reflexão sobre o erro e orientação clara para o próximo passo.

## Regras de escrita

* Use linguagem simples, respeitosa e encorajadora.
* Escreva diretamente para o aluno.
* Não use tom excessivamente infantilizado.
* Não invente informações sobre o aluno, a turma ou a aula.
* Use apenas os dados fornecidos.
* Trate o tipo de erro como uma hipótese pedagógica, não como uma certeza absoluta.
* Adapte o tom ao perfil emocional informado pelo professor.
* Não revele explicitamente a resposta correta.
* Não resolva toda a questão pelo aluno.
* Não use frases como "você errou feio", "você não entendeu" ou qualquer formulação punitiva.
* Ajude o aluno a revisar o caminho, perceber o ponto de atenção e tentar novamente.
* O feedback deve ter no máximo 10 linhas.
* Não use markdown no texto do feedback.
* Não use listas numeradas no texto do feedback.

## Formato de saída obrigatório

Retorne apenas um JSON válido, sem markdown, no seguinte formato:

{
  "feedback_aluno": ""
}

No campo "feedback_aluno", escreva o feedback direcionado ao aluno.
```

---

## Tradução: opção do questionário → frase no prompt

O professor marca uma letra; o sistema insere a frase correspondente no bloco
`Contexto do aluno`.

**CP1) Quando este conteúdo foi trabalhado?**

| | Opção no formulário | Frase que entra no prompt |
|---|---|---|
| `A` | Nesta semana | nesta semana |
| `B` | De 2 à 4 semanas | de 2 a 4 semanas atrás |
| `C` | Neste semestre (Há mais de um mês) | neste semestre, há mais de um mês |
| `D` | Em semestres anteriores | em semestres anteriores |

**CP2) O quanto este conteúdo foi trabalhado?**

| | Opção no formulário | Frase que entra no prompt |
|---|---|---|
| `A` | Foi trabalhado em profundidade, com prática extensiva e aplicação em diferentes contextos | foi trabalhado em profundidade, com prática extensiva e aplicação em diferentes contextos |
| `B` | Foi bem trabalhado, com prática relevante | foi bem trabalhado, com prática relevante |
| `C` | Foi trabalhado de forma superficial, com pouca prática | foi trabalhado de forma superficial, com pouca prática |
| `D` | Foi apenas apresentado teoricamente, sem prática associada | foi apenas apresentado teoricamente, sem prática associada |

**CP3) Como este conteúdo foi trabalhado em aula?**

| | Opção no formulário | Frase que entra no prompt |
|---|---|---|
| `A` | Exposição direta (explicação-lousa) | exposição direta com explicação/lousa |
| `B` | Resolução de problemas em grupo | resolução de problemas em grupo |
| `C` | Resolução de problemas individualmente | resolução de problemas individualmente |
| `D` | Atividade prática-experimental | atividade prática/experimental |

**DSP1) Como é o desempenho geral desse aluno em matemática? — só quando a resposta está incorreta**

| | Opção no formulário | Frase que entra no prompt |
|---|---|---|
| `A` | Abaixo da média | Abaixo da média |
| `B` | Na média | Na média |
| `C` | Acima da média | Acima da média |

**DSP2) Com que frequência o aluno comete este erro?**

| | Opção no formulário | Frase que entra no prompt |
|---|---|---|
| `A` | Foi a primeira vez | apareceu pela primeira vez |
| `B` | Às vezes ou algumas vezes | acontece às vezes ou algumas vezes |
| `C` | Quase sempre | acontece quase sempre |

**DSP3) O erro parece ser de:**

| | Opção no formulário | Frase que entra no prompt |
|---|---|---|
| `A` | Compreensão do conceito | compreensão do conceito |
| `B` | Distração | distração |
| `C` | Interpretação do enunciado | interpretação do enunciado |
| `D` | Cálculo-execução | cálculo/execução |

**DSP1) O acerto foi esperado para esse aluno? — só quando a resposta está correta**

| | Opção no formulário | Frase que entra no prompt |
|---|---|---|
| `A` | Sim, é o esperado para ele | era esperado |
| `B` | Sim, mas ele costuma ter dificuldade | era esperado, mas o aluno costuma ter dificuldade nesse conteúdo |
| `C` | Não, foi uma surpresa positiva | foi uma surpresa positiva |

**PEE1) Como esse aluno costuma reagir quando erra?**

| | Opção no formulário | Frase que entra no prompt |
|---|---|---|
| `A` | Fica frustrado | fica frustrado |
| `B` | Fica indiferente | fica indiferente |
| `C` | Quer entender o erro | quer entender o erro |
| `D` | Fica ansioso | fica ansioso |
| `E` | Varia muito | varia muito |

**PEE2) Como é a relação desse aluno com matemática? — as duas versões só diferem na ordem das palavras da última opção**

| | Opção no formulário | Frase que entra no prompt |
|---|---|---|
| `A` | Demonstra confiança | demonstra confiança |
| `B` | Demonstra interesse | demonstra interesse |
| `C` | Demonstra desinteresse | demonstra desinteresse |
| `D` | Demonstra resistência | demonstra resistência |
| `E` | Demonstra ansiedade ou bloqueio | demonstra ansiedade ou bloqueio |

**PEE2) Como é a relação desse aluno com matemática? — as duas versões só diferem na ordem das palavras da última opção**

| | Opção no formulário | Frase que entra no prompt |
|---|---|---|
| `A` | Demonstra confiança | demonstra confiança |
| `B` | Demonstra interesse | demonstra interesse |
| `C` | Demonstra desinteresse | demonstra desinteresse |
| `D` | Demonstra resistência | demonstra resistência |
| `E` | Demonstra bloqueio ou ansiedade | demonstra bloqueio ou ansiedade |

**PEE3) Como esse aluno recebe o feedback do professor?**

| | Opção no formulário | Frase que entra no prompt |
|---|---|---|
| `A` | Recebe bem | recebe bem |
| `B` | Depende de como é dado | depende de como é dado |
| `C` | Tende a resistir | tende a resistir |

### Campo livre

**Informação adicional do professor** — texto livre, opcional. Quando vazio, o
prompt recebe literalmente `Não informado.`

---

## Exemplo completo — caso incorreto

Questão `incorreta_questao1`, com as respostas `CP1A2B3A_DSP1B2B3D_PEE1C2B3A`.

Identificador do teste: `incorreta_questao1_CP1A2B3A_DSP1B2B3D_PEE1C2B3A`

```text
Crie um feedback em linguagem acessível, acolhedora e adequada para crianças dos anos iniciais do Ensino Fundamental.

O aluno não chegou à resposta correta. Sua tarefa é produzir um feedback que reconheça o esforço, oriente passo a passo, sem constranger, punir ou entregar diretamente a resposta correta e encoraje o aluno, provocando uma reflexão sobre o erro.

## Dados da questão

Enunciado da questão:
Um ônibus escolar transporta 125 alunos pela manhã e 98 alunos à tarde. Quantos alunos são transportados no total durante o dia?

Desenvolvimento do aluno:
125+98=147

Resposta final do aluno:
147

Resposta correta esperada:
223

Observação importante: a resposta correta esperada é uma informação interna para orientar sua análise. Não revele explicitamente a resposta correta no feedback.

## Contexto do aluno

Este conteúdo foi trabalhado nesta semana. Em relação à profundidade, foi bem trabalhado, com prática relevante. Em aula, foi trabalhado por meio de exposição direta com explicação/lousa.

Desempenho geral em matemática:
Na média

Este tipo de erro acontece às vezes ou algumas vezes.

O erro parece ser de cálculo/execução.

Perfil emocional: esse aluno quer entender o erro quando erra; demonstra interesse em relação à matemática; e recebe bem ao feedback.

Informação adicional do professor, se houver:
Não informado.

## Estrutura obrigatória do feedback

O feedback deve seguir esta estrutura:

1. Reconhecimento inicial do esforço ou da tentativa do aluno.
2. Orientação passo a passo sobre onde o raciocínio pode ter se desviado.
3. Encorajamento, provocação de reflexão sobre o erro e orientação clara para o próximo passo.

## Regras de escrita

* Use linguagem simples, respeitosa e encorajadora.
* Escreva diretamente para o aluno.
* Não use tom excessivamente infantilizado.
* Não invente informações sobre o aluno, a turma ou a aula.
* Use apenas os dados fornecidos.
* Trate o tipo de erro como uma hipótese pedagógica, não como uma certeza absoluta.
* Adapte o tom ao perfil emocional informado pelo professor.
* Não revele explicitamente a resposta correta.
* Não resolva toda a questão pelo aluno.
* Não use frases como "você errou feio", "você não entendeu" ou qualquer formulação punitiva.
* Ajude o aluno a revisar o caminho, perceber o ponto de atenção e tentar novamente.
* O feedback deve ter no máximo 10 linhas.
* Não use markdown no texto do feedback.
* Não use listas numeradas no texto do feedback.

## Formato de saída obrigatório

Retorne apenas um JSON válido, sem markdown, no seguinte formato:

{
  "feedback_aluno": ""
}

No campo "feedback_aluno", escreva o feedback direcionado ao aluno.
```

---

## Exemplo completo — caso correto

Questão `correta_questao1`, com as respostas `CP1A2B3B_DSP1A_PEE1A2A3A`.

Identificador do teste: `correta_questao1_CP1A2B3B_DSP1A_PEE1A2A3A`

```text
Crie um feedback em linguagem acessível, acolhedora e adequada para crianças dos anos iniciais do Ensino Fundamental.

O aluno acertou a resposta. Sua tarefa é produzir um feedback que valorize o acerto, reconheça o progresso e ajude o aluno a continuar avançando, sem apenas parabenizar de forma genérica.

## Dados da questão

Enunciado da questão:
Larissa tinha 2 flores em seu jardim e ganhou mais 3 flores de sua amiga. Quantas flores Larissa tem agora em seu jardim?

Desenvolvimento do aluno:
2+3=5

Resposta final do aluno:
5

Resposta correta esperada:
5

Observação importante: a resposta correta esperada é uma informação interna para orientar sua análise. Não revele explicitamente a resposta correta no feedback.

## Contexto do aluno

Este conteúdo foi trabalhado nesta semana. Em relação à profundidade, foi bem trabalhado, com prática relevante. Em aula, foi trabalhado por meio de resolução de problemas em grupo.

O acerto era esperado.

Perfil emocional: esse aluno fica frustrado quando erra; demonstra confiança em relação à matemática; e recebe bem ao feedback.

Informação adicional do professor, se houver:
Não informado.

## Estrutura obrigatória do feedback

O feedback deve seguir esta estrutura:

1. Reconhecimento inicial do acerto.
2. Menção específica ao que o aluno demonstrou compreender ou fazer bem.
3. Reconhecimento do esforço, aprofundamento do conceito, generalização para novos contextos e um pequeno desafio para continuar avançando.

## Regras de escrita

* Use linguagem simples, respeitosa e encorajadora.
* Escreva diretamente para o aluno.
* Não use tom excessivamente infantilizado.
* Não invente informações sobre o aluno, a turma ou a aula.
* Use apenas os dados fornecidos.
* Adapte o tom ao perfil emocional informado pelo professor.
* Não revele explicitamente a resposta correta.
* Não diga apenas "parabéns"; explique o motivo do acerto.
* O feedback deve ter no máximo 10 linhas.
* Não use markdown no texto do feedback.
* Não use listas numeradas no texto do feedback.

## Formato de saída obrigatório

Retorne apenas um JSON válido, sem markdown, no seguinte formato:

{
  "feedback_aluno": ""
}

No campo "feedback_aluno", escreva o feedback direcionado ao aluno.
```

---

## O código de identificação dos testes

Cada teste no `prompt-maker` recebe um identificador que codifica todas as
respostas do questionário, o que permite reproduzir exatamente a mesma
configuração depois.

```text
incorreta_questao1_CP1A2B3A_DSP1B2B3D_PEE1C2B3A
└────────┬───────┘ └───┬──┘ └───┬───┘ └───┬───┘
    questão          contexto  desempenho  perfil
                    pedagógico            emocional
```

- `CP1{X}2{Y}3{Z}` — as três perguntas de contexto pedagógico
- `DSP1{X}2{Y}3{Z}` — desempenho; **no caso correto só existe `DSP1{X}`**,
  porque as perguntas de frequência e natureza do erro não se aplicam
- `PEE1{X}2{Y}3{Z}` — as três perguntas de perfil emocional
- Um rótulo curto opcional pode ser acrescentado ao final

---

## Notas para o artigo

**O prompt é determinístico dado o questionário.** Nenhuma parte do texto é
gerada por IA: as frases do bloco `Contexto do aluno` vêm de um mapa fixo de
opção → frase. A mesma combinação de respostas produz sempre o mesmo prompt, o
que torna os testes reprodutíveis.

**A avaliação de corretude não é feita pela IA.** A escolha entre a variante A e
a B vem de comparação determinística entre a resposta do aluno (revisada pelo
professor) e a resposta correta (informada pelo professor). O modelo é
*informado* do resultado; nunca julgado sobre ele.

**A resposta correta esperada é enviada no prompt**, com instrução explícita para
não ser revelada ao aluno. É uma restrição por instrução, não por arquitetura —
vale registrar como limitação conhecida.

**O questionário tem 9 perguntas no caso incorreto e 7 no correto**, distribuídas
em três dimensões: contexto pedagógico (3), desempenho (3 ou 1) e perfil
emocional estável (3).
