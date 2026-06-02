const dotenv = require('dotenv');
const path = require('path');
const { z } = require('zod');

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  N8N_EXTRACTION_WEBHOOK_URL: z.string().url().optional(),
  N8N_FEEDBACK_WEBHOOK_URL: z.string().url().optional(),
  N8N_EXTRACTION_FILE_FIELD: z.string().min(1).default('image'),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().positive().default(10),
  N8N_TIMEOUT_MS: z.coerce.number().int().positive().default(120000)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuracao de ambiente invalida:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = {
  env: parsed.data
};
