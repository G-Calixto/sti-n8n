const crypto = require('crypto');
const { z } = require('zod');
const { AppError } = require('../utils/AppError');
const { evaluateAnswer } = require('./evaluationService');
const { callExtractionWorkflow, callFeedbackWorkflow } = require('./n8nClient');
const { getSubmission, saveSubmission, updateSubmission } = require('./submissionStore');

const extractionResponseSchema = z.object({
  ok: z.literal(true),
  submission_id: z.string().min(1),
  fluxo: z.string().optional(),
  status_n8n: z.string().optional(),
  provedor_ia: z.string().optional(),
  modelo: z.string().optional(),
  extracao: z.object({
    enunciado: z.string().nullable().optional(),
    desenvolvimento_aluno: z.string().nullable().optional(),
    resposta_aluno: z.string().min(1),
    legibilidade: z.string().nullable().optional(),
    confianca_extracao: z.union([z.number(), z.string()]).nullable().optional(),
    observacoes: z.string().nullable().optional()
  }),
  erro_parse: z.any().nullable().optional()
});

const feedbackEvaluationSchema = z.object({
  acertou: z.boolean().optional(),
  status_avaliacao: z.string().optional(),
  tipo_erro: z.string().nullable().optional(),
  resumo_erro: z.string().nullable().optional(),
  feedback_aluno: z.string().min(1),
  feedback_professor: z.string().nullable().optional(),
  dica_proxima_acao: z.string().nullable().optional(),
  confianca_feedback: z.union([z.number(), z.string()]).nullable().optional()
});

const feedbackResponseSchema = z.object({
  ok: z.boolean().optional(),
  submission_id: z.string().min(1),
  fluxo: z.string().optional(),
  status_n8n: z.string().optional(),
  provedor_ia: z.string().optional(),
  modelo: z.string().optional(),
  avaliacao: feedbackEvaluationSchema,
  entrada: z.any().optional(),
  erro: z.any().nullable().optional()
});

const flatFeedbackResponseSchema = z.object({
  ok: z.boolean().optional(),
  submission_id: z.string().min(1),
  status_n8n: z.string().optional(),
  provedor_ia: z.string().optional(),
  modelo: z.string().optional(),
  acertou: z.boolean().optional(),
  status_avaliacao: z.string().optional(),
  tipo_erro: z.string().nullable().optional(),
  resumo_erro: z.string().nullable().optional(),
  feedback_aluno: z.string().min(1),
  feedback_professor: z.string().nullable().optional(),
  dica_proxima_acao: z.string().nullable().optional(),
  confianca_feedback: z.union([z.number(), z.string()]).nullable().optional(),
  entrada: z.any().optional(),
  erro: z.any().nullable().optional(),
  resposta_backend: z.any().optional(),
  resposta_backend_json: z.string().optional()
});

function createSubmissionId() {
  return `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function normalizeExtraction(extraction) {
  return {
    enunciado: extraction.enunciado || '',
    desenvolvimento_aluno: extraction.desenvolvimento_aluno || '',
    resposta_aluno: extraction.resposta_aluno || '',
    legibilidade: extraction.legibilidade || '',
    confianca_extracao: Number(extraction.confianca_extracao ?? 0),
    observacoes: extraction.observacoes || ''
  };
}

function parseJsonField(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function normalizeFeedbackEvaluation(evaluation) {
  return {
    acertou: evaluation.acertou,
    status_avaliacao: evaluation.status_avaliacao,
    tipo_erro: evaluation.tipo_erro || '',
    resumo_erro: evaluation.resumo_erro || '',
    feedback_aluno: evaluation.feedback_aluno,
    feedback_professor: evaluation.feedback_professor || '',
    dica_proxima_acao: evaluation.dica_proxima_acao || '',
    confianca_feedback: Number(evaluation.confianca_feedback ?? 0)
  };
}

function normalizeFeedbackResponse(n8nResponse) {
  const embeddedResponse =
    n8nResponse?.resposta_backend ||
    parseJsonField(n8nResponse?.resposta_backend_json);

  const candidates = [n8nResponse, embeddedResponse].filter(Boolean);
  const issues = [];

  for (const candidate of candidates) {
    const nested = feedbackResponseSchema.safeParse(candidate);
    if (nested.success) {
      return {
        ...nested.data,
        ok: true,
        avaliacao: normalizeFeedbackEvaluation(nested.data.avaliacao),
        status_backend: nested.data.ok === false ? 'feedback_concluido_com_alerta' : 'feedback_concluido'
      };
    }

    const flat = flatFeedbackResponseSchema.safeParse(candidate);
    if (flat.success) {
      return {
        ok: true,
        submission_id: flat.data.submission_id,
        fluxo: 'geracao_feedback',
        status_n8n: flat.data.status_n8n,
        provedor_ia: flat.data.provedor_ia,
        modelo: flat.data.modelo,
        avaliacao: normalizeFeedbackEvaluation(flat.data),
        entrada: flat.data.entrada,
        erro: flat.data.erro,
        status_backend: flat.data.ok === false ? 'feedback_concluido_com_alerta' : 'feedback_concluido'
      };
    }

    issues.push(...nested.error.issues, ...flat.error.issues);
  }

  return {
    ok: false,
    issues,
    n8nResponse
  };
}

function buildAvaliacaoOficial(correctAnswer, respostaAluno) {
  const resultado = evaluateAnswer(correctAnswer, respostaAluno);
  return {
    resposta_correta: resultado.resposta_correta,
    status: resultado.resposta_correta ? 'correta' : 'incorreta'
  };
}

function validateQuestionarioContraAvaliacao(questionario, avaliacao) {
  if (questionario.tipo !== avaliacao.status) {
    throw new AppError(400, 'questionario_incompatible', 'O tipo do questionario nao corresponde ao resultado oficial da avaliacao.', {
      tipo_questionario: questionario.tipo,
      status_avaliacao: avaliacao.status
    });
  }

  if (questionario.tipo === 'correta' && (!questionario.caso_correto || questionario.caso_incorreto)) {
    throw new AppError(400, 'questionario_incompatible', 'Questionario do caso correto deve preencher caso_correto e manter caso_incorreto nulo.');
  }

  if (questionario.tipo === 'incorreta' && (!questionario.caso_incorreto || questionario.caso_correto)) {
    throw new AppError(400, 'questionario_incompatible', 'Questionario do caso incorreto deve preencher caso_incorreto e manter caso_correto nulo.');
  }
}

async function extractSubmission({ correctAnswer, consentAccepted, image }) {
  const submissionId = createSubmissionId();
  const n8nResponse = await callExtractionWorkflow({
    submissionId,
    correctAnswer,
    consentAccepted,
    image
  });

  const parsed = extractionResponseSchema.safeParse(n8nResponse);
  if (!parsed.success) {
    throw new AppError(502, 'invalid_extraction_response', 'Resposta invalida do workflow de extracao.', {
      issues: parsed.error.issues,
      n8nResponse
    });
  }

  const extracao = normalizeExtraction(parsed.data.extracao);
  const preliminaryEvaluation = evaluateAnswer(correctAnswer, extracao.resposta_aluno);
  const submission = {
    submission_id: parsed.data.submission_id || submissionId,
    correctAnswer,
    extracao_original: extracao,
    extracao_revisada: null,
    avaliacao: null,
    avaliacao_preliminar: preliminaryEvaluation,
    questionario: null,
    intencao_professor: '',
    feedback: null,
    feedback_generation: 0,
    feedback_final_aprovado: '',
    feedback_aprovado: false,
    n8n_extraction: parsed.data,
    createdAt: new Date().toISOString()
  };
  saveSubmission(submission);

  return {
    ok: true,
    submission_id: submission.submission_id,
    status: 'extracao_concluida',
    avaliacao_preliminar: preliminaryEvaluation,
    extracao,
    can_request_feedback: true
  };
}

async function confirmExtraction(submissionId, extracaoInput) {
  const submission = getSubmission(submissionId);
  if (!submission) {
    throw new AppError(404, 'submission_not_found', 'Submissao nao encontrada. Envie a imagem novamente para revisar a extracao.', {
      submission_id: submissionId
    });
  }

  const extracaoRevisada = normalizeExtraction(extracaoInput);
  if (!extracaoRevisada.resposta_aluno) {
    throw new AppError(400, 'invalid_extraction_fields', 'A resposta do aluno nao pode ficar vazia.');
  }

  const avaliacao = buildAvaliacaoOficial(submission.correctAnswer, extracaoRevisada.resposta_aluno);

  updateSubmission(submissionId, {
    extracao_revisada: extracaoRevisada,
    avaliacao,
    questionario: null,
    feedback: null,
    feedback_generation: 0,
    feedback_final_aprovado: '',
    feedback_aprovado: false
  });

  return {
    ok: true,
    submission_id: submissionId,
    status: 'extracao_revisada',
    extracao: extracaoRevisada,
    avaliacao
  };
}

async function generateFeedback(submissionId, { questionario, intencaoProfessor, regenerar, instrucaoRegeneracao }) {
  const submission = getSubmission(submissionId);
  if (!submission) {
    throw new AppError(404, 'submission_not_found', 'Submissao nao encontrada. Envie a imagem novamente para gerar feedback.', {
      submission_id: submissionId
    });
  }

  if (!submission.extracao_revisada || !submission.avaliacao) {
    throw new AppError(400, 'extraction_not_reviewed', 'Confirme a extracao revisada antes de gerar o feedback.', {
      submission_id: submissionId
    });
  }

  const questionarioVazio = !questionario || Object.keys(questionario).length === 0;
  let questionarioFinal = questionario;

  if (regenerar && questionarioVazio) {
    if (!submission.questionario) {
      throw new AppError(400, 'questionnaire_not_found', 'Nenhum questionario salvo para reutilizar na regeneracao.', {
        submission_id: submissionId
      });
    }
    questionarioFinal = submission.questionario;
  } else if (!questionarioVazio) {
    validateQuestionarioContraAvaliacao(questionario, submission.avaliacao);
  } else {
    throw new AppError(400, 'invalid_feedback_request', 'Informe o questionario pedagogico para gerar o feedback.');
  }

  const payload = {
    submission_id: submission.submission_id,
    feedback_generation: submission.feedback_generation + 1,
    correct_answer: submission.correctAnswer,
    extracao: submission.extracao_revisada,
    avaliacao: submission.avaliacao,
    questionario: questionarioFinal,
    intencao_professor: intencaoProfessor || '',
    regeneracao: {
      solicitada: Boolean(regenerar),
      instrucao: instrucaoRegeneracao || ''
    }
  };

  const n8nResponse = await callFeedbackWorkflow(payload);
  const parsed = normalizeFeedbackResponse(n8nResponse);
  if (!parsed.ok) {
    throw new AppError(502, 'invalid_feedback_response', 'Resposta invalida do workflow de feedback.', {
      issues: parsed.issues,
      n8nResponse
    });
  }

  updateSubmission(submissionId, {
    questionario: questionarioFinal,
    intencao_professor: intencaoProfessor || '',
    feedback: parsed.avaliacao,
    feedback_generation: payload.feedback_generation
  });

  return {
    ok: true,
    submission_id: submissionId,
    status: parsed.status_backend,
    status_n8n: parsed.status_n8n,
    feedback_generation: payload.feedback_generation,
    avaliacao: parsed.avaliacao
  };
}

async function approveFeedback(submissionId, feedbackAluno) {
  const submission = getSubmission(submissionId);
  if (!submission) {
    throw new AppError(404, 'submission_not_found', 'Submissao nao encontrada.', {
      submission_id: submissionId
    });
  }

  if (!feedbackAluno || !feedbackAluno.trim()) {
    throw new AppError(400, 'invalid_approval_request', 'Informe o texto final do feedback para aprovar.');
  }

  updateSubmission(submissionId, {
    feedback_final_aprovado: feedbackAluno,
    feedback_aprovado: true
  });

  return {
    ok: true,
    submission_id: submissionId,
    status: 'feedback_aprovado',
    avaliacao: {
      feedback_aluno: feedbackAluno
    }
  };
}

module.exports = {
  extractSubmission,
  confirmExtraction,
  generateFeedback,
  approveFeedback,
  normalizeExtraction,
  normalizeFeedbackResponse,
  validateQuestionarioContraAvaliacao
};
