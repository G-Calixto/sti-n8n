# Prompt — Feedback para resposta correta

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

Este conteúdo {{quando_conteudo_foi_trabalhado}} e foi ensinado por meio de {{como_conteudo_foi_trabalhado}}.

O acerto {{expectativa_do_acerto}}.

Perfil emocional: esse aluno {{reacao_ao_erro}} quando erra; tem {{relacao_com_matematica}} em relação à matemática; e {{receptividade_ao_feedback}} ao feedback.

Informação adicional do professor, se houver:
{{observacao_professor}}

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
* Não diga apenas “parabéns”; explique o motivo do acerto.
* O feedback deve ter no máximo 10 linhas.
* Não use markdown no texto do feedback.
* Não use listas numeradas no texto do feedback.

## Formato de saída obrigatório

Retorne apenas um JSON válido, sem markdown, no seguinte formato:

{
"feedback_aluno": ""
}

No campo "feedback_aluno", escreva o feedback direcionado ao aluno.
