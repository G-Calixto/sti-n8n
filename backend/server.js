const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

const fs = require('fs');
const path = require('path');
const { processSubmission } = require('./services/submissionService');

const app = express();
// Mantém a imagem em memória para envio direto ao n8n (MVP simplificado).
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3000;
// Configurações via variáveis de ambiente
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_FEEDBACK_WEBHOOK_URL = process.env.N8N_FEEDBACK_WEBHOOK_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

app.use(cors({ origin: FRONTEND_URL === '*' ? true : FRONTEND_URL }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend funcionando.' });
});

app.post('/api/submit', upload.single('image'), async (req, res) => {
  try {
    let { teacherName, correctAnswer, submissionId, consentAccepted } = req.body;
    const image = req.file;

    // Nome do professor e opcional no MVP.
    if (!teacherName) {
      teacherName = 'Anonimo';
    }

    if (!correctAnswer || !submissionId) {
      return res.status(400).json({ ok: false, message: 'Campos obrigatorios ausentes.' });
    }

    if (!image) {
      return res.status(400).json({ ok: false, message: 'Envie uma imagem.' });
    }

    if (!N8N_WEBHOOK_URL) {
      return res.status(500).json({ ok: false, message: 'Webhook de extracao do n8n nao configurado.' });
    }

    if (!N8N_FEEDBACK_WEBHOOK_URL) {
      return res.status(500).json({ ok: false, message: 'Webhook de feedback do n8n nao configurado.' });
    }

    // Encaminha a submissão para o serviço que chama o n8n
    const response = await processSubmission({
      config: {
        extractionWebhookUrl: N8N_WEBHOOK_URL,
        feedbackWebhookUrl: N8N_FEEDBACK_WEBHOOK_URL
      },
      submissionId,
      teacherName,
      correctAnswer,
      consentAccepted,
      image
    });

    res.json(response);
  } catch (error) {
    console.error('Erro no envio:', error);
    try {
      const logEntry = `[${new Date().toISOString()}] Erro no envio: ${error && error.stack ? error.stack : JSON.stringify(error)}\n`;
      fs.appendFileSync(path.join(__dirname, 'error.log'), logEntry);
    } catch (e) {
      console.error('Falha ao gravar error.log:', e);
    }

    if (error && error.statusCode) {
      return res.status(error.statusCode).json({
        ok: false,
        message: error.message,
        ...error.details
      });
    }

    // Se for um erro do axios com resposta do n8n, repassar detalhes como 502.
    if (error && error.response) {
      const resp = error.response;
      const respText = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      try {
        const respLog = `[${new Date().toISOString()}] n8n response status ${resp.status}: ${respText}\n`;
        fs.appendFileSync(path.join(__dirname, 'error.log'), respLog);
      } catch (e) {
        console.error('Falha ao gravar error.log (response):', e);
      }

      return res.status(502).json({
        ok: false,
        message: 'O n8n respondeu com erro.',
        n8nStatus: resp.status,
        n8nBody: respText
      });
    }

    res.status(500).json({ ok: false, message: 'Erro interno no backend.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
