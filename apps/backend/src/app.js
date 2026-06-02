const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { env } = require('./config/env');
const healthRoutes = require('./routes/health');
const submissionRoutes = require('./routes/submissions');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

function resolveCorsOrigin() {
  if (env.FRONTEND_ORIGIN === '*') {
    return true;
  }

  return env.FRONTEND_ORIGIN
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

app.use(helmet());
app.use(cors({
  origin: resolveCorsOrigin()
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api', healthRoutes);
app.use('/api', submissionRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: {
      code: 'route_not_found',
      message: 'Rota nao encontrada.',
      details: { path: req.originalUrl }
    }
  });
});

app.use(errorHandler);

module.exports = app;
