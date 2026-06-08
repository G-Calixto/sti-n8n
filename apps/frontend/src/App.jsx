import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const initialForm = {
  correctAnswer: '',
  image: null
};

const initialState = {
  view: 'inicio',
  form: initialForm,
  consentAccepted: false,
  consentScrolledToEnd: false,
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
    const message = `${data?.error?.message || 'Não foi possível concluir a operação.'}${detailMessage}`;
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
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  const api = useMemo(() => API_BASE_URL.replace(/\/$/, ''), []);
  const isBusy = state.view === 'extraindo_imagem' || state.view === 'gerando_feedback';
  const hasSubmittedContext = Boolean(state.form.image || state.form.correctAnswer);

  useEffect(() => {
    if (!state.form.image) {
      setImagePreviewUrl('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(state.form.image);
    setImagePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [state.form.image]);

  function updateForm(field, value) {
    setState((current) => ({
      ...current,
      form: {
        ...current.form,
        [field]: value
      }
    }));
  }

  function handleImageChange(event) {
    updateForm('image', event.target.files?.[0] || null);
  }

  function resetFlow() {
    setState(initialState);
  }

  function handleConsentScroll(event) {
    const element = event.currentTarget;
    const reachedEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - 4;

    if (!reachedEnd || state.consentScrolledToEnd) return;

    setState((current) => ({
      ...current,
      consentScrolledToEnd: true
    }));
  }

  async function submitExtraction(event) {
    event.preventDefault();

    if (!state.consentAccepted) {
      setState((current) => ({ ...current, view: 'erro', error: 'Aceite o termo LGPD antes de enviar.' }));
      return;
    }

    if (!state.form.image) {
      setState((current) => ({ ...current, view: 'erro', error: 'Selecione uma imagem da questão.' }));
      return;
    }

    const formData = new FormData();
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
  const shouldShowContext = hasSubmittedContext && state.view !== 'inicio' && state.view !== 'consentimento_lgpd';
  const shouldShowExtraction = extraction && !feedback;

  return (
    <main className="app-shell">
      <section className="panel">
        <header className="header">
          <p className="eyebrow">MVP acadêmico</p>
          <h1>Sistema Tutor Inteligente</h1>
          <p>
            Envie uma imagem de uma questão com sua resolução e nós geraremos o feedback para o aluno.
          </p>
        </header>

        {state.view === 'inicio' && (
          <div className="stack">
            <button
              type="button"
              onClick={() =>
                setState((current) => ({
                  ...current,
                  consentScrolledToEnd: false,
                  view: 'consentimento_lgpd'
                }))
              }
            >
              Começar
            </button>
          </div>
        )}

        {state.view === 'consentimento_lgpd' && (
          <div className="stack">
            <article className="consent-term" onScroll={handleConsentScroll}>
              <h3>Termo de Consentimento Livre e Esclarecido</h3>

              <p>
                Você está sendo convidado para participar da pesquisa "Correção de Questões de Matemática Manuscritas
                com Auxílio de um Sistema Tutor Inteligente (STI)".
              </p>

              <p>Esta pesquisa tem como intuito:</p>
              <ol>
                <li>
                  compreender e desenvolver um processo para a elaboração de feedbacks baseado na experiência do
                  professor(a) para alunos do Ensino Fundamental no contexto do ensino de Matemática; e
                </li>
                <li>
                  desenvolver habilidades básicas de Matemática dos estudantes do Ensino Fundamental brasileiro.
                </li>
              </ol>

              <p>
                A pesquisa está centrada em duas etapas principais: conceber e avaliar um STI para automatizar a
                correção de questões de Matemática manuscritas, conforme o objetivo descrito acima. Nesse contexto,
                você irá nos ajudar a entender sua prática docente, bem como seus objetivos, desafios, problemas e
                limitações encontradas em sua jornada de trabalho.
              </p>

              <p>Sua participação é livre.</p>

              <p>
                Os benefícios de sua participação serão colaborar para o avanço na ciência, no que diz respeito à
                concepção, implementação, avaliação e uso de um STI como forma de apoio ao processo de ensino e
                aprendizagem de Matemática no contexto do Ensino Fundamental brasileiro, bem como ao uso de uma
                tecnologia educacional durante suas aulas.
              </p>

              <p>
                A sua participação neste estudo envolve riscos mínimos, como a violação de privacidade. Para mitigar
                tal violação, todos os dados coletados serão armazenados de forma segura, sigilosa e anônima.
              </p>

              <p>
                A sua participação nesse estudo é voluntária. Você não terá nenhum benefício financeiro por participar
                desse estudo, podendo recusar-se a participar ou retirar seu consentimento, em qualquer fase da
                pesquisa, sem penalização alguma.
              </p>

              <p>A qualquer momento você pode desistir de participar e retirar seu consentimento.</p>

              <p>
                Sua recusa não trará nenhum prejuízo em relação às instituições e pesquisadores envolvidos nesse
                estudo.
              </p>

              <p>
                Sua participação envolverá participar de uma entrevista semiestruturada e pode ser realizada conforme
                sua disponibilidade e preferências. Em todos os momentos, não é obrigatório que você responda a todas
                as perguntas feitas, se assim você desejar.
              </p>

              <p>
                Antes e durante o curso da pesquisa, você poderá solicitar esclarecimentos a respeito dos procedimentos
                ou qualquer outra questão relacionada com a pesquisa. A pesquisadora responsável estará disponível para
                esclarecer suas dúvidas.
              </p>

              <p>
                Caso sejam identificados e comprovados danos provenientes desta pesquisa, você tem assegurado o direito
                à assistência e indenização.
              </p>

              <p>Você poderá receber assistência integral e imediata por danos, de forma gratuita.</p>

              <p>Você poderá requerer indenização por danos.</p>

              <p>Você poderá receber ressarcimento de gastos, incluindo os gastos de acompanhantes.</p>

              <p>Seus dados pessoais envolvidos na pesquisa serão confidenciais.</p>

              <p>
                Os dados coletados no estudo serão analisados e todos os participantes receberão pelo e-mail informado,
                caso haja interesse, os resultados da análise dos dados coletados, por meio de artigo publicado.
              </p>

              <p>
                Toda e qualquer informação coletada durante o estudo é tratada como confidencial. Os dados não serão
                divulgados de forma a possibilitar sua identificação e serão mantidos em uma base de dados protegida.
              </p>

              <p>
                Os resultados obtidos através desta pesquisa serão utilizados para conceber, desenvolver e avaliar um
                STI que automatiza a correção de questões de Matemática manuscritas e busca desenvolver habilidades
                básicas de Matemática dos estudantes do Ensino Fundamental brasileiro.
              </p>

              <p>Ao aceitar participar da pesquisa, você deverá:</p>
              <ol>
                <li>Aceitar participar da pesquisa, o que corresponderá à assinatura do TCLE de forma eletrônica.</li>
                <li>Participar das atividades descritas no item 8, conforme sua disponibilidade.</li>
              </ol>

              <p>O presente documento segue as normas da Resolução CNS Nº 510/2016.</p>

              <h3>Contato</h3>
              <p>No caso de haver dúvidas sobre aspectos éticos desse estudo, você poderá consultar:</p>
              <p>
                <strong>Pesquisadora Responsável:</strong> Laíza Ribeiro Silva
              </p>
              <p>
                <strong>Endereço:</strong> Universidade de São Paulo, Instituto de Ciências Matemáticas e de
                Computação, Avenida Trabalhador são-carlense, 400, Centro, 13566590 - São Carlos, SP - Brasil
              </p>
              <p>
                <strong>E-mail:</strong> laizaribeiro@usp.br
              </p>
              <p>
                <strong>Telefone para contato:</strong> +55 16 33736720
              </p>

              <h3>Para contato com o CEP/EACH</h3>
              <p>
                <strong>Comitê de Ética em Pesquisa - CEP/EACH</strong>
              </p>
              <p>Av. Arlindo Béttio, 1000, Ermelino Matarazzo, São Paulo-SP</p>
              <p>
                <strong>Telefone:</strong> (11) 3091-1046
              </p>
              <p>
                <strong>E-mail:</strong> cep-each@usp.br
              </p>
              <p>
                <strong>Atendimento:</strong> segundas às sextas-feiras, das 09:00 às 11:00 e das 14:00 às 16:00.
                Localização: Prédio I1, sala T14.
              </p>

              <p className="consent-acceptance">
                Ao clicar em "Próxima", eu concordo com todos os termos da pesquisa descritos acima.
              </p>
            </article>

            {!state.consentScrolledToEnd && (
              <p className="consent-scroll-note">Role até o final do termo de consentimento para prosseguir.</p>
            )}

            <button
              type="button"
              disabled={!state.consentScrolledToEnd}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  consentAccepted: true,
                  view: 'formulario_submissao'
                }))
              }
            >
              Próxima
            </button>
          </div>
        )}

        {['formulario_submissao', 'extraindo_imagem', 'erro'].includes(state.view) && !state.submission && (
          <form className="stack" onSubmit={submitExtraction}>
            <h2>Enviar questão</h2>
            <label>
              Imagem da questão
              <input
                required
                type="file"
                accept="image/*"
                onChange={handleImageChange}
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
            <button type="submit" disabled={isBusy}>
              Enviar para extração
            </button>
            {state.view === 'extraindo_imagem' && <Loading text="Extraindo enunciado da questão..." />}
          </form>
        )}

        {state.error && (
          <div className="error-box" role="alert">
            {state.error}
          </div>
        )}

        {shouldShowContext && (
          <section className="context-section">
            <h2>Dados da submissão</h2>
            {imagePreviewUrl ? (
              <img className="image-preview" src={imagePreviewUrl} alt="Preview da imagem enviada" />
            ) : (
              <p className="muted">Nenhuma imagem selecionada.</p>
            )}
            <Field label="Resposta correta informada" value={state.form.correctAnswer} />
          </section>
        )}

        {shouldShowExtraction && (
          <section className="result-section">
            <h2>Extração da imagem</h2>
            <Field label="Enunciado" value={extraction.enunciado} />
            <Field label="Desenvolvimento do aluno" value={extraction.desenvolvimento_aluno} />
            <Field label="Resposta do aluno" value={extraction.resposta_aluno} />
            <Field label="Legibilidade" value={extraction.legibilidade} />
            <Field label="Observações" value={extraction.observacoes} />
            <Field label="Resultado preliminar" value={preliminary?.resposta_correta ? 'correta' : 'incorreta'} />

            {state.view === 'gerando_feedback' && <Loading text="Gerando feedback pedagógico..." />}

            {!feedback && state.view !== 'gerando_feedback' && (
              <div className="button-row">
                <button type="button" className="secondary-button" onClick={resetFlow}>
                  Reiniciar processo
                </button>
                <button type="button" onClick={requestFeedback} disabled={isBusy}>
                  Visualizar feedback
                </button>
              </div>
            )}
          </section>
        )}

        {feedback && (
          <section className="result-section">
            <h2>Feedback pedagógico</h2>
            <Field label="Feedback para o aluno" value={feedback.feedback_aluno} />
            <Field label="Dica de próxima ação" value={feedback.dica_proxima_acao} />
            <button type="button" onClick={resetFlow}>
              Reiniciar processo
            </button>
          </section>
        )}
      </section>
    </main>
  );
}
