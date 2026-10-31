/**
 * DOM wiring for components/LeadForm.astro.
 *
 * Flow: prefetch + solve the proof-of-work challenge in the background as soon as the form
 * is near the viewport → validate → POST (text/plain JSON, no cookies, no referrer path) →
 * success view. Anything unexpected falls back to a pre-filled e-mail so no lead is lost.
 * User input is only ever written with textContent / form values — never as HTML.
 */
import { evaluate, isComplete } from '../lib/health-check';
import {
  buildPayload,
  challengeExpiresAt,
  fallbackMail,
  interpretResponse,
  isChallenge,
  LEAD_KINDS,
  solveChallenge,
  validateLead,
  webCryptoSha256,
  type FieldErrors,
  type HealthCheckSummary,
  type LeadField,
  type LeadInput,
  type LeadKind,
  type PowSolution,
} from '../lib/lead';
import { loadAnswers } from './health-store';

const REQUEST_TIMEOUT_MS = 15_000;
/** Refetch a challenge if it would expire within this window */
const EXPIRY_MARGIN_MS = 60_000;

const KIND_COPY: Record<'contact' | 'recruiter', { label: string; placeholder: string; role: string }> = {
  contact: {
    label: 'Worum geht es?',
    placeholder: 'Kurz die Ausgangslage: Was läuft, was hakt, was ist das Ziel?',
    role: '',
  },
  recruiter: {
    label: 'Eckdaten der Rolle',
    placeholder: 'Start, Laufzeit, Auslastung, Remote-Anteil, Technologien, Tagessatz-Rahmen',
    role: 'recruiting',
  },
};

const pageLoadedAt = performance.now();

function withTimeout(ms: number): AbortSignal | undefined {
  return typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
    ? AbortSignal.timeout(ms)
    : undefined;
}

async function fetchChallenge(endpoint: string) {
  const response = await fetch(`${endpoint}/challenge`, {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-store',
    referrerPolicy: 'strict-origin',
    signal: withTimeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`challenge ${response.status}`);
  const data: unknown = await response.json();
  if (!isChallenge(data)) throw new Error('challenge shape');
  return data;
}

function healthSummary(): { summary: HealthCheckSummary; lines: string[] } | null {
  const answers = loadAnswers();
  if (!isComplete(answers)) return null;
  const result = evaluate(answers);
  const lines = [
    `Score: ${result.score}/100 (${result.grade.label})`,
    ...result.dimensions.map(
      (d) => `${d.label}: ${d.score === null ? 'n/a' : `${d.score}/100`}`
    ),
  ];
  return {
    summary: {
      answers: answers as Record<string, string>,
      score: result.score,
      grade: result.grade.id,
      recommendation: result.recommendation,
    },
    lines,
  };
}

function initForm(form: HTMLFormElement) {
  const root = form.closest<HTMLElement>('[data-lead-root]');
  const endpoint = form.dataset.endpoint ?? '';
  const baseKind = (form.dataset.kind ?? 'contact') as LeadKind;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]');
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]');
  const status = form.querySelector<HTMLElement>('[data-status]');
  const fallback = form.querySelector<HTMLElement>('[data-fallback]');
  const fallbackText = form.querySelector<HTMLElement>('[data-fallback-text]');
  const fallbackLink = form.querySelector<HTMLAnchorElement>('[data-fallback-link]');
  const success = root?.querySelector<HTMLElement>('[data-success]');
  const message = form.querySelector<HTMLTextAreaElement>('[data-message]');
  const messageLabel = form.querySelector<HTMLElement>('[data-message-label]');
  const roleSelect = form.elements.namedItem('role') as HTMLSelectElement | null;
  if (!submit || !submitLabel || !status || !fallback || !fallbackText || !fallbackLink || !success) {
    return;
  }
  const defaultSubmitLabel = submitLabel.textContent ?? '';

  // ── Proof-of-work, prepared in the background ──
  let pow: Promise<PowSolution | null> | null = null;
  let powExpiresAt = 0;
  const digest = window.crypto?.subtle ? webCryptoSha256(window.crypto.subtle) : null;

  const preparePow = (force = false) => {
    if (!endpoint || !digest) return null;
    if (!force && pow && powExpiresAt - Date.now() > EXPIRY_MARGIN_MS) return pow;
    pow = fetchChallenge(endpoint)
      .then((challenge) => {
        powExpiresAt = challengeExpiresAt(challenge);
        return solveChallenge(challenge, digest);
      })
      .catch(() => null);
    return pow;
  };

  const warmUp = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      warmUp.disconnect();
      preparePow();
    },
    { rootMargin: '400px 0px' }
  );
  warmUp.observe(form);
  form.addEventListener('focusin', () => preparePow(), { once: true });

  // ── Kind switch (contact ⇄ recruiter) ──
  const currentKind = (): LeadKind => {
    const checked = form.querySelector<HTMLInputElement>('[data-kind-radio]:checked');
    const value = (checked?.value ?? baseKind) as LeadKind;
    return LEAD_KINDS.includes(value) ? value : baseKind;
  };

  const applyKind = (kind: LeadKind) => {
    if (kind === 'healthcheck' || !message || !messageLabel) return;
    const copy = KIND_COPY[kind];
    messageLabel.textContent = copy.label;
    message.placeholder = copy.placeholder;
    if (roleSelect && (roleSelect.value === '' || roleSelect.value === 'recruiting')) {
      roleSelect.value = copy.role;
    }
  };

  form.querySelectorAll<HTMLInputElement>('[data-kind-radio]').forEach((radio) =>
    radio.addEventListener('change', () => applyKind(currentKind()))
  );

  // Deep links: #kontakt?recruiter or buttons with data-lead-kind="recruiter"
  document.querySelectorAll<HTMLElement>('[data-lead-kind]').forEach((trigger) =>
    trigger.addEventListener('click', () => {
      const wanted = trigger.dataset.leadKind;
      const radio = form.querySelector<HTMLInputElement>(`[data-kind-radio][value="${wanted === 'recruiter' ? 'recruiter' : 'contact'}"]`);
      if (radio) {
        radio.checked = true;
        applyKind(currentKind());
      }
    })
  );

  // ── Validation UI ──
  const fields: LeadField[] = ['name', 'email', 'company', 'role', 'message', 'consent'];

  const showErrors = (errors: FieldErrors) => {
    for (const field of fields) {
      const control = form.elements.namedItem(field) as HTMLInputElement | null;
      const errorEl = form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
      const text = errors[field];
      control?.setAttribute('aria-invalid', text ? 'true' : 'false');
      if (errorEl) {
        errorEl.textContent = text ?? '';
        errorEl.hidden = !text;
      }
    }
    const first = fields.find((field) => errors[field]);
    if (first) (form.elements.namedItem(first) as HTMLElement | null)?.focus();
  };

  const readInput = (): LeadInput => {
    const value = (name: string) =>
      ((form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '').slice(0, 5000);
    return {
      kind: currentKind(),
      name: value('name'),
      email: value('email'),
      company: value('company'),
      role: value('role'),
      message: value('message'),
      consent: (form.elements.namedItem('consent') as HTMLInputElement | null)?.checked === true,
    };
  };

  const setBusy = (busy: boolean, label?: string) => {
    submit.disabled = busy;
    submit.setAttribute('aria-busy', String(busy));
    submitLabel.textContent = busy ? (label ?? 'Wird gesendet …') : defaultSubmitLabel;
  };

  const showFallback = (input: LeadInput, reason: string, healthLines: string[]) => {
    const mail = fallbackMail(input, healthLines);
    const address = form.dataset.mail ?? '';
    fallbackLink.href = `mailto:${address}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`;
    fallbackText.textContent = reason;
    fallback.classList.remove('hidden');
    status.textContent = reason;
  };

  const showSuccess = (kind: LeadKind) => {
    const text = success.querySelector<HTMLElement>('[data-success-text]');
    if (text && kind === 'healthcheck') {
      text.textContent =
        'Ich schaue mir dein Ergebnis an und melde mich innerhalb von zwei Werktagen mit drei konkreten nächsten Schritten.';
    }
    form.reset(); // personal data does not linger in the DOM
    form.classList.add('hidden');
    success.classList.remove('hidden');
    success.focus();
  };

  // Clear a field's error as soon as the visitor fixes it
  form.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    if (target.getAttribute('aria-invalid') !== 'true') return;
    const errors = validateLead(readInput());
    const field = target.name as LeadField;
    if (!errors[field]) {
      target.setAttribute('aria-invalid', 'false');
      const errorEl = form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
      if (errorEl) errorEl.hidden = true;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    fallback.classList.add('hidden');

    const input = readInput();
    const errors = validateLead(input);
    showErrors(errors);
    if (Object.keys(errors).length > 0) {
      status.textContent = 'Bitte prüfe die markierten Felder.';
      return;
    }

    const health = input.kind === 'healthcheck' ? healthSummary() : null;
    const healthLines = health?.lines ?? [];
    if (input.kind === 'healthcheck' && !health) {
      showFallback(input, 'Dein Health-Check ist noch nicht vollständig. Beantworte bitte zuerst alle Fragen.', []);
      return;
    }
    if (!endpoint || !digest) {
      showFallback(input, 'Das Formular ist gerade nicht erreichbar. Schick mir deine Anfrage einfach per E-Mail, sie ist schon vorausgefüllt:', healthLines);
      return;
    }

    let succeeded = false;
    const honeypot = (form.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    const send = async (attempt: number): Promise<void> => {
      setBusy(true, 'Wird gesichert …');
      const solution = await (preparePow(attempt > 0) ?? Promise.resolve(null));
      if (!solution) throw new Error('pow');
      setBusy(true, 'Wird gesendet …');

      const payload = buildPayload({
        input,
        fillMs: performance.now() - pageLoadedAt,
        page: window.location.pathname,
        honeypot,
        pow: solution,
        healthCheck: health?.summary ?? null,
      });

      const response = await fetch(`${endpoint}/submit`, {
        method: 'POST',
        // text/plain keeps this a CORS "simple request" (no preflight); n8n parses the JSON
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload),
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'strict-origin',
        signal: withTimeout(REQUEST_TIMEOUT_MS),
      });
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      const outcome = interpretResponse(response.status, body);
      pow = null; // a challenge is single-use

      if (outcome === 'ok') {
        succeeded = true;
        showSuccess(input.kind);
        return;
      }
      if (outcome === 'expired' && attempt === 0) return send(1);
      if (outcome === 'rate_limited') {
        showFallback(input, 'Gerade kommen sehr viele Anfragen an. Schick mir deine Nachricht bitte direkt per E-Mail, sie ist schon vorausgefüllt:', healthLines);
        return;
      }
      throw new Error(outcome);
    };

    try {
      await send(0);
    } catch {
      showFallback(input, 'Die Übertragung hat nicht geklappt. Kein Problem: Schick mir deine Anfrage per E-Mail, sie ist schon vorausgefüllt:', healthLines);
    } finally {
      setBusy(false);
      // Prepare a fresh single-use challenge for a retry — not needed after success
      if (!succeeded) preparePow(true);
    }
  });

  applyKind(currentKind());
}

document.querySelectorAll<HTMLFormElement>('[data-lead-form]').forEach(initForm);
