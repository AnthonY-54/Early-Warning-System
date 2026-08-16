/**
 * Service to generate adaptive feedback based on Risk Level and Confidence
 */
const generateFeedback = (riskLevel, confidence, studentProfile = null) => {
  // Base feedback matrix
  const feedbackMatrix = {
    'Green': {
      high: "Excellent progress! Keep up the consistent engagement. Review upcoming materials to stay ahead.",
      low: "Good progress so far. Try to engage a bit more with the Virtual Learning Environment (VLE) to solidify your standing."
    },
    'Yellow': {
      high: "Warning: Your engagement has dropped. You should review the recent topic materials and submit any pending quizzes.",
      low: "Caution: Your metrics show slight inconsistency. Please ensure you are logging in regularly and checking the course forums."
    },
    'Red': {
      high: "Critical: You are at high risk of failing/withdrawing. Please contact your tutor immediately to discuss a recovery strategy.",
      low: "Alert: Your performance is trailing. We highly recommend scheduling a 1-on-1 session with an instructor."
    },
    'Black': {
      high: "Alert: No recent activity detected. Are you facing technical difficulties? Please contact student support to avoid forced withdrawal.",
      low: "Alert: No recent activity detected. Please log in as soon as possible."
    }
  };

  const cLevel = confidence > 0.75 ? 'high' : 'low';
  let message = feedbackMatrix[riskLevel][cLevel];

  // Topic personalization if profile is provided
  if (studentProfile && studentProfile.weakTopic) {
    message += ` Also, we noticed you might need help with ${studentProfile.weakTopic}. Check the recommended resources tab.`;
  }

  return message;
};

module.exports = {
  generateFeedback
};
