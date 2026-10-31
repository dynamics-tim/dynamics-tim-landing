/**
 * Shared client-side keys/event names. Several components coordinate through
 * sessionStorage and window events — keep the names in one place.
 */

/** sessionStorage: set to "1" once the engagement quiz showed a result */
export const QUIZ_COMPLETED_KEY = 'quiz-completed';

/** sessionStorage: JSON of the last quiz result ({ id, answers, answerLabels }) */
export const QUIZ_RESULT_KEY = 'engagement-quiz-result';

/** window CustomEvent fired when the quiz is completed (detail: { recommendation }) */
export const QUIZ_COMPLETE_EVENT = 'quiz-complete';
