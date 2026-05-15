function normalizeAnswer(answer) {
  return String(answer ?? '').trim().replace(/\s+/g, ' ');
}

function evaluateAnswer(correctAnswer, studentAnswer) {
  const normalizedExpectedAnswer = normalizeAnswer(correctAnswer);
  const normalizedStudentAnswer = normalizeAnswer(studentAnswer);

  return {
    is_correct: normalizedExpectedAnswer === normalizedStudentAnswer,
    expected_answer: String(correctAnswer ?? ''),
    student_answer: String(studentAnswer ?? ''),
    evaluation_method: 'exact_match_v1',
    details: {
      normalized_expected_answer: normalizedExpectedAnswer,
      normalized_student_answer: normalizedStudentAnswer
    }
  };
}

module.exports = {
  evaluateAnswer,
  normalizeAnswer
};
