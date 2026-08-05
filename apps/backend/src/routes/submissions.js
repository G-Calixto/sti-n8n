const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const { env } = require('../config/env');
const { AppError } = require('../utils/AppError');
const {
  extractSubmission,
  confirmExtraction,
  generateFeedback,
  approveFeedback
} = require('../services/submissionService');

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

const extractionRevisionSchema = z.object({
  extracao: z.object({
    enunciado: z.string().optional().default(''),
    desenvolvimento_aluno: z.string().optional().default(''),
    resposta_aluno: z.string().trim().min(1, 'Informe a resposta do aluno.'),
    legibilidade: z.string().optional().default(''),
    confianca_extracao: z.union([z.number(), z.string()]).optional().default(0),
    observacoes: z.string().optional().default('')
  })
});

const questionarioCompletoSchema = z.object({
  tipo: z.enum(['correta', 'incorreta']),
  contexto_pedagogico: z.object({
    momento_conteudo: z.enum(['recente', 'ja_trabalhado']),
    estrategias_usadas: z.array(z.enum(['explicacao_direta', 'resolucao_em_grupo', 'atividade_pratica'])).min(1, 'Selecione ao menos uma estrategia.')
  }),
  perfil_emocional: z.object({
    reacao_ao_erro: z.enum(['frustracao', 'indiferenca', 'busca_compreender', 'ansiedade', 'variavel']),
    relacao_com_matematica: z.enum(['confianca', 'neutra', 'resistencia', 'ansiedade']),
    receptividade_feedback: z.enum(['boa', 'depende_da_abordagem', 'tende_a_resistir'])
  }),
  caso_correto: z.object({
    acerto_esperado: z.enum(['sim_esperado', 'sim_com_dificuldade_usual', 'nao_surpresa_positiva'])
  }).nullable(),
  caso_incorreto: z.object({
    desempenho_geral: z.enum(['abaixo_da_media', 'mediano', 'acima_da_media']),
    frequencia_erro: z.enum(['frequente', 'as_vezes', 'primeira_vez']),
    natureza_erro: z.enum(['compreensao_conceito', 'distracao', 'interpretacao_enunciado', 'calculo_execucao'])
  }).nullable()
});

// Vazio ({}) e aceito para o caso de regeneracao, que reaproveita o questionario ja salvo.
const questionarioSchema = z.union([z.object({}).strict(), questionarioCompletoSchema]);

const feedbackRequestSchema = z.object({
  questionario: questionarioSchema.optional().default({}),
  intencao_professor: z.string().trim().max(1000).optional().default(''),
  regenerar: z.boolean().optional().default(false),
  instrucao_regeneracao: z.string().trim().max(500).optional().default('')
});

const feedbackApprovalSchema = z.object({
  feedback_aluno: z.string().trim().min(1, 'Informe o feedback final para aprovar.')
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

router.patch('/submissions/:id/extraction', async (req, res, next) => {
  try {
    const parsed = extractionRevisionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'invalid_extraction_fields', 'Revise os campos da extracao.', {
        issues: parsed.error.issues
      });
    }

    const result = await confirmExtraction(req.params.id, parsed.data.extracao);
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

    const parsed = feedbackRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'invalid_feedback_request', 'Revise os campos da solicitacao de feedback.', {
        issues: parsed.error.issues
      });
    }

    const result = await generateFeedback(req.params.id, {
      questionario: parsed.data.questionario,
      intencaoProfessor: parsed.data.intencao_professor,
      regenerar: parsed.data.regenerar,
      instrucaoRegeneracao: parsed.data.instrucao_regeneracao
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/submissions/:id/feedback/approval', async (req, res, next) => {
  try {
    const parsed = feedbackApprovalSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'invalid_approval_request', 'Informe o feedback final para aprovar.', {
        issues: parsed.error.issues
      });
    }

    const result = await approveFeedback(req.params.id, parsed.data.feedback_aluno);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
