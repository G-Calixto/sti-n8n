import { useState } from 'react';

export default function FeedbackReview({
  feedbackAluno,
  feedbackGeneration,
  aprovado,
  isSubmitting,
  onChange,
  onAprovar,
  onPedirNovaVersao
}) {
  const [instrucaoRegeneracao, setInstrucaoRegeneracao] = useState('');

  return (
    <div className="stack">
      <h2>Feedback pedagógico</h2>
      <p className="muted">Versão {feedbackGeneration || 1}</p>

      <label>
        Feedback para o aluno
        <textarea
          rows={6}
          value={feedbackAluno}
          onChange={(event) => onChange(event.target.value)}
          disabled={isSubmitting || aprovado}
        />
      </label>

      {aprovado ? (
        <p className="approved-note">Feedback aprovado.</p>
      ) : (
        <>
          <div className="button-row">
            <button
              type="button"
              onClick={() => onAprovar(feedbackAluno)}
              disabled={isSubmitting || !feedbackAluno.trim()}
            >
              Aprovar
            </button>
          </div>

          <label>
            Instrução para nova versão (opcional)
            <textarea
              rows={2}
              value={instrucaoRegeneracao}
              onChange={(event) => setInstrucaoRegeneracao(event.target.value)}
              placeholder="Ex.: criar uma versão mais curta e com uma pergunta orientadora"
            />
          </label>
          <div className="button-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => onPedirNovaVersao(instrucaoRegeneracao)}
              disabled={isSubmitting}
            >
              Pedir nova versão
            </button>
          </div>
        </>
      )}
    </div>
  );
}
