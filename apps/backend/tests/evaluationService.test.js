const assert = require('assert');
const { evaluateAnswer, normalizeAnswer } = require('../src/services/evaluationService');
const { normalizeFeedbackResponse, validateQuestionarioContraAvaliacao } = require('../src/services/submissionService');

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

const minimalFeedback = normalizeFeedbackResponse({
  submission_id: 'sub_2',
  feedback_aluno: 'Texto minimo, so com feedback_aluno.'
});

assert.strictEqual(minimalFeedback.ok, true);
assert.strictEqual(minimalFeedback.avaliacao.feedback_aluno, 'Texto minimo, so com feedback_aluno.');
assert.strictEqual(minimalFeedback.avaliacao.acertou, undefined);
assert.strictEqual(minimalFeedback.avaliacao.status_avaliacao, undefined);

const avaliacaoCorreta = { resposta_correta: true, status: 'correta' };
const avaliacaoIncorreta = { resposta_correta: false, status: 'incorreta' };

assert.doesNotThrow(() => validateQuestionarioContraAvaliacao({
  tipo: 'correta',
  caso_correto: { acerto_esperado: 'sim_esperado' },
  caso_incorreto: null
}, avaliacaoCorreta));

assert.doesNotThrow(() => validateQuestionarioContraAvaliacao({
  tipo: 'incorreta',
  caso_correto: null,
  caso_incorreto: { desempenho_geral: 'mediano', frequencia_erro: 'as_vezes', natureza_erro: 'calculo_execucao' }
}, avaliacaoIncorreta));

assert.throws(() => validateQuestionarioContraAvaliacao({
  tipo: 'correta',
  caso_correto: { acerto_esperado: 'sim_esperado' },
  caso_incorreto: null
}, avaliacaoIncorreta), (error) => error.code === 'questionario_incompatible');

assert.throws(() => validateQuestionarioContraAvaliacao({
  tipo: 'incorreta',
  caso_correto: null,
  caso_incorreto: null
}, avaliacaoIncorreta), (error) => error.code === 'questionario_incompatible');

console.log('evaluationService tests passed');
