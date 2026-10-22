import { useEffect, useMemo, useRef, useState } from 'react';
import ExtractionReview from './components/ExtractionReview';
import PedagogicalQuestionnaire from './components/PedagogicalQuestionnaire';
import FeedbackReview from './components/FeedbackReview';
import TermoConsentimento from './components/TermoConsentimento';
import { Aviso, Carregando, Etapas, FotoFolha, Origem, Selo, Topo } from './components/ui';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const TAMANHO_MAXIMO_MB = 10;

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
  extractionDraft: null,
  avaliacaoOficial: null,
  // As respostas do questionario moram aqui, e nao dentro do componente, porque
  // um erro na geracao do feedback volta para a view 'questionario' e remonta o
  // componente. Com o estado local, tudo que a professora respondeu se perdia.
  questionarioRespostas: {},
  intencaoProfessor: '',
  feedback: null,
  feedbackDraft: '',
  feedbackAprovado: false,
  feedbackActionBusy: false,
  arquivoRecusado: null,
  error: null
};

// Etapa do indicador por view. As telas de abertura ficam fora das etapas.
const ETAPA_POR_VIEW = {
  formulario_submissao: 1,
  revisao_submissao: 1,
  extraindo_imagem: 1,
  revisao_extracao: 2,
  salvando_revisao: 2,
  questionario: 3,
  gerando_feedback: 4,
  feedback_concluido: 4
};

async function readApiResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.ok === false) {
    const details = data?.error?.details;
    // issue.path vem como array do zod. Sem juntar, a mensagem saia como
    // "questionario,perfil_emocional,relacao_com_matematica" e sem dizer o motivo.
    const problemas = (details?.issues || [])
      .map((issue) => {
        const caminho = Array.isArray(issue.path) ? issue.path.join('.') : issue.path;
        if (caminho && issue.message) return `${caminho} (${issue.message})`;
        return caminho || issue.message;
      })
      .filter(Boolean);
    const expectedFields = details?.expected?.join(', ');
    const detailMessage = problemas.length
      ? ` Campos com problema: ${problemas.join('; ')}`
      : expectedFields
        ? ` Campos esperados: ${expectedFields}.`
        : '';
    const message = `${data?.error?.message || 'Não foi possível concluir a operação.'}${detailMessage}`;
    throw new Error(message);
  }
  return data;
}

function formatarMB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export default function App() {
  const [state, setState] = useState(initialState);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const inputArquivo = useRef(null);

  const api = useMemo(() => API_BASE_URL.replace(/\/$/, ''), []);

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
      form: { ...current.form, [field]: value }
    }));
  }

  function handleImageChange(event) {
    const arquivo = event.target.files?.[0] || null;
    if (event.target) event.target.value = '';
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      setState((current) => ({
        ...current,
        form: { ...current.form, image: null },
        arquivoRecusado: {
          titulo: 'Este arquivo não é uma imagem',
          texto: 'Envie uma foto em JPG ou PNG.',
          nome: arquivo.name
        }
      }));
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      setState((current) => ({
        ...current,
        form: { ...current.form, image: null },
        arquivoRecusado: {
          titulo: `A imagem tem ${formatarMB(arquivo.size)} e o limite é ${TAMANHO_MAXIMO_MB} MB`,
          texto: 'Reduza a resolução ou tire a foto novamente.',
          nome: arquivo.name
        }
      }));
      return;
    }

    setState((current) => ({
      ...current,
      form: { ...current.form, image: arquivo },
      arquivoRecusado: null,
      error: null
    }));
  }

  function resetFlow() {
    setState(initialState);
  }

  function handleConsentScroll(event) {
    const element = event.currentTarget;
    const reachedEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - 4;

    if (!reachedEnd || state.consentScrolledToEnd) return;

    setState((current) => ({ ...current, consentScrolledToEnd: true }));
  }

  async function confirmSubmissionAndExtract() {
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
        view: 'revisao_extracao',
        submission: data,
        extractionDraft: { ...data.extracao },
        avaliacaoOficial: null,
        error: null
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        view: 'erro_leitura',
        error: error.message
      }));
    }
  }

  function handleExtractionFieldChange(field, value) {
    setState((current) => ({
      ...current,
      extractionDraft: { ...current.extractionDraft, [field]: value },
      avaliacaoOficial: null
    }));
  }

  async function confirmExtraction() {
    setState((current) => ({ ...current, view: 'salvando_revisao', error: null }));

    try {
      const response = await fetch(`${api}/api/submissions/${state.submission.submission_id}/extraction`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extracao: state.extractionDraft })
      });
      const data = await readApiResponse(response);
      setState((current) => ({
        ...current,
        view: 'revisao_extracao',
        extractionDraft: data.extracao,
        avaliacaoOficial: data.avaliacao,
        error: null
      }));
    } catch (error) {
      setState((current) => ({ ...current, view: 'revisao_extracao', error: error.message }));
    }
  }

  function goToQuestionario() {
    setState((current) => ({ ...current, view: 'questionario', error: null }));
  }

  function handleRespostaQuestionario(campo, valor) {
    setState((current) => ({
      ...current,
      questionarioRespostas: { ...current.questionarioRespostas, [campo]: valor }
    }));
  }

  function handleIntencaoProfessor(texto) {
    setState((current) => ({ ...current, intencaoProfessor: texto }));
  }

  async function submitQuestionario(questionario, intencaoProfessor) {
    setState((current) => ({
      ...current,
      view: 'gerando_feedback',
      error: null
    }));

    try {
      const response = await fetch(`${api}/api/submissions/${state.submission.submission_id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionario,
          intencao_professor: intencaoProfessor,
          regenerar: false,
          instrucao_regeneracao: ''
        })
      });
      const data = await readApiResponse(response);
      setState((current) => ({
        ...current,
        view: 'feedback_concluido',
        feedback: data,
        feedbackDraft: data.avaliacao.feedback_aluno,
        feedbackAprovado: false,
        error: null
      }));
    } catch (error) {
      setState((current) => ({ ...current, view: 'questionario', error: error.message }));
    }
  }

  function handleFeedbackChange(text) {
    setState((current) => ({ ...current, feedbackDraft: text }));
  }

  async function aprovarFeedback(textoFinal) {
    setState((current) => ({ ...current, feedbackActionBusy: true, error: null }));

    try {
      const response = await fetch(
        `${api}/api/submissions/${state.submission.submission_id}/feedback/approval`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedback_aluno: textoFinal })
        }
      );
      const data = await readApiResponse(response);
      setState((current) => ({
        ...current,
        feedbackActionBusy: false,
        feedbackAprovado: true,
        feedbackDraft: data.avaliacao.feedback_aluno,
        error: null
      }));
    } catch (error) {
      setState((current) => ({ ...current, feedbackActionBusy: false, error: error.message }));
    }
  }

  async function pedirNovaVersao(instrucaoRegeneracao) {
    setState((current) => ({ ...current, feedbackActionBusy: true, error: null }));

    try {
      const response = await fetch(`${api}/api/submissions/${state.submission.submission_id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionario: {},
          intencao_professor: state.intencaoProfessor,
          regenerar: true,
          instrucao_regeneracao: instrucaoRegeneracao
        })
      });
      const data = await readApiResponse(response);
      setState((current) => ({
        ...current,
        feedbackActionBusy: false,
        feedback: data,
        feedbackDraft: data.avaliacao.feedback_aluno,
        feedbackAprovado: false,
        error: null
      }));
    } catch (error) {
      // preserva o feedback anterior visivel em caso de falha na regeneracao
      setState((current) => ({ ...current, feedbackActionBusy: false, error: error.message }));
    }
  }

  const etapa = ETAPA_POR_VIEW[state.view];
  const identificador = state.submission?.submission_id || '';
  const podeEnviar = Boolean(state.form.image) && Boolean(state.form.correctAnswer.trim());

  return (
    <div className="tela">
      <Topo identificador={identificador} />
      {etapa && <Etapas atual={etapa} />}

      {/* ───────── Tela 1: início ───────── */}
      {state.view === 'inicio' && (
        <main className="pagina" style={{ paddingTop: '88px' }}>
          <div className="pagina__interno">
            <h1 className="titulo-abertura">SGFE</h1>
            <div className="topo__sub" style={{ maxWidth: '640px', lineHeight: 1.9 }}>
              Sistema de Geração de Feedback Educacional para Sistemas Tutores Inteligentes Desplugados
            </div>
            <hr className="regua" />
            <p className="lede" style={{ maxWidth: '720px' }}>
              Você fotografa a questão resolvida pelo aluno e informa a resposta correta. O sistema lê a
              folha, você confere a leitura, responde algumas perguntas sobre o aluno e recebe um texto de
              feedback para revisar e aprovar.
            </p>
            <div>
              <button
                type="button"
                className="btn btn--primario btn--grande"
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    consentScrolledToEnd: false,
                    view: 'consentimento_lgpd'
                  }))
                }
              >
                Iniciar correção
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ───────── Tela 2: consentimento ───────── */}
      {state.view === 'consentimento_lgpd' && (
        <main className="pagina">
          <div className="pagina__interno pagina__interno--estreito">
            <h1 className="h1">Termo de Consentimento Livre e Esclarecido</h1>

            <div className="termo" onScroll={handleConsentScroll}>
              <TermoConsentimento />
            </div>

            <p className="nota" style={{ margin: 0 }}>
              {state.consentScrolledToEnd
                ? 'Termo lido até o final.'
                : 'Role o termo até o final para habilitar o aceite.'}
            </p>

            <label
              className={`aceite ${state.consentScrolledToEnd ? 'aceite--liberado' : ''}`}
            >
              <input
                type="checkbox"
                disabled={!state.consentScrolledToEnd}
                checked={state.consentAccepted}
                onChange={(event) =>
                  setState((current) => ({ ...current, consentAccepted: event.target.checked }))
                }
              />
              <span className="aceite__caixa" aria-hidden="true">
                {state.consentAccepted ? '✓' : ''}
              </span>
              <span>Li e concordo com o termo de consentimento.</span>
            </label>

            <div>
              <button
                type="button"
                className="btn btn--primario"
                disabled={!state.consentScrolledToEnd || !state.consentAccepted}
                onClick={() => setState((current) => ({ ...current, view: 'formulario_submissao' }))}
              >
                Aceitar e continuar
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ───────── Tela 3: envio ───────── */}
      {state.view === 'formulario_submissao' && (
        <main className="pagina">
          <div className="pagina__interno">
            <div>
              <h2 className="h2">Envie a foto da questão</h2>
              <p className="apoio" style={{ marginTop: '6px' }}>
                Uma questão por correção. A leitura da folha é conferida por você na etapa seguinte.
              </p>
            </div>

            {state.arquivoRecusado && (
              <Aviso
                tipo="falha"
                titulo={state.arquivoRecusado.titulo}
                texto={state.arquivoRecusado.texto}
                acao="Escolher outra foto"
                onAcao={() => inputArquivo.current?.click()}
              />
            )}

            <div className="cartao" style={{ gap: '24px' }}>
              <Origem tipo="professor">Informado pelo professor</Origem>

              {state.form.image ? (
                <div className="linha-entre">
                  <div style={{ width: '120px', flex: 'none' }}>
                    <FotoFolha src={imagePreviewUrl} altura="96px" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="campo__rotulo">{state.form.image.name}</div>
                    <div className="nota">{formatarMB(state.form.image.size)} · pronta para envio</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn--texto"
                    onClick={() => updateForm('image', null)}
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className={`solta ${state.arquivoRecusado ? 'solta--erro' : ''}`}>
                  <div className="solta__titulo">Arraste a foto da folha ou selecione um arquivo</div>
                  <div className="nota" style={{ maxWidth: '520px' }}>
                    Uma imagem, uma questão, com enunciado e resposta do aluno na mesma foto. Até{' '}
                    {TAMANHO_MAXIMO_MB} MB.
                  </div>
                  <button
                    type="button"
                    className="btn btn--contorno"
                    style={{ marginTop: '12px' }}
                    onClick={() => inputArquivo.current?.click()}
                  >
                    Selecionar arquivo
                  </button>
                </div>
              )}

              <input
                ref={inputArquivo}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />

              <div className="campo campo--medio">
                <label className="campo__rotulo" htmlFor="correctAnswer">
                  Resposta correta da questão
                </label>
                <input
                  id="correctAnswer"
                  type="text"
                  className="entrada"
                  value={state.form.correctAnswer}
                  onChange={(event) => updateForm('correctAnswer', event.target.value)}
                />
                <span className="nota">
                  Digite apenas a resposta final esperada. Ela não será mostrada ao aluno no feedback.
                </span>
              </div>
            </div>

            <div className="acoes">
              <button
                type="button"
                className="btn btn--primario"
                disabled={!podeEnviar}
                onClick={() => setState((current) => ({ ...current, view: 'revisao_submissao' }))}
              >
                Continuar
              </button>
              {!podeEnviar && (
                <span className="nota">
                  {state.form.image
                    ? 'Informe a resposta correta para continuar.'
                    : 'Envie a foto para continuar.'}
                </span>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ───────── Tela 4: conferência antes do envio ───────── */}
      {state.view === 'revisao_submissao' && (
        <main className="pagina">
          <div className="pagina__interno">
            <div>
              <h2 className="h2">Confira antes de enviar para leitura</h2>
              <p className="apoio" style={{ marginTop: '6px' }}>
                Depois da leitura você ainda poderá corrigir cada campo.
              </p>
            </div>

            <div className="grade-confere">
              <div className="cartao">
                <Origem tipo="professor">Informado pelo professor</Origem>
                <FotoFolha src={imagePreviewUrl} altura="240px" />
                <div className="linha-entre">
                  <span className="nota">
                    {state.form.image?.name} · {state.form.image ? formatarMB(state.form.image.size) : ''}
                  </span>
                  <button
                    type="button"
                    className="btn btn--texto"
                    onClick={() => setState((current) => ({ ...current, view: 'formulario_submissao' }))}
                  >
                    Trocar imagem
                  </button>
                </div>
              </div>

              <div className="coluna">
                <div className="cartao">
                  <Origem tipo="professor">Informado pelo professor</Origem>
                  <div className="linha-entre" style={{ alignItems: 'flex-end' }}>
                    <div>
                      <div className="nota">Resposta correta da questão</div>
                      <div className="valor-fixo" style={{ marginTop: '6px' }}>
                        {state.form.correctAnswer}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn--texto"
                      onClick={() => setState((current) => ({ ...current, view: 'formulario_submissao' }))}
                    >
                      Editar
                    </button>
                  </div>
                  <span className="nota">Não será mostrada ao aluno no feedback.</span>
                </div>

                <div className="acoes">
                  <button
                    type="button"
                    className="btn btn--contorno"
                    onClick={() => setState((current) => ({ ...current, view: 'formulario_submissao' }))}
                  >
                    Voltar
                  </button>
                  <button type="button" className="btn btn--primario" onClick={confirmSubmissionAndExtract}>
                    Enviar para leitura
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ───────── Tela 5: lendo a folha ───────── */}
      {state.view === 'extraindo_imagem' && (
        <main className="pagina pagina--centrada">
          <Carregando
            origem="Lido pela IA"
            titulo="Lendo a folha do aluno"
            texto="Isso costuma levar alguns segundos. Não feche esta janela."
          />
        </main>
      )}

      {/* ───────── Erro de tela cheia na leitura ───────── */}
      {state.view === 'erro_leitura' && (
        <main className="pagina">
          <div className="pagina__interno pagina__interno--estreito">
            <Aviso
              tipo="falha"
              titulo="Não foi possível concluir a leitura da folha"
              texto={`${state.error} A submissão foi preservada: tente novamente ou envie outra foto da mesma folha.`}
            />
            <div className="acoes">
              <button type="button" className="btn btn--primario" onClick={confirmSubmissionAndExtract}>
                Tentar novamente
              </button>
              <button
                type="button"
                className="btn btn--contorno"
                onClick={() => setState((current) => ({ ...current, view: 'formulario_submissao' }))}
              >
                Trocar imagem
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ───────── Tela 6: revisão da leitura ───────── */}
      {['revisao_extracao', 'salvando_revisao'].includes(state.view) && (
        <main className="pagina">
          <div className="pagina__interno">
            {state.error && <Aviso tipo="falha" titulo="Não foi possível apurar o resultado" texto={state.error} />}
            <ExtractionReview
              extracao={state.extractionDraft}
              avaliacao={state.avaliacaoOficial}
              correctAnswer={state.form.correctAnswer}
              imagemUrl={imagePreviewUrl}
              isSaving={state.view === 'salvando_revisao'}
              onFieldChange={handleExtractionFieldChange}
              onConfirm={confirmExtraction}
              onContinuar={goToQuestionario}
            />
          </div>
        </main>
      )}

      {/* ───────── Tela 8: questionário ───────── */}
      {state.view === 'questionario' && (
        <main className="pagina">
          <div className="pagina__interno">
            <div className="resultado-cabeca">
              <div style={{ maxWidth: '680px' }}>
                <h2 className="h2">Sobre o aluno e a aula</h2>
                <p className="apoio" style={{ marginTop: '6px' }}>
                  Estas respostas ajustam o tom e o conteúdo do feedback. Elas descrevem o aluno, não são um
                  diagnóstico.
                </p>
              </div>
              <div className="resultado-cabeca__selo">
                <Selo status={state.avaliacaoOficial?.status} />
                <span className="mono">
                  esperado: {state.form.correctAnswer} · aluno: {state.extractionDraft?.resposta_aluno}
                </span>
              </div>
            </div>

            {state.error && <Aviso tipo="falha" titulo="Não foi possível gerar o feedback" texto={state.error} />}

            <PedagogicalQuestionnaire
              tipo={state.avaliacaoOficial?.status}
              valores={state.questionarioRespostas}
              onResposta={handleRespostaQuestionario}
              intencaoProfessor={state.intencaoProfessor}
              onIntencaoProfessor={handleIntencaoProfessor}
              onSubmit={submitQuestionario}
              isSubmitting={false}
            />
          </div>
        </main>
      )}

      {/* ───────── Tela 9: gerando feedback ───────── */}
      {state.view === 'gerando_feedback' && (
        <main className="pagina pagina--centrada">
          <Carregando
            origem="Redigido pela IA"
            titulo="Escrevendo o feedback"
            texto="O texto vai chegar para você revisar e aprovar antes de qualquer coisa."
          />
        </main>
      )}

      {/* ───────── Tela 10: aprovação ───────── */}
      {state.view === 'feedback_concluido' && (
        <main className="pagina">
          <div className="pagina__interno pagina__interno--estreito">
            {state.error && <Aviso tipo="falha" titulo="A última ação não foi concluída" texto={state.error} />}
            <FeedbackReview
              feedbackAluno={state.feedbackDraft}
              feedbackGeneration={state.feedback?.feedback_generation}
              aprovado={state.feedbackAprovado}
              isSubmitting={state.feedbackActionBusy}
              onChange={handleFeedbackChange}
              onAprovar={aprovarFeedback}
              onPedirNovaVersao={pedirNovaVersao}
              onReiniciar={resetFlow}
            />
          </div>
        </main>
      )}
    </div>
  );
}
