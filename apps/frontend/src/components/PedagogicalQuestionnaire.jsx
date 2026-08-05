import { useState } from 'react';

function RadioGroup({ label, name, value, onChange, options }) {
  return (
    <fieldset className="option-group">
      <legend>{label}</legend>
      {options.map((option) => (
        <label key={option.value} className="option-row">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

function CheckboxGroup({ label, values, onToggle, options }) {
  return (
    <fieldset className="option-group">
      <legend>{label}</legend>
      {options.map((option) => (
        <label key={option.value} className="option-row">
          <input
            type="checkbox"
            checked={values.includes(option.value)}
            onChange={() => onToggle(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

export default function PedagogicalQuestionnaire({ tipo, onSubmit, isSubmitting }) {
  const [momentoConteudo, setMomentoConteudo] = useState('');
  const [estrategiasUsadas, setEstrategiasUsadas] = useState([]);
  const [reacaoAoErro, setReacaoAoErro] = useState('');
  const [relacaoComMatematica, setRelacaoComMatematica] = useState('');
  const [receptividadeFeedback, setReceptividadeFeedback] = useState('');
  const [acertoEsperado, setAcertoEsperado] = useState('');
  const [desempenhoGeral, setDesempenhoGeral] = useState('');
  const [frequenciaErro, setFrequenciaErro] = useState('');
  const [naturezaErro, setNaturezaErro] = useState('');
  const [intencaoProfessor, setIntencaoProfessor] = useState('');

  function toggleEstrategia(value) {
    setEstrategiasUsadas((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  const contextoPreenchido = Boolean(momentoConteudo) && estrategiasUsadas.length > 0;
  const perfilPreenchido = Boolean(reacaoAoErro && relacaoComMatematica && receptividadeFeedback);
  const casoPreenchido = tipo === 'correta'
    ? Boolean(acertoEsperado)
    : Boolean(desempenhoGeral && frequenciaErro && naturezaErro);
  const podeGerar = contextoPreenchido && perfilPreenchido && casoPreenchido;

  function handleSubmit(event) {
    event.preventDefault();
    if (!podeGerar) return;

    const questionario = {
      tipo,
      contexto_pedagogico: {
        momento_conteudo: momentoConteudo,
        estrategias_usadas: estrategiasUsadas
      },
      perfil_emocional: {
        reacao_ao_erro: reacaoAoErro,
        relacao_com_matematica: relacaoComMatematica,
        receptividade_feedback: receptividadeFeedback
      },
      caso_correto: tipo === 'correta' ? { acerto_esperado: acertoEsperado } : null,
      caso_incorreto: tipo === 'incorreta'
        ? { desempenho_geral: desempenhoGeral, frequencia_erro: frequenciaErro, natureza_erro: naturezaErro }
        : null
    };

    onSubmit(questionario, intencaoProfessor);
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h2>Questionário pedagógico</h2>

      <RadioGroup
        label="Quando este conteúdo foi trabalhado em aula?"
        name="momento_conteudo"
        value={momentoConteudo}
        onChange={setMomentoConteudo}
        options={[
          { value: 'recente', label: 'Foi visto recentemente' },
          { value: 'ja_trabalhado', label: 'Já foi bastante trabalhado' }
        ]}
      />

      <CheckboxGroup
        label="Como esse conteúdo foi trabalhado em aula?"
        values={estrategiasUsadas}
        onToggle={toggleEstrategia}
        options={[
          { value: 'explicacao_direta', label: 'Exposição direta explicação/lousa' },
          { value: 'resolucao_em_grupo', label: 'Resolução de problemas em grupo' },
          { value: 'atividade_pratica', label: 'Atividade prática/experimental' }
        ]}
      />

      {tipo === 'correta' ? (
        <RadioGroup
          label="O acerto foi esperado para esse aluno?"
          name="acerto_esperado"
          value={acertoEsperado}
          onChange={setAcertoEsperado}
          options={[
            { value: 'sim_esperado', label: 'Sim, é o esperado para ele' },
            { value: 'sim_com_dificuldade_usual', label: 'Sim, mas ele costuma ter dificuldade' },
            { value: 'nao_surpresa_positiva', label: 'Não, foi uma surpresa positiva' }
          ]}
        />
      ) : (
        <>
          <RadioGroup
            label="Como é o desempenho geral desse aluno em matemática?"
            name="desempenho_geral"
            value={desempenhoGeral}
            onChange={setDesempenhoGeral}
            options={[
              { value: 'abaixo_da_media', label: 'Abaixo da média' },
              { value: 'mediano', label: 'Na média' },
              { value: 'acima_da_media', label: 'Acima da média' }
            ]}
          />
          <RadioGroup
            label="Esse tipo de erro é frequente para ele?"
            name="frequencia_erro"
            value={frequenciaErro}
            onChange={setFrequenciaErro}
            options={[
              { value: 'frequente', label: 'Sim' },
              { value: 'as_vezes', label: 'Às vezes' },
              { value: 'primeira_vez', label: 'É a primeira vez' }
            ]}
          />
          <RadioGroup
            label="O erro parece ser de:"
            name="natureza_erro"
            value={naturezaErro}
            onChange={setNaturezaErro}
            options={[
              { value: 'compreensao_conceito', label: 'Compreensão do conceito' },
              { value: 'distracao', label: 'Distração' },
              { value: 'interpretacao_enunciado', label: 'Interpretação do enunciado' },
              { value: 'calculo_execucao', label: 'Cálculo/execução' }
            ]}
          />
        </>
      )}

      <RadioGroup
        label="Como esse aluno costuma reagir quando erra?"
        name="reacao_ao_erro"
        value={reacaoAoErro}
        onChange={setReacaoAoErro}
        options={[
          { value: 'frustracao', label: 'Fica frustrado' },
          { value: 'indiferenca', label: 'Fica indiferente' },
          { value: 'busca_compreender', label: 'Quer entender o erro' },
          { value: 'ansiedade', label: 'Fica ansioso' },
          { value: 'variavel', label: 'Varia muito' }
        ]}
      />

      <RadioGroup
        label="Como é a relação desse aluno com matemática?"
        name="relacao_com_matematica"
        value={relacaoComMatematica}
        onChange={setRelacaoComMatematica}
        options={[
          { value: 'confianca', label: 'Tem confiança' },
          { value: 'neutra', label: 'É neutro' },
          { value: 'resistencia', label: 'Tem resistência' },
          { value: 'ansiedade', label: 'Demonstra ansiedade' }
        ]}
      />

      <RadioGroup
        label="Esse aluno costuma receber bem o feedback do professor?"
        name="receptividade_feedback"
        value={receptividadeFeedback}
        onChange={setReceptividadeFeedback}
        options={[
          { value: 'boa', label: 'Sim, acolhe bem' },
          { value: 'depende_da_abordagem', label: 'Depende de como é dado' },
          { value: 'tende_a_resistir', label: 'Tende a resistir' }
        ]}
      />

      <label>
        Intenção do professor (opcional)
        <textarea
          rows={3}
          maxLength={1000}
          value={intencaoProfessor}
          onChange={(event) => setIntencaoProfessor(event.target.value)}
          placeholder="Tem algo importante sobre esse aluno que devo considerar?"
        />
      </label>

      <button type="submit" disabled={!podeGerar || isSubmitting}>
        Gerar feedback
      </button>
    </form>
  );
}
