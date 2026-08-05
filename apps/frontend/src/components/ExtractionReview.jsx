function Field({ label, value }) {
  return (
    <p>
      <strong>{label}: </strong>
      <span>{value || '-'}</span>
    </p>
  );
}

export default function ExtractionReview({ extracao, avaliacao, isSaving, onFieldChange, onConfirm, onContinuar }) {
  return (
    <div className="stack">
      <h2>Revisão da extração</h2>

      <label>
        Enunciado da questão
        <textarea
          rows={3}
          value={extracao.enunciado}
          onChange={(event) => onFieldChange('enunciado', event.target.value)}
        />
      </label>

      <label>
        Desenvolvimento do aluno
        <textarea
          rows={3}
          value={extracao.desenvolvimento_aluno}
          onChange={(event) => onFieldChange('desenvolvimento_aluno', event.target.value)}
        />
      </label>

      <label>
        Resposta do aluno
        <input
          type="text"
          value={extracao.resposta_aluno}
          onChange={(event) => onFieldChange('resposta_aluno', event.target.value)}
        />
      </label>

      <Field label="Legibilidade" value={extracao.legibilidade} />
      <Field label="Confiança da extração" value={`${Math.round(Number(extracao.confianca_extracao || 0) * 100)}%`} />
      <Field label="Observações" value={extracao.observacoes} />

      {Number(extracao.confianca_extracao || 0) < 0.7 && (
        <p className="muted">Confiança da extração baixa — revise os campos com atenção antes de confirmar.</p>
      )}

      {!avaliacao && (
        <div className="button-row">
          <button type="button" onClick={onConfirm} disabled={isSaving}>
            Confirmar extração
          </button>
        </div>
      )}

      {isSaving && <p className="muted">Recalculando resultado...</p>}

      {avaliacao && (
        <>
          <Field label="Resultado oficial" value={avaliacao.status === 'correta' ? 'CORRETA' : 'INCORRETA'} />
          <div className="button-row">
            <button type="button" onClick={onContinuar}>
              Continuar para o questionário
            </button>
          </div>
        </>
      )}
    </div>
  );
}
