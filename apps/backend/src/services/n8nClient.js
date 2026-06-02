const axios = require('axios');
const path = require('path');
const FormData = require('form-data');
const { env } = require('../config/env');

function normalizeN8nData(data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      return data;
    }
  }

  return data;
}

async function callExtractionWorkflow({ submissionId, teacherName, correctAnswer, consentAccepted, image }) {
  const form = new FormData();
  form.append('submissionId', submissionId);
  form.append('teacherName', teacherName);
  form.append('correctAnswer', correctAnswer);
  form.append('consentAccepted', String(consentAccepted === true));

  const extension = path.extname(image.originalname || '') || '';
  const filename = `questao${extension}`;
  form.append(env.N8N_EXTRACTION_FILE_FIELD, image.buffer, {
    filename,
    contentType: image.mimetype,
    knownLength: image.size
  });

  const response = await axios.post(env.N8N_EXTRACTION_WEBHOOK_URL, form, {
    headers: form.getHeaders(),
    timeout: env.N8N_TIMEOUT_MS,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return normalizeN8nData(response.data);
}

async function callFeedbackWorkflow(payload) {
  const response = await axios.post(env.N8N_FEEDBACK_WEBHOOK_URL, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: env.N8N_TIMEOUT_MS,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return normalizeN8nData(response.data);
}

module.exports = {
  callExtractionWorkflow,
  callFeedbackWorkflow,
  normalizeN8nData
};
