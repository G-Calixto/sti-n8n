import { EscolhaUnica, Origem, SecaoQuestionario } from './ui';

// Perguntas, ordem e rotulos espelhados da ferramenta paliativa
// (g-calixto/sti-prompt-tester). Os slugs correspondem as letras A..E de la,
// na mesma ordem. Mudar aqui sem mudar la faz os prompts divergirem.
const OPCOES = {
  // CP1
  momento: [
    { value: 'nesta_semana', label: 'Nesta semana' },
    { value: 'duas_a_quatro_semanas', label: 'De 2 a 4 semanas' },
    { value: 'neste_semestre', label: 'Neste semestre (há mais de um mês)' },
    { value: 'semestres_anteriores', label: 'Em semestres anteriores' }
  ],
  // CP2
  profundidade: [
    { value: 'em_profundidade', label: 'Foi trabalhado em profundidade, com prática extensiva e aplicação em diferentes contextos' },
    { value: 'bem_trabalhado', label: 'Foi bem trabalhado, com prática relevante' },
    { value: 'superficial', label: 'Foi trabalhado de forma superficial, com pouca prática' },
    { value: 'apenas_teorico', label: 'Foi apenas apresentado teoricamente, sem prática associada' }
  ],
  // CP3
  estrategia: [
    { value: 'explicacao_direta', label: 'Exposição direta (explicação, lousa)' },
    { value: 'resolucao_em_grupo', label: 'Resolução de problemas em grupo' },
    { value: 'resolucao_individual', label: 'Resolução de problemas individualmente' },
    { value: 'atividade_pratica', label: 'Atividade prática ou experimental' }
  ],
  // DSP1 do caso correto
  acertoEsperado: [
    { value: 'sim_esperado', label: 'Sim, é o esperado para ele' },
    { value: 'sim_com_dificuldade_usual', label: 'Sim, mas ele costuma ter dificuldade' },
    { value: 'nao_surpresa_positiva', label: 'Não, foi uma surpresa positiva' }
  ],
  // DSP1 do caso incorreto
  desempenho: [
    { value: 'abaixo_da_media', label: 'Abaixo da média' },
    { value: 'na_media', label: 'Na média' },
    { value: 'acima_da_media', label: 'Acima da média' }
  ],
  // DSP2
  frequencia: [
    { value: 'primeira_vez', label: 'Foi a primeira vez' },
    { value: 'as_vezes', label: 'Às vezes ou algumas vezes' },
    { value: 'quase_sempre', label: 'Quase sempre' }
  ],
  // DSP3
  natureza: [
    { value: 'compreensao_conceito', label: 'Compreensão do conceito' },
    { value: 'distracao', label: 'Distração' },
    { value: 'interpretacao_enunciado', label: 'Interpretação do enunciado' },
    { value: 'calculo_execucao', label: 'Cálculo ou execução' }
  ],
  // PEE1
  reacao: [
    { value: 'frustracao', label: 'Fica frustrado' },
    { value: 'indiferenca', label: 'Fica indiferente' },
    { value: 'busca_compreender', label: 'Quer entender o erro' },
    { value: 'ansiedade', label: 'Fica ansioso' },
    { value: 'variavel', label: 'Varia muito' }
  ],
  // PEE2
  relacao: [
    { value: 'confianca', label: 'Demonstra confiança' },
    { value: 'interesse', label: 'Demonstra interesse' },
    { value: 'desinteresse', label: 'Demonstra desinteresse' },
    { value: 'resistencia', label: 'Demonstra resistência' },
    { value: 'ansiedade_bloqueio', label: 'Demonstra ansiedade ou bloqueio' }
  ],
  // PEE3
  receptividade: [
    { value: 'boa', label: 'Recebe bem' },
    { value: 'depende_da_abordagem', label: 'Depende de como é dado' },
    { value: 'tende_a_resistir', label: 'Tende a resistir' }
  ]
};

// Componente controlado: as respostas vivem no App, nao aqui. Se ficassem aqui,
// um erro na geracao do feedback remontaria o componente e apagaria tudo.
export default function PedagogicalQuestionnaire({
  tipo,
  valores,
  onResposta,
  intencaoProfessor,
  onIntencaoProfessor,
  onSubmit,
  isSubmitting
}) {
  const correta = tipo === 'correta';
  const r = valores || {};

  const obrigatorias = correta
    ? ['momento_conteudo', 'profundidade_conteudo', 'estrategia_usada', 'acerto_esperado',
       'reacao_ao_erro', 'relacao_com_matematica', 'receptividade_feedback']
    : ['momento_conteudo', 'profundidade_conteudo', 'estrategia_usada', 'desempenho_geral',
       'frequencia_erro', 'natureza_erro', 'reacao_ao_erro', 'relacao_com_matematica',
       'receptividade_feedback'];

  const faltando = obrigatorias.filter((campo) => !r[campo]).length;
  const pronto = faltando === 0;

  function handleSubmit(event) {
    event.preventDefault();
    if (!pronto || isSubmitting) return;

    const questionario = {
      tipo,
      contexto_pedagogico: {
        momento_conteudo: r.momento_conteudo,
        profundidade_conteudo: r.profundidade_conteudo,
        estrategia_usada: r.estrategia_usada
      },
      perfil_emocional: {
        reacao_ao_erro: r.reacao_ao_erro,
        relacao_com_matematica: r.relacao_com_matematica,
        receptividade_feedback: r.receptividade_feedback
      },
      caso_correto: correta ? { acerto_esperado: r.acerto_esperado } : null,
      caso_incorreto: correta
        ? null
        : {
            desempenho_geral: r.desempenho_geral,
            frequencia_erro: r.frequencia_erro,
            natureza_erro: r.natureza_erro
          }
    };

    onSubmit(questionario, intencaoProfessor || '');
  }

  const pergunta = (campo, titulo, opcoes, direcao) => (
    <EscolhaUnica
      titulo={titulo}
      nome={campo}
      valor={r[campo] || ''}
      onChange={(valor) => onResposta(campo, valor)}
      opcoes={opcoes}
      direcao={direcao}
    />
  );

  return (
    <form className="cartao" onSubmit={handleSubmit} style={{ gap: '24px' }}>
      <Origem tipo="professor">Informado pelo professor</Origem>

      <p className="nota" style={{ margin: 0 }}>
        As perguntas marcadas com <span className="obrigatorio">*</span> são obrigatórias. Apenas o campo
        final é opcional.
      </p>

      <SecaoQuestionario titulo="Contexto pedagógico">
        {pergunta('momento_conteudo', 'Quando este conteúdo foi trabalhado?', OPCOES.momento)}
        {pergunta('profundidade_conteudo', 'O quanto este conteúdo foi trabalhado?', OPCOES.profundidade, 'column')}
        {pergunta('estrategia_usada', 'Como este conteúdo foi trabalhado em aula?', OPCOES.estrategia, 'column')}
      </SecaoQuestionario>

      <SecaoQuestionario titulo="Desempenho">
        {correta ? (
          pergunta('acerto_esperado', 'O acerto foi esperado para esse aluno?', OPCOES.acertoEsperado, 'column')
        ) : (
          <>
            {pergunta('desempenho_geral', 'Como é o desempenho geral desse aluno em matemática?', OPCOES.desempenho)}
            {pergunta('frequencia_erro', 'Com que frequência o aluno comete este erro?', OPCOES.frequencia)}
            {pergunta('natureza_erro', 'O erro parece ser de:', OPCOES.natureza, 'column')}
          </>
        )}
      </SecaoQuestionario>

      <SecaoQuestionario titulo="Perfil emocional estável">
        {pergunta('reacao_ao_erro', 'Como esse aluno costuma reagir quando erra?', OPCOES.reacao)}
        {pergunta('relacao_com_matematica', 'Como é a relação desse aluno com matemática?', OPCOES.relacao)}
        {pergunta('receptividade_feedback', 'Como esse aluno recebe o feedback do professor?', OPCOES.receptividade)}
      </SecaoQuestionario>

      <SecaoQuestionario titulo="Intenção do professor">
        <div className="campo">
          <label className="campo__rotulo" htmlFor="intencao_professor">
            Tem algo importante sobre esse aluno que devo considerar?{' '}
            <span className="nota">(opcional)</span>
          </label>
          <textarea
            id="intencao_professor"
            className="area"
            rows={3}
            maxLength={300}
            style={{ maxWidth: '720px' }}
            placeholder="Digite aqui"
            value={intencaoProfessor || ''}
            onChange={(event) => onIntencaoProfessor(event.target.value)}
          />
          <span className="nota">
            Campo opcional. Escreva no máximo 1 ou 2 frases. {(intencaoProfessor || '').length}/300
          </span>
        </div>
      </SecaoQuestionario>

      <hr className="regua" />

      <div className="acoes">
        <button type="submit" className="btn btn--primario" disabled={!pronto || isSubmitting}>
          {isSubmitting ? 'Gerando feedback...' : 'Gerar feedback'}
        </button>
        <span className="nota">
          {pronto
            ? 'Todas as perguntas respondidas.'
            : `${faltando} ${faltando === 1 ? 'pergunta ainda sem resposta' : 'perguntas ainda sem resposta'}`}
        </span>
      </div>
    </form>
  );
}
