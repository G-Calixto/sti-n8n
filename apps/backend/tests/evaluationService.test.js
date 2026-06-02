const assert = require('assert');
const { evaluateAnswer, normalizeAnswer } = require('../src/services/evaluationService');

assert.strictEqual(normalizeAnswer(' 5  '), '5');
assert.strictEqual(normalizeAnswer('a   b'), 'a b');
assert.strictEqual(evaluateAnswer('5', '5').resposta_correta, true);
assert.strictEqual(evaluateAnswer('5', '6').resposta_correta, false);
assert.strictEqual(evaluateAnswer(' 5 ', '5').correct_answer_normalizada, '5');

console.log('evaluationService tests passed');
