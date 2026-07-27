# Novo Fluxo da Aplicação
Vamos fazer algumas modificações em como a aplicação funciona atualmente para ficar mais adequada com a nossa proposta atualizada de projeto.

## Novo fluxo pelo ponto de vista do usuario (professor)
### P1 - Submissão dos dados
- **P1.A)** Professor envia uma imagem contendo um único problema contendo o enunciado de uma questão de matemática e uma resposta do aluno.

- **P1.B)** Professor, em um campo abaixo da imagem, envia a resposta correta do exercício (independete da resposta do aluno).

- **P1.C)** Professor visualiza os dados enviados e caso esteja tudo de acordo clica no botão submeter

### P2 - Visualização e correção dos dados extraidos
- **P2.A)** Professor visualiza os dados que foram exibidos na tela após a extração. Dados conforme o exemplo a baixo:

    - _Enunciado da questão_: <sup>02) Em uma festa, havia 70 balões pendurados na parede. Após alguns estourarem, restaram 45 balões. Quantos balões estouraram na festa?</sup>

    - _Desenvolvimento do aluno_: <sup>195+320=335</sup>

    - _Resposta do aluno_: <sup>335</sup>

    - _Confiança da extração_: <sup>98%</sup>

    - _Resultado_: <sup style="color: red">INCORRETA</sup>

- **P2.B)** Professor confere os dados que visualizou e corrige se for necessario no proprio campo dos dados. Caso não esteja satisfeito com o resultado da extração, professor pode reiniciar o processo.

- **P2.C)** Professor clica em iniciar processo de feedback

### P3 - Responder o questionario
**Se _Resultado_ for CORRETO**
- **P3.A)** Professor responde o questionario considerando que a resposta do aluno foi **correta**. O questionario segue o seguinte padrão:

**Contexto Pedagógico**

1) Quando este conteúdo foi trabalhado em aula?
- [ ] Foi visto recentemente
- [ ] Já foi bastante trabalhado

2) Como esse conteúdo foi trabalhado em aula?
- [ ] Exposição direta explicação/lousa
- [ ] resolução de problemas em grupo
- [ ] atividade prática/experimental

**Desempenho**

1) O acerto foi esperado para esse aluno?
- [ ] sim, é o esperado para ele
- [ ] sim, mas ele costuma ter dificuldade
- [ ] não, foi uma surpresa positiva

**Perfil emocional estável**

1) Como esse aluno costuma reagir quando erra?
- [ ] fica frustrado
- [ ] fica indiferente
- [ ] quer entender o erro
- [ ] fica ansioso
- [ ] varia muito

2) Como é a relação desse aluno com matemática?
- [ ] tem confiança
- [ ] é neutro
- [ ] tem resistência
- [ ] demonstra ansiedade

3) Esse aluno costuma receber bem o feedback do professor?
 - [ ] sim, acolhe bem
 - [ ] depende de como é dado
 - [ ] tende a resistir
 
**Intenção do professor**
Tem algo importante sobre esse aluno que devo considerar? 
```plaintext
Digite aqui
```


---


**Se _Resultado_ for INCORRETO**
- **P3.A)** Professor responde o questionario considerando que a resposta do aluno foi **INCORRETA**. O questionario segue o seguinte padrão:

**Contexto Pedagógico**

1) Quando este conteúdo foi trabalhado em aula?
- [ ] Foi visto recentemente
- [ ] Já foi bastante trabalhado

2) Como esse conteúdo foi trabalhado em aula?
- [ ] Exposição direta explicação/lousa
- [ ] resolução de problemas em grupo
- [ ] atividade prática/experimental

**Desempenho**

1) Como é o desempenho geral desse aluno em matemática?
- [ ] Abaixo da média
- [ ] Na média
- [ ] Acima da média

2) Esse tipo de erro é frequente para ele?
- [ ] Sim
- [ ] As vezes
- [ ] É a primeira Vez

3) O erro parece ser de:
- [ ] Compreensão do conceito
- [ ] distração
- [ ] Interpretação do enunciado
- [ ] cálculo/execução



**Perfil emocional estável**

1) Como esse aluno costuma reagir quando erra?
- [ ] fica frustrado
- [ ] fica indiferente
- [ ] quer entender o erro
- [ ] fica ansioso
- [ ] varia muito

2) Como é a relação desse aluno com matemática?
- [ ] tem confiança
- [ ] é neutro
- [ ] tem resistência
- [ ] demonstra ansiedade

3) Esse aluno costuma receber bem o feedback do professor?
 - [ ] sim, acolhe bem
 - [ ] depende de como é dado
 - [ ] tende a resistir
 
**Intenção do professor**
Tem algo importante sobre esse aluno que devo considerar? 
```plaintext
Digite aqui
```

---
- **P3.B)** Professor submete os dados e o questionário para a geração do feedback.


### P4 - Passo final: Finalização do processo

- **P4.A)** Professor visualiza o feedback gerado pelo GEMINI em campo editavel e pode: 
    - Aprovar
    - Editar e aprovar
    - Pedir nova versão pro gemini