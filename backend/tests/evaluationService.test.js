const assert = require('assert');
const { evaluateAnswer } = require('../services/evaluationService');

assert.strictEqual(evaluateAnswer('5', '5').is_correct, true);
assert.strictEqual(evaluateAnswer('5', '6').is_correct, false);
assert.strictEqual(evaluateAnswer(' 5 ', '5').is_correct, true);

console.log('evaluationService tests passed');
