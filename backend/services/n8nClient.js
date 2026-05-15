const axios = require('axios');
const path = require('path');
const FormData = require('form-data');

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

// Envia a imagem e metadados para o webhook de extração do n8n.
// A imagem é enviada como multipart/form-data.
async function sendExtractionRequest({ webhookUrl, submissionId, teacherName, correctAnswer, consentAccepted, image }) {
  const form = new FormData();
  form.append('submissionId', submissionId);
  form.append('teacherName', teacherName);
  form.append('correctAnswer', correctAnswer);
  form.append('consentAccepted', String(consentAccepted === 'true'));

  const ext = path.extname(image.originalname || '') || '';
  const sendFilename = `image${ext}`;

  form.append('image', image.buffer, {
    filename: sendFilename,
    contentType: image.mimetype,
    knownLength: image.size
  });

  const response = await axios.post(webhookUrl, form, {
    headers: { ...form.getHeaders() },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return {
    status: response.status,
    data: normalizeN8nData(response.data)
  };
}

async function sendFeedbackRequest({ webhookUrl, payload }) {
  // Envia o payload JSON para o webhook de feedback do n8n.
  const response = await axios.post(webhookUrl, payload, {
    headers: { 'Content-Type': 'application/json' },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return {
    status: response.status,
    data: normalizeN8nData(response.data)
  };
}

module.exports = {
  sendExtractionRequest,
  sendFeedbackRequest
};
