/**
 * Service to map probability into Risk Level
 */
const evaluateRisk = (probability, hasActivity = true) => {
  if (!hasActivity) {
    return 'Black'; // No activity indicates complete dropout
  }

  // Thresholds as per EWS strategy
  if (probability < 0.4) {
    return 'Green';
  } else if (probability < 0.7) {
    return 'Yellow';
  } else {
    return 'Red';
  }
};

module.exports = {
  evaluateRisk
};
