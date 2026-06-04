const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const { env } = require('../config/env');
const { AppError } = require('../utils/AppError');
const { extractSubmission, generateFeedback } = require('../services/submissionService');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return callback(new AppError(400, 'invalid_image_type', 'Envie um arquivo de imagem valido.'));
    }
    return callback(null, true);
  }
});

const extractBodySchema = z.object({
  correctAnswer: z.string().trim().min(1, 'Informe a resposta correta.'),
  consentAccepted: z.preprocess((value) => value === true || value === 'true', z.literal(true, {
    errorMap: () => ({ message: 'E necessario aceitar o termo LGPD antes de enviar.' })
  }))
});

router.post('/submissions/extract', upload.single('image'), async (req, res, next) => {
  try {
    if (!env.N8N_EXTRACTION_WEBHOOK_URL) {
      throw new AppError(500, 'missing_extraction_webhook', 'Webhook de extracao do n8n nao configurado.');
    }

    if (!req.file) {
      throw new AppError(400, 'missing_image', 'Envie uma imagem da questao.');
    }

    const parsed = extractBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'invalid_submission_fields', 'Revise os campos do formulario.', {
        issues: parsed.error.issues
      });
    }

    const result = await extractSubmission({
      ...parsed.data,
      image: req.file
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/submissions/:id/feedback', async (req, res, next) => {
  try {
    if (!env.N8N_FEEDBACK_WEBHOOK_URL) {
      throw new AppError(500, 'missing_feedback_webhook', 'Webhook de feedback do n8n nao configurado.');
    }

    const result = await generateFeedback(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
