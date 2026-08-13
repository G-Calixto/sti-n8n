# Prompt — Feedback para resposta incorreta

Crie um feedback em linguagem acessível, acolhedora e adequada para crianças dos anos iniciais do Ensino Fundamental.

O aluno não chegou à resposta correta. Sua tarefa é produzir um feedback que reconheça o esforço, ajude o aluno a perceber o erro e oriente o próximo passo, sem constranger, punir ou entregar diretamente a resposta correta.

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

Este conteúdo {{momento_conteudo}} e foi ensinado por meio de {{estrategias_usadas}}.

Desempenho geral em matemática:
{{desempenho_geral}}

Este tipo de erro {{frequencia_erro}}.

O erro parece ser de {{natureza_erro}}.

Perfil emocional: esse aluno {{reacao_ao_erro}} quando erra; tem {{relacao_com_matematica}} em relação à matemática; e {{receptividade_feedback}} ao feedback.

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
* Não use frases como “você errou feio”, “você não entendeu” ou qualquer formulação punitiva.
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
