function normalizeAnswer(answer) {
  return String(answer ?? '').trim().replace(/\s+/g, ' ');
}

function evaluateAnswer(correctAnswer, studentAnswer) {
  const correctAnswerNormalized = normalizeAnswer(correctAnswer);
  const studentAnswerNormalized = normalizeAnswer(studentAnswer);

  return {
    resposta_correta: correctAnswerNormalized === studentAnswerNormalized,
    correct_answer_normalizada: correctAnswerNormalized,
    resposta_aluno_normalizada: studentAnswerNormalized
  };
}

module.exports = {
  evaluateAnswer,
  normalizeAnswer
};
