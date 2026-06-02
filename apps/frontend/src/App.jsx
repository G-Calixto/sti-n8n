import { useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const initialForm = {
  teacherName: '',
  correctAnswer: '',
  image: null
};

const initialState = {
  view: 'inicio',
  form: initialForm,
  consentAccepted: false,
  submission: null,
  feedback: null,
  error: null
};

async function readApiResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.ok === false) {
    const details = data?.error?.details;
    const missingFields = details?.issues
      ?.map((issue) => issue.path || issue.message)
      .filter(Boolean)
      .join(', ');
    const expectedFields = details?.expected?.join(', ');
    const detailMessage = missingFields
      ? ` Campos com problema: ${missingFields}.`
      : expectedFields
        ? ` Campos esperados: ${expectedFields}.`
        : '';
    const message = `${data?.error?.message || 'Nao foi possivel concluir a operacao.'}${detailMessage}`;
    throw new Error(message);
  }
  return data;
}

function Loading({ text }) {
  return (
    <div className="loading" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <p>
      <strong>{label}: </strong>
      <span>{value || '-'}</span>
    </p>
  );
}

export default function App() {
  const [state, setState] = useState(initialState);

  const api = useMemo(() => API_BASE_URL.replace(/\/$/, ''), []);
  const isBusy = state.view === 'extraindo_imagem' || state.view === 'gerando_feedback';

  function updateForm(field, value) {
    setState((current) => ({
      ...current,
      form: {
        ...current.form,
        [field]: value
      }
    }));
  }

  function resetFlow() {
    setState(initialState);
  }

  async function submitExtraction(event) {
    event.preventDefault();

    if (!state.consentAccepted) {
      setState((current) => ({ ...current, view: 'erro', error: 'Aceite o termo LGPD antes de enviar.' }));
      return;
    }

    if (!state.form.image) {
      setState((current) => ({ ...current, view: 'erro', error: 'Selecione uma imagem da questao.' }));
      return;
    }

    const formData = new FormData();
    formData.append('teacherName', state.form.teacherName);
    formData.append('correctAnswer', state.form.correctAnswer);
    formData.append('consentAccepted', String(state.consentAccepted));
    formData.append('image', state.form.image);

    setState((current) => ({ ...current, view: 'extraindo_imagem', error: null }));

    try {
      const response = await fetch(`${api}/api/submissions/extract`, {
        method: 'POST',
        body: formData
      });
      const data = await readApiResponse(response);
      setState((current) => ({
        ...current,
        view: 'extracao_concluida',
        submission: data,
        feedback: null,
        error: null
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        view: current.submission ? 'extracao_concluida' : 'erro',
        error: error.message
      }));
    }
  }

  async function requestFeedback() {
    if (!state.submission?.submission_id) return;

    setState((current) => ({ ...current, view: 'gerando_feedback', error: null }));

    try {
      const response = await fetch(`${api}/api/submissions/${state.submission.submission_id}/feedback`, {
        method: 'POST'
      });
      const data = await readApiResponse(response);
      setState((current) => ({
        ...current,
        view: 'feedback_concluido',
        feedback: data,
        error: null
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        view: current.submission ? 'extracao_concluida' : 'erro',
        error: error.message
      }));
    }
  }

  const extraction = state.submission?.extracao;
  const preliminary = state.submission?.avaliacao_preliminar;
  const feedback = state.feedback?.avaliacao;

  return (
    <main className="app-shell">
      <section className="panel">
        <header className="header">
          <p className="eyebrow">MVP academico</p>
          <h1>Sistema Tutor Inteligente</h1>
          <p>
            Envie uma questao resolvida por imagem, extraia a resposta com n8n/Gemini e gere feedback pedagogico.
          </p>
        </header>

        {state.view === 'inicio' && (
          <div className="stack">
            <p>
              O fluxo protege os webhooks no backend e mantem os dados apenas em memoria durante este MVP.
            </p>
            <button type="button" onClick={() => setState((current) => ({ ...current, view: 'consentimento_lgpd' }))}>
              Comecar
            </button>
          </div>
        )}

        {state.view === 'consentimento_lgpd' && (
          <div className="stack">
            <h2>Termo LGPD simplificado</h2>
            <p>
              Este sistema e usado para pesquisa academica. Evite enviar imagens com dados pessoais de alunos.
              Ao continuar, voce confirma que entende essa orientacao.
            </p>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={state.consentAccepted}
                onChange={(event) => setState((current) => ({ ...current, consentAccepted: event.target.checked }))}
              />
              <span>Li e aceito o termo para uso academico.</span>
            </label>
            <button
              type="button"
              disabled={!state.consentAccepted}
              onClick={() => setState((current) => ({ ...current, view: 'formulario_submissao' }))}
            >
              Continuar
            </button>
          </div>
        )}

        {['formulario_submissao', 'extraindo_imagem', 'erro'].includes(state.view) && !state.submission && (
          <form className="stack" onSubmit={submitExtraction}>
            <h2>Enviar questao</h2>
            <label>
              Nome do professor
              <input
                required
                type="text"
                value={state.form.teacherName}
                onChange={(event) => updateForm('teacherName', event.target.value)}
              />
            </label>
            <label>
              Resposta correta
              <input
                required
                type="text"
                value={state.form.correctAnswer}
                onChange={(event) => updateForm('correctAnswer', event.target.value)}
              />
            </label>
            <label>
              Imagem da questao
              <input
                required
                type="file"
                accept="image/*"
                onChange={(event) => updateForm('image', event.target.files?.[0] || null)}
              />
            </label>
            <button type="submit" disabled={isBusy}>
              Enviar para extracao
            </button>
            {state.view === 'extraindo_imagem' && <Loading text="Extraindo enunciado da questao..." />}
          </form>
        )}

        {state.error && (
          <div className="error-box" role="alert">
            {state.error}
          </div>
        )}

        {extraction && (
          <section className="result-section">
            <h2>Extracao da imagem</h2>
            <Field label="Enunciado" value={extraction.enunciado} />
            <Field label="Desenvolvimento do aluno" value={extraction.desenvolvimento_aluno} />
            <Field label="Resposta do aluno" value={extraction.resposta_aluno} />
            <Field label="Legibilidade" value={extraction.legibilidade} />
            <Field label="Confianca da extracao" value={extraction.confianca_extracao} />
            <Field label="Observacoes" value={extraction.observacoes} />
            <Field label="Resultado preliminar" value={preliminary?.resposta_correta ? 'correta' : 'incorreta'} />

            {state.view === 'gerando_feedback' && <Loading text="Gerando feedback pedagogico..." />}

            {!feedback && state.view !== 'gerando_feedback' && (
              <button type="button" onClick={requestFeedback} disabled={isBusy}>
                Visualizar feedback
              </button>
            )}
          </section>
        )}

        {feedback && (
          <section className="result-section">
            <h2>Feedback pedagogico</h2>
            <Field label="Feedback para o aluno" value={feedback.feedback_aluno} />
            <Field label="Feedback para o professor" value={feedback.feedback_professor} />
            <Field label="Tipo de erro" value={feedback.tipo_erro} />
            <Field label="Resumo do erro" value={feedback.resumo_erro} />
            <Field label="Dica de proxima acao" value={feedback.dica_proxima_acao} />
            <Field label="Confianca do feedback" value={feedback.confianca_feedback} />
            <button type="button" onClick={resetFlow}>
              Nova submissao
            </button>
          </section>
        )}
      </section>
    </main>
  );
}
