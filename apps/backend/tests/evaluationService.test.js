const assert = require('assert');
const { evaluateAnswer, normalizeAnswer } = require('../src/services/evaluationService');
const { normalizeFeedbackResponse } = require('../src/services/submissionService');

assert.strictEqual(normalizeAnswer(' 5  '), '5');
assert.strictEqual(normalizeAnswer('a   b'), 'a b');
assert.strictEqual(evaluateAnswer('5', '5').resposta_correta, true);
assert.strictEqual(evaluateAnswer('5', '6').resposta_correta, false);
assert.strictEqual(evaluateAnswer(' 5 ', '5').correct_answer_normalizada, '5');

const degradedFeedback = normalizeFeedbackResponse({
  timestamp: '2026-06-02T18:53:08.727Z',
  submission_id: 'sub_1780426163380_547746de',
  parse_ok: false,
  ok: false,
  status_n8n: 'erro_feedback_ia',
  provedor_ia: 'gemini',
  modelo: 'gemini',
  acertou: true,
  status_avaliacao: 'correta',
  tipo_erro: 'nenhum',
  resumo_erro: '',
  feedback_aluno: 'Muito bem! Sua resposta esta correta.',
  feedback_professor: 'A IA nao retornou um JSON valido.',
  dica_proxima_acao: 'Propor uma questao parecida para reforcar o aprendizado.',
  confianca_feedback: 0
});

assert.strictEqual(degradedFeedback.ok, true);
assert.strictEqual(degradedFeedback.status_backend, 'feedback_concluido_com_alerta');
assert.strictEqual(degradedFeedback.avaliacao.feedback_aluno, 'Muito bem! Sua resposta esta correta.');
assert.strictEqual(degradedFeedback.avaliacao.acertou, true);

const embeddedFeedback = normalizeFeedbackResponse({
  resposta_backend_json: JSON.stringify({
    ok: false,
    submission_id: 'sub_1',
    fluxo: 'geracao_feedback',
    status_n8n: 'erro_feedback_ia',
    avaliacao: {
      acertou: true,
      status_avaliacao: 'correta',
      tipo_erro: 'nenhum',
      resumo_erro: '',
      feedback_aluno: 'Muito bem!',
      feedback_professor: 'Fallback usado.',
      dica_proxima_acao: 'Continuar.',
      confianca_feedback: '0'
    },
    erro: {
      parse_ok: false
    }
  })
});

assert.strictEqual(embeddedFeedback.ok, true);
assert.strictEqual(embeddedFeedback.avaliacao.confianca_feedback, 0);
assert.strictEqual(embeddedFeedback.avaliacao.feedback_aluno, 'Muito bem!');

console.log('evaluationService tests passed');
