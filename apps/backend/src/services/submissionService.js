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

const feedbackResponseSchema = z.object({
  ok: z.literal(true),
  submission_id: z.string().min(1),
  fluxo: z.string().optional(),
  status_n8n: z.string().optional(),
  provedor_ia: z.string().optional(),
  modelo: z.string().optional(),
  avaliacao: z.object({
    acertou: z.boolean(),
    status_avaliacao: z.string(),
    tipo_erro: z.string().nullable().optional(),
    resumo_erro: z.string().nullable().optional(),
    feedback_aluno: z.string(),
    feedback_professor: z.string(),
    dica_proxima_acao: z.string().nullable().optional(),
    confianca_feedback: z.union([z.number(), z.string()]).nullable().optional()
  }),
  entrada: z.any().optional(),
  erro: z.any().nullable().optional()
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

async function extractSubmission({ teacherName, correctAnswer, consentAccepted, image }) {
  const submissionId = createSubmissionId();
  const n8nResponse = await callExtractionWorkflow({
    submissionId,
    teacherName,
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
    teacherName,
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
  const parsed = feedbackResponseSchema.safeParse(n8nResponse);
  if (!parsed.success) {
    throw new AppError(502, 'invalid_feedback_response', 'Resposta invalida do workflow de feedback.', {
      issues: parsed.error.issues,
      n8nResponse
    });
  }

  updateSubmission(submissionId, {
    feedback: parsed.data.avaliacao,
    n8n_feedback: parsed.data
  });

  return {
    ok: true,
    submission_id: submissionId,
    status: 'feedback_concluido',
    avaliacao: parsed.data.avaliacao
  };
}

module.exports = {
  extractSubmission,
  generateFeedback,
  normalizeExtraction
};
