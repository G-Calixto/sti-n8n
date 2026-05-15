const { evaluateAnswer } = require('./evaluationService');
const { sendExtractionRequest, sendFeedbackRequest } = require('./n8nClient');

function createBackendError(statusCode, message, details = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function validateExtractionResponse(extractionResponse) {
  if (!extractionResponse || typeof extractionResponse !== 'object') {
    throw createBackendError(502, 'Resposta invalida do fluxo de extracao.', {
      status_backend: 'resposta_extracao_invalida',
      n8nResponse: extractionResponse
    });
  }

  if (extractionResponse.ok === false) {
    throw createBackendError(502, 'O fluxo de extracao retornou erro.', {
      status_backend: 'erro_no_fluxo_extracao',
      n8nResponse: extractionResponse
    });
  }

  const studentAnswer = extractionResponse.extracao && extractionResponse.extracao.resposta_aluno;

  if (studentAnswer == null || String(studentAnswer).trim() === '') {
    throw createBackendError(422, 'Resposta do aluno nao foi extraida da imagem.', {
      status_backend: 'resposta_aluno_invalida',
      n8nResponse: extractionResponse
    });
  }
}

function buildFeedbackPayload({ extractionResponse, submissionId, correctAnswer, avaliacao }) {
  return {
    submission_id: extractionResponse.submission_id || submissionId,
    correct_answer: correctAnswer,
    extracao: extractionResponse.extracao,
    avaliacao,
    origem: {
      fluxo_anterior: extractionResponse.fluxo,
      status_n8n: extractionResponse.status_n8n,
      provedor_ia: extractionResponse.provedor_ia,
      modelo: extractionResponse.modelo
    }
  };
}

async function processSubmission({ config, submissionId, teacherName, correctAnswer, consentAccepted, image }) {
  // Solicita ao n8n a extração dos dados da imagem (p.ex. resposta do aluno)
  const extractionResult = await sendExtractionRequest({
    webhookUrl: config.extractionWebhookUrl,
    submissionId,
    teacherName,
    correctAnswer,
    consentAccepted,
    image
  });

  const extractionResponse = extractionResult.data;
  validateExtractionResponse(extractionResponse);

  // Avalia a resposta extraída comparando com a resposta correta
  const avaliacao = evaluateAnswer(correctAnswer, extractionResponse.extracao.resposta_aluno);
  const feedbackPayload = buildFeedbackPayload({
    extractionResponse,
    submissionId,
    correctAnswer,
    avaliacao
  });

  const feedbackResponse = await sendFeedbackRequest({
    webhookUrl: config.feedbackWebhookUrl,
    payload: feedbackPayload
  });

  return {
    ok: true,
    submission_id: extractionResponse.submission_id || submissionId,
    status_backend: 'avaliacao_realizada_e_feedback_solicitado',
    extracao: extractionResponse.extracao,
    avaliacao,
    feedback: {
      status: 'solicitado_ao_n8n',
      resposta_n8n: feedbackResponse.data
    }
  };
}

module.exports = {
  buildFeedbackPayload,
  processSubmission,
  validateExtractionResponse
};
