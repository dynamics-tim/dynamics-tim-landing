/**
 * DOM wiring for `components/EngagementQuiz.astro`.
 *
 * Emits window CustomEvents for analytics: `quiz_start`, `quiz_step`,
 * `quiz_complete`, `quiz_cta_click` and `quiz-complete` (used by the banner).
 */
import { quizQuestions, type QuestionId } from '../data/engagement-quiz';
import {
  answerSummary,
  getRecommendation,
  isModelId,
  type Answers,
  type Recommendation,
} from '../lib/engagement-quiz';
import { QUIZ_COMPLETED_KEY, QUIZ_COMPLETE_EVENT, QUIZ_RESULT_KEY } from './storage-keys';

const TOTAL_STEPS = quizQuestions.length;
const SELECTED_CLASSES = ['border-brand-400', 'bg-brand-50', 'text-brand-700', 'shadow-sm'];
const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth');

function track(eventName: string, detail: Record<string, string | number> = {}) {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

function setRecommendationParam(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set('rec', id);
  else url.searchParams.delete('rec');
  window.history.replaceState({}, '', url);
}

export function initEngagementQuiz(root: HTMLElement) {
  /** '' on the landing page (models are on the same page), otherwise a page URL */
  const modelLinkBase = root.dataset.modelLinkBase ?? '';
  const modelsOnPage = !modelLinkBase;

  const byId = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T | null;
  const buttons = root.querySelectorAll<HTMLButtonElement>('.quiz-btn');
  const steps = Array.from(root.querySelectorAll<HTMLElement>('.quiz-step'));
  const stepsWrapper = byId('quiz-steps');
  const stepLabel = byId('quiz-step-label');
  const progressBar = byId('quiz-progress-bar');
  const resetTop = byId<HTMLButtonElement>('quiz-reset-top');
  const editBtn = byId<HTMLButtonElement>('quiz-edit');
  const resultEl = byId('quiz-result');
  const resultLink = byId<HTMLAnchorElement>('quiz-result-link');
  const resultCta = byId<HTMLAnchorElement>('quiz-result-cal');
  const resultBadge = byId('quiz-result-badge');
  const resultTitle = byId('quiz-result-title');
  const answerSummaryEl = byId('quiz-answer-summary');

  /** Plain text fields of the result card, keyed by element id */
  const textFields: Array<[string, (rec: Recommendation) => string]> = [
    ['quiz-result-text', (rec) => rec.text],
    ['quiz-result-title', (rec) => rec.title],
    ['quiz-result-tagline', (rec) => (rec.tagline ? `"${rec.tagline}"` : '')],
    ['quiz-result-finding', (rec) => rec.finding],
    ['quiz-result-risk', (rec) => rec.risk],
    ['quiz-result-derivation', (rec) => rec.derivation],
    ['quiz-result-proof', (rec) => rec.proofText],
    ['quiz-result-proof-label', (rec) => rec.proofLabel],
  ];

  const answers: Answers = {};
  const answerLabels: Answers = {};
  let forcedRecommendationId: string | null = null;
  let quizStarted = false;

  const answeredCount = () => Object.keys(answers).length;

  function setActiveStep(step: number) {
    steps.forEach((stepEl) => {
      const isActive = Number(stepEl.dataset.step) === step;
      stepEl.classList.toggle('hidden', !isActive);
      stepEl.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
  }

  function updateProgress() {
    const done = answeredCount();
    if (stepLabel) {
      stepLabel.textContent =
        done === TOTAL_STEPS ? 'Auswertung bereit' : `Frage ${done + 1} von ${TOTAL_STEPS}`;
    }
    if (progressBar) progressBar.style.width = `${(done / TOTAL_STEPS) * 100}%`;
    resetTop?.classList.toggle('hidden', done === 0);
  }

  function updateSelectedState(question: string, activeButton: HTMLButtonElement | null) {
    root.querySelectorAll<HTMLButtonElement>(`.quiz-btn[data-q="${question}"]`).forEach((btn) => {
      const isActive = btn === activeButton;
      SELECTED_CLASSES.forEach((cls) => btn.classList.toggle(cls, isActive));
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function renderAnswerSummary() {
    if (!answerSummaryEl) return;
    answerSummaryEl.innerHTML = '';
    for (const line of answerSummary(answerLabels)) {
      const item = document.createElement('li');
      item.className = 'rounded-xl border border-surface-200 bg-surface-50 px-3 py-2';
      item.textContent = line;
      answerSummaryEl.appendChild(item);
    }
  }

  function hideResult() {
    resultEl?.classList.add('hidden');
    stepsWrapper?.classList.remove('hidden');
  }

  function persistResult(rec: Recommendation) {
    sessionStorage.setItem(QUIZ_RESULT_KEY, JSON.stringify({ id: rec.id, answers, answerLabels }));
    sessionStorage.setItem(QUIZ_COMPLETED_KEY, '1');
    setRecommendationParam(isModelId(rec.id) ? rec.id : null);
    window.dispatchEvent(
      new CustomEvent(QUIZ_COMPLETE_EVENT, { detail: { recommendation: rec.id } })
    );
    track('quiz_complete', { recommendation: rec.id });
  }

  function highlightModel(modelId: string) {
    if (!modelsOnPage || !isModelId(modelId)) return;
    const model = document.getElementById(modelId);
    if (!model) return;
    model.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    model.classList.add('ring-2', 'ring-brand-400');
    window.setTimeout(() => model.classList.remove('ring-2', 'ring-brand-400'), 2000);
  }

  function animateResultCard() {
    const card = resultEl?.querySelector<HTMLElement>('.quiz-result-card');
    if (!card || prefersReducedMotion()) return;
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.style.transition = `opacity 0.5s ${EASING}, transform 0.5s ${EASING}`;
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
    });
  }

  function revealResult(recommendationId: string | null, persist = true) {
    if (!resultEl) return;
    const rec = getRecommendation(answers, recommendationId);

    for (const [id, getText] of textFields) {
      const el = document.getElementById(id);
      if (el) el.textContent = getText(rec);
    }
    if (resultBadge) {
      resultBadge.textContent = rec.badge;
      resultBadge.classList.toggle('hidden', !rec.badge);
    }
    if (resultLink) {
      resultLink.href = `${modelLinkBase}${rec.linkHref}`;
      resultLink.textContent = rec.linkText;
      resultLink.dataset.modelId = rec.id;
    }
    if (resultCta) {
      resultCta.href = rec.ctaHref;
      resultCta.textContent = rec.ctaLabel;
      if (rec.ctaHref.startsWith('mailto:')) {
        resultCta.removeAttribute('target');
        resultCta.removeAttribute('rel');
      } else {
        resultCta.target = '_blank';
        resultCta.rel = 'noopener noreferrer';
      }
    }
    renderAnswerSummary();

    resultEl.classList.remove('hidden');
    stepsWrapper?.classList.add('hidden');
    if (stepLabel) stepLabel.textContent = 'Empfehlung';
    resultTitle?.focus();
    if (progressBar) progressBar.style.width = '100%';

    if (persist) persistResult(rec);
    else sessionStorage.setItem(QUIZ_COMPLETED_KEY, '1');

    animateResultCard();
    resultEl.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' });
  }

  function resetQuiz() {
    for (const key of Object.keys(answers) as QuestionId[]) delete answers[key];
    for (const key of Object.keys(answerLabels) as QuestionId[]) delete answerLabels[key];
    buttons.forEach((btn) => {
      btn.classList.remove(...SELECTED_CLASSES);
      btn.setAttribute('aria-pressed', 'false');
    });
    hideResult();
    setActiveStep(1);
    updateProgress();
    forcedRecommendationId = null;
    sessionStorage.removeItem(QUIZ_RESULT_KEY);
    sessionStorage.removeItem(QUIZ_COMPLETED_KEY);
    setRecommendationParam(null);
  }

  /* ── Event wiring ─────────────────────────────────── */

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const question = btn.dataset.q as QuestionId;
      forcedRecommendationId = null;
      if (!quizStarted) {
        quizStarted = true;
        track('quiz_start');
      }
      track('quiz_step', { question: Number(question) });
      answers[question] = btn.dataset.v;
      answerLabels[question] = btn.textContent?.trim() ?? '';
      updateSelectedState(question, btn);
      updateProgress();
      if (answeredCount() === TOTAL_STEPS) {
        revealResult(forcedRecommendationId);
      } else {
        hideResult();
        setActiveStep(Math.min(Number(question) + 1, TOTAL_STEPS));
      }
    });
  });

  resultLink?.addEventListener('click', (event) => {
    const modelId = resultLink.dataset.modelId;
    track('quiz_cta_click', { target: 'recommendation' });
    if (modelsOnPage && modelId && document.getElementById(modelId)) {
      event.preventDefault();
      window.history.replaceState({}, '', `#${modelId}`);
      highlightModel(modelId);
    }
  });

  resultCta?.addEventListener('click', () => track('quiz_cta_click', { target: 'booking' }));

  // Quiz CTAs elsewhere on the page (hero, header) — tracked for analytics
  document.querySelectorAll<HTMLElement>('[data-quiz-cta]').forEach((cta) => {
    cta.addEventListener('click', () => {
      track('quiz_cta_click', { target: cta.dataset.quizCta ?? 'unknown' });
    });
  });

  resetTop?.addEventListener('click', resetQuiz);
  editBtn?.addEventListener('click', () => {
    resetQuiz();
    byId('quiz-container')?.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' });
  });

  /* ── Restore state (session or ?rec= deep link) ───── */

  try {
    const stored = JSON.parse(sessionStorage.getItem(QUIZ_RESULT_KEY) ?? 'null') as {
      id?: string;
      answers?: Answers;
      answerLabels?: Answers;
    } | null;
    if (stored?.answers) Object.assign(answers, stored.answers);
    if (stored?.answerLabels) Object.assign(answerLabels, stored.answerLabels);
    for (const [question, value] of Object.entries(answers)) {
      const button = root.querySelector<HTMLButtonElement>(
        `.quiz-btn[data-q="${question}"][data-v="${value}"]`
      );
      if (button) updateSelectedState(question, button);
    }
    const queryRecommendation = new URLSearchParams(window.location.search).get('rec');
    forcedRecommendationId = isModelId(queryRecommendation) ? queryRecommendation : null;
    const restoreId = forcedRecommendationId ?? stored?.id;
    if (restoreId) {
      revealResult(restoreId, false);
    } else {
      setActiveStep(1);
      updateProgress();
    }
  } catch {
    setActiveStep(1);
    updateProgress();
  }
}
