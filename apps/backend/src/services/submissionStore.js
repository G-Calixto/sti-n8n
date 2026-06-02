const submissions = new Map();

function saveSubmission(submission) {
  submissions.set(submission.submission_id, {
    ...submission,
    updatedAt: new Date().toISOString()
  });
}

function getSubmission(submissionId) {
  return submissions.get(submissionId) || null;
}

function updateSubmission(submissionId, patch) {
  const current = getSubmission(submissionId);
  if (!current) return null;

  const updated = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  submissions.set(submissionId, updated);
  return updated;
}

module.exports = {
  getSubmission,
  saveSubmission,
  updateSubmission
};
