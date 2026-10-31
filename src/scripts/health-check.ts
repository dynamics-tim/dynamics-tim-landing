/**
 * DOM wiring for components/HealthCheck.astro.
 * Scoring is pure (lib/health-check.ts); this file only moves between steps and renders
 * the result. All dynamic text is written with textContent.
 */
import { evaluate, findOption, isComplete, type HealthAnswers } from '../lib/health-check';
import { healthQuestions, recommendationCopy, type GradeId } from '../data/health-check';
import { clearAnswers, loadAnswers, saveAnswers } from './health-store';
import { to } from '../utils/url';

const ADVANCE_DELAY_MS = 220;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Full literal class strings (Tailwind must see them — never concatenate fragments). */
const GRADE_STYLES: Record<GradeId, { badge: string; ring: string; bar: string }> = {
  kritisch: { badge: 'bg-ember-500 text-white', ring: 'stroke-ember-500', bar: 'bg-ember-500' },
  ausbaufaehig: { badge: 'bg-amber-400 text-ink-950', ring: 'stroke-amber-400', bar: 'bg-amber-400' },
  solide: { badge: 'bg-lime-300 text-ink-950', ring: 'stroke-lime-500', bar: 'bg-lime-500' },
  exzellent: { badge: 'bg-lime-500 text-ink-950', ring: 'stroke-lime-500', bar: 'bg-lime-500' },
};
const ALL_RING = ['stroke-ember-500', 'stroke-amber-400', 'stroke-lime-500'];
const ALL_BADGE = ['bg-ember-500', 'text-white', 'bg-amber-400', 'text-ink-950', 'bg-lime-300', 'bg-lime-500'];
const barClassFor = (score: number | null) =>
  score === null ? 'bg-ink-300' : score < 40 ? 'bg-ember-500' : score < 60 ? 'bg-amber-400' : 'bg-lime-500';
const ALL_BAR = ['bg-ink-300', 'bg-ember-500', 'bg-amber-400', 'bg-lime-500'];

function animateNumber(el: HTMLElement, target: number) {
  if (reduceMotion) {
    el.textContent = String(target);
    return;
  }
  const start = performance.now();
  const duration = 1000;
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function init(root: HTMLElement) {
  const questionsView = root.querySelector<HTMLElement>('[data-hc-questions]');
  const resultView = root.querySelector<HTMLElement>('[data-hc-result]');
  const stepLabel = root.querySelector<HTMLElement>('#hc-step-label');
  const dimensionLabel = root.querySelector<HTMLElement>('[data-hc-dimension]');
  const bars = Array.from(root.querySelectorAll<HTMLElement>('[data-hc-bar]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-hc-question]'));
  const back = root.querySelector<HTMLButtonElement>('[data-hc-back]');
  const restart = root.querySelector<HTMLButtonElement>('[data-hc-restart]');
  if (!questionsView || !resultView || !stepLabel || !back || panels.length !== healthQuestions.length) {
    return;
  }

  let answers: HealthAnswers = loadAnswers();
  let current = 0;
  let advancing = false;

  const renderStep = (focus: boolean) => {
    panels.forEach((panel, index) => panel.classList.toggle('hidden', index !== current));
    const question = healthQuestions[current];
    stepLabel.textContent = `Frage ${current + 1} von ${healthQuestions.length}`;
    if (dimensionLabel) dimensionLabel.textContent = panels[current].dataset.dimensionLabel ?? '';
    bars.forEach((bar, index) => {
      const answered = Boolean(findOption(healthQuestions[index].id, answers[healthQuestions[index].id]));
      bar.classList.toggle('bg-ink-950', index === current);
      bar.classList.toggle('bg-lime-500', index !== current && answered);
      bar.classList.toggle('bg-ink-950/10', index !== current && !answered);
    });
    panels[current].querySelectorAll<HTMLButtonElement>('[data-hc-option]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.hcOption === answers[question.id]));
    });
    back.disabled = current === 0;
    if (focus) {
      const target =
        panels[current].querySelector<HTMLButtonElement>('[aria-pressed="true"]') ??
        panels[current].querySelector<HTMLButtonElement>('[data-hc-option]');
      target?.focus({ preventScroll: true });
    }
  };

  const showResult = (scroll: boolean) => {
    const result = evaluate(answers);
    questionsView.classList.add('hidden');
    resultView.classList.remove('hidden');
    stepLabel.textContent = 'Ergebnis';

    const style = GRADE_STYLES[result.grade.id];
    const scoreEl = resultView.querySelector<HTMLElement>('[data-hc-score]');
    const ring = resultView.querySelector<SVGCircleElement>('[data-hc-ring]');
    const grade = resultView.querySelector<HTMLElement>('[data-hc-grade]');
    const headline = resultView.querySelector<HTMLElement>('[data-hc-headline]');
    const text = resultView.querySelector<HTMLElement>('[data-hc-text]');

    if (scoreEl) animateNumber(scoreEl, result.score);
    if (ring) {
      const length = Number(ring.dataset.length);
      ring.classList.remove(...ALL_RING);
      ring.classList.add(style.ring);
      ring.style.strokeDashoffset = String(length);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          ring.style.strokeDashoffset = String(length * (1 - result.score / 100));
        })
      );
    }
    if (grade) {
      grade.classList.remove(...ALL_BADGE);
      grade.classList.add(...style.badge.split(' '));
      grade.textContent = result.grade.label;
    }
    if (headline) headline.textContent = result.grade.headline;
    if (text) text.textContent = result.grade.text;

    for (const dimension of result.dimensions) {
      const row = resultView.querySelector<HTMLElement>(`[data-hc-dim="${dimension.id}"]`);
      const value = row?.querySelector<HTMLElement>('[data-hc-dim-value]');
      const bar = row?.querySelector<HTMLElement>('[data-hc-dim-bar]');
      if (value) value.textContent = dimension.score === null ? 'n/a' : `${dimension.score}`;
      if (bar) {
        bar.classList.remove(...ALL_BAR);
        bar.classList.add(barClassFor(dimension.score));
        bar.style.width = '0%';
        requestAnimationFrame(() =>
          requestAnimationFrame(() => (bar.style.width = `${dimension.score ?? 0}%`))
        );
      }
    }

    const leversList = resultView.querySelector<HTMLOListElement>('[data-hc-levers]');
    if (leversList) {
      leversList.replaceChildren();
      const levers = result.levers.length
        ? result.levers
        : [{ title: 'Weiter so', text: 'Keine akuten Baustellen. Halte die Qualität mit regelmäßigen Reviews und Updates der Pipeline.' }];
      levers.forEach((lever, index) => {
        const li = document.createElement('li');
        li.className = 'flex gap-4';
        const num = document.createElement('span');
        num.className = 'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-950 font-mono text-sm text-lime-400';
        num.textContent = String(index + 1);
        const body = document.createElement('div');
        const title = document.createElement('p');
        title.className = 'font-bold text-ink-950';
        title.textContent = lever.title;
        const desc = document.createElement('p');
        desc.className = 'mt-1 text-sm leading-relaxed text-ink-600';
        desc.textContent = lever.text;
        body.append(title, desc);
        li.append(num, body);
        leversList.append(li);
      });
    }

    const rec = recommendationCopy[result.recommendation];
    const recTitle = resultView.querySelector<HTMLElement>('[data-hc-rec-title]');
    const recText = resultView.querySelector<HTMLElement>('[data-hc-rec-text]');
    const recLink = resultView.querySelector<HTMLAnchorElement>('[data-hc-rec-link]');
    if (recTitle) recTitle.textContent = rec.title;
    if (recText) recText.textContent = rec.text;
    if (recLink) recLink.href = to(rec.href);

    if (scroll) {
      resultView.focus({ preventScroll: true });
      root.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const showQuestions = () => {
    resultView.classList.add('hidden');
    questionsView.classList.remove('hidden');
    renderStep(true);
  };

  root.addEventListener('click', (event) => {
    const option = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-hc-option]');
    if (!option || advancing) return;
    const question = healthQuestions[current];
    const value = option.dataset.hcOption ?? '';
    if (!findOption(question.id, value)) return;

    answers = { ...answers, [question.id]: value };
    saveAnswers(answers);
    renderStep(false);
    advancing = true;
    window.setTimeout(() => {
      advancing = false;
      const next = healthQuestions.findIndex((q, i) => i > current && !answers[q.id]);
      if (current < healthQuestions.length - 1 && next !== -1) {
        current = next;
        renderStep(true);
      } else if (current < healthQuestions.length - 1) {
        current += 1;
        renderStep(true);
      } else if (isComplete(answers)) {
        showResult(true);
      }
    }, reduceMotion ? 0 : ADVANCE_DELAY_MS);
  });

  back.addEventListener('click', () => {
    if (current === 0) return;
    current -= 1;
    renderStep(true);
  });

  restart?.addEventListener('click', () => {
    answers = {};
    clearAnswers();
    current = 0;
    showQuestions();
    root.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  // Restore a previous session
  if (isComplete(answers)) {
    showResult(false);
  } else {
    const firstOpen = healthQuestions.findIndex((q) => !answers[q.id]);
    current = firstOpen === -1 ? 0 : firstOpen;
    renderStep(false);
  }
}

document.querySelectorAll<HTMLElement>('[data-health-check]').forEach(init);
