const { AppError } = require('../utils/AppError');

function toFriendlyMulterError(error) {
  if (!error || error.name !== 'MulterError') return null;

  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError(413, 'upload_too_large', 'A imagem enviada excede o tamanho maximo permitido.');
  }

  return new AppError(400, 'upload_error', 'Nao foi possivel receber o arquivo enviado.', {
    code: error.code
  });
}

function toFriendlyAxiosError(error) {
  if (!error || !error.isAxiosError) return null;

  if (error.code === 'ECONNABORTED') {
    return new AppError(504, 'n8n_timeout', 'O n8n demorou demais para responder.', {
      timeout: true
    });
  }

  if (error.response) {
    return new AppError(502, 'n8n_response_error', 'O n8n respondeu com erro.', {
      status: error.response.status,
      body: error.response.data
    });
  }

  return new AppError(502, 'n8n_unreachable', 'Nao foi possivel comunicar com o n8n.', {
    reason: error.message
  });
}

function errorHandler(error, req, res, next) {
  const friendlyMulterError = toFriendlyMulterError(error);
  const friendlyAxiosError = toFriendlyAxiosError(error);
  const handledError = friendlyMulterError || friendlyAxiosError || error;

  if (handledError instanceof AppError) {
    return res.status(handledError.statusCode).json({
      ok: false,
      error: {
        code: handledError.code,
        message: handledError.message,
        details: handledError.details
      }
    });
  }

  console.error('[backend] erro inesperado', error);

  return res.status(500).json({
    ok: false,
    error: {
      code: 'internal_error',
      message: 'Erro interno no backend.',
      details: {}
    }
  });
}

module.exports = {
  errorHandler
};
