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
  acertou: z.boolean(),
  status_avaliacao: z.string(),
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
  acertou: z.boolean(),
  status_avaliacao: z.string(),
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

  const extraction = normalizeExtraction(parsed.data.extracao);
  const preliminaryEvaluation = evaluateAnswer(correctAnswer, extraction.resposta_aluno);
  const submission = {
    submission_id: parsed.data.submission_id || submissionId,
    correctAnswer,
    extracao: extraction,
    avaliacao_preliminar: preliminaryEvaluation,
    n8n_extraction: parsed.data,
    createdAt: new Date().toISOString()
  };
  saveSubmission(submission);

  return {
    ok: true,
    submission_id: submission.submission_id,
    status: 'extracao_concluida',
    avaliacao_preliminar: preliminaryEvaluation,
    extracao: extraction,
    can_request_feedback: true
  };
}

async function generateFeedback(submissionId) {
  const submission = getSubmission(submissionId);
  if (!submission) {
    throw new AppError(404, 'submission_not_found', 'Submissao nao encontrada. Envie a imagem novamente para gerar feedback.', {
      submission_id: submissionId
    });
  }

  const payload = {
    submission_id: submission.submission_id,
    correct_answer: submission.correctAnswer,
    extracao: submission.extracao
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
    feedback: parsed.avaliacao,
    n8n_feedback: n8nResponse
  });

  return {
    ok: true,
    submission_id: submissionId,
    status: parsed.status_backend,
    status_n8n: parsed.status_n8n,
    avaliacao: parsed.avaliacao
  };
}

module.exports = {
  extractSubmission,
  generateFeedback,
  normalizeExtraction,
  normalizeFeedbackResponse
};
