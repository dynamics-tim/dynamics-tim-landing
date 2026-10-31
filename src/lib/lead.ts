/**
 * Pure (DOM-free) lead logic shared by every form on the site: validation, payload,
 * proof-of-work solver and response handling. DOM wiring: `scripts/lead-form.ts`.
 *
 * ── Security model ──────────────────────────────────────────────────────────────────
 * The site is static, so the n8n endpoint is public by design and NO secret ever lives
 * in the browser. Everything here is UX — the server re-validates all of it:
 *   1. Origin gate (only https://dynamics-tim.dev triggers an execution)
 *   2. Honeypot field + minimum fill time            → silent drop
 *   3. Strict whitelist schema, length limits, control-character stripping
 *   4. Proof-of-work (SHA-256, HMAC-signed challenge, 10 min TTL) → cost per request
 *   5. Replay protection + rate limit (5/h per salted IP hash, 40/h global)
 *   6. No automatic e-mail to the submitted address (no abuse as a mail cannon),
 *      Telegram notification without personal data, 6-month retention
 * The constants below MIRROR the n8n "Prüfen & entscheiden" node — change both together.
 */

export type LeadKind = 'healthcheck' | 'contact' | 'recruiter';
export const LEAD_KINDS: readonly LeadKind[] = ['healthcheck', 'contact', 'recruiter'];

export const LEAD_LIMITS = { name: 100, email: 254, company: 120, message: 3000 } as const;
export const MIN_MESSAGE_LENGTH = 10;
/** The server silently drops submissions faster than this (bot heuristic) */
export const MIN_FILL_MS = 2500;
/** Bump together with the privacy policy; stored with every lead */
export const CONSENT_VERSION = '2026-11';

export const ROLE_OPTIONS = [
  { value: '', label: 'Bitte wählen (optional)' },
  { value: 'it-leitung', label: 'IT-Leitung' },
  { value: 'crm', label: 'CRM-Verantwortung / Product Owner' },
  { value: 'fachbereich', label: 'Fachbereich (Vertrieb, Service)' },
  { value: 'entwicklung', label: 'Entwicklung' },
  { value: 'geschaeftsfuehrung', label: 'Geschäftsführung' },
  { value: 'recruiting', label: 'Recruiting / Agentur' },
  { value: 'sonstiges', label: 'Sonstiges' },
] as const;

const ROLE_VALUES = new Set<string>(ROLE_OPTIONS.map((r) => r.value));

/** Same pattern as the server (HTML living standard e-mail syntax). */
export const EMAIL_RE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export interface LeadInput {
  kind: LeadKind;
  name: string;
  email: string;
  company: string;
  role: string;
  message: string;
  consent: boolean;
}

export type LeadField = 'name' | 'email' | 'company' | 'role' | 'message' | 'consent';
export type FieldErrors = Partial<Record<LeadField, string>>;

export interface HealthCheckSummary {
  answers: Record<string, string>;
  score: number;
  grade: string;
  recommendation: string;
}

/** Trim and strip control / bidi-override characters (mirrors the server). */
export function normalizeText(value: string, multiline = false): string {
  const stripped = value
    .normalize('NFC')
    .replace(/[\u202A-\u202E\u2066-\u2069\u200B-\u200F\uFEFF]/g, '');
  const cleaned = multiline
    ? stripped
        .replace(/\r\n?/g, '\n')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .replace(/\n{3,}/g, '\n\n')
    : // eslint-disable-next-line no-control-regex
      stripped.replace(/[\u0000-\u001F\u007F]+/g, ' ');
  return cleaned.trim();
}

export function normalizeInput(input: LeadInput): LeadInput {
  return {
    kind: input.kind,
    name: normalizeText(input.name),
    email: normalizeText(input.email),
    company: normalizeText(input.company),
    role: normalizeText(input.role),
    message: normalizeText(input.message, true),
    consent: input.consent === true,
  };
}

/** Client-side validation with German messages. Returns an empty object when valid. */
export function validateLead(raw: LeadInput): FieldErrors {
  const input = normalizeInput(raw);
  const errors: FieldErrors = {};

  if (input.name.length < 2) errors.name = 'Bitte gib deinen Namen an.';
  else if (input.name.length > LEAD_LIMITS.name) errors.name = 'Der Name ist zu lang.';

  if (!input.email) errors.email = 'Bitte gib deine E-Mail-Adresse an.';
  else if (input.email.length > LEAD_LIMITS.email || !EMAIL_RE.test(input.email)) {
    errors.email = 'Diese E-Mail-Adresse sieht nicht gültig aus.';
  }

  if (input.company.length > LEAD_LIMITS.company) errors.company = 'Der Firmenname ist zu lang.';
  if (!ROLE_VALUES.has(input.role)) errors.role = 'Bitte wähle eine Rolle aus der Liste.';

  if (input.message.length > LEAD_LIMITS.message) {
    errors.message = `Maximal ${LEAD_LIMITS.message} Zeichen.`;
  } else if (input.kind !== 'healthcheck' && input.message.length < MIN_MESSAGE_LENGTH) {
    errors.message = 'Beschreibe kurz dein Anliegen (mindestens ein Satz).';
  }

  if (!input.consent) errors.consent = 'Bitte bestätige die Datenschutzhinweise.';
  return errors;
}

// ── Proof-of-work ────────────────────────────────────────────────────────────────

export interface Challenge {
  algorithm: 'SHA-256';
  challenge: string;
  salt: string;
  signature: string;
  maxnumber: number;
}

export interface PowSolution {
  algorithm: 'SHA-256';
  challenge: string;
  salt: string;
  signature: string;
  number: number;
}

const HEX64 = /^[a-f0-9]{64}$/;
const SALT_RE = /^[a-f0-9]{24}\?expires=\d{10}$/;
/** Refuse absurd work factors even if the server (or a MITM) asks for them */
export const MAX_ACCEPTED_WORK = 1_000_000;

export function isChallenge(value: unknown): value is Challenge {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  return (
    c.algorithm === 'SHA-256' &&
    typeof c.challenge === 'string' &&
    HEX64.test(c.challenge) &&
    typeof c.signature === 'string' &&
    HEX64.test(c.signature) &&
    typeof c.salt === 'string' &&
    SALT_RE.test(c.salt) &&
    Number.isInteger(c.maxnumber) &&
    (c.maxnumber as number) > 0 &&
    (c.maxnumber as number) <= MAX_ACCEPTED_WORK
  );
}

/** Seconds-precision expiry encoded in the salt. */
export function challengeExpiresAt(challenge: Challenge): number {
  const match = /expires=(\d{10})$/.exec(challenge.salt);
  return match ? Number(match[1]) * 1000 : 0;
}

export type DigestHex = (input: string) => Promise<string>;

/** SHA-256 hex digest via WebCrypto (browser) — injected so the solver stays testable. */
export function webCryptoSha256(subtle: SubtleCrypto): DigestHex {
  const encoder = new TextEncoder();
  return async (input) => {
    const buffer = await subtle.digest('SHA-256', encoder.encode(input));
    let hex = '';
    for (const byte of new Uint8Array(buffer)) hex += byte.toString(16).padStart(2, '0');
    return hex;
  };
}

/**
 * Brute-force the secret number (ALTCHA scheme): find n with sha256(salt + n) === challenge.
 * Hashes in parallel batches; returns `null` when not found or aborted.
 */
export async function solveChallenge(
  challenge: Challenge,
  digest: DigestHex,
  options: { batchSize?: number; signal?: AbortSignal } = {}
): Promise<PowSolution | null> {
  const batchSize = options.batchSize ?? 400;
  const max = Math.min(challenge.maxnumber, MAX_ACCEPTED_WORK);
  for (let start = 0; start <= max; start += batchSize) {
    if (options.signal?.aborted) return null;
    const end = Math.min(start + batchSize - 1, max);
    const candidates: number[] = [];
    for (let n = start; n <= end; n += 1) candidates.push(n);
    const hashes = await Promise.all(candidates.map((n) => digest(challenge.salt + n)));
    const hit = hashes.indexOf(challenge.challenge);
    if (hit !== -1) {
      return {
        algorithm: challenge.algorithm,
        challenge: challenge.challenge,
        salt: challenge.salt,
        signature: challenge.signature,
        number: candidates[hit],
      };
    }
  }
  return null;
}

// ── Payload & response ───────────────────────────────────────────────────────────

export interface PayloadOptions {
  input: LeadInput;
  fillMs: number;
  page: string;
  honeypot: string;
  pow: PowSolution;
  healthCheck?: HealthCheckSummary | null;
}

/** Only these keys are ever sent — nothing else from the DOM leaks into the request. */
export function buildPayload(options: PayloadOptions): Record<string, unknown> {
  const input = normalizeInput(options.input);
  const payload: Record<string, unknown> = {
    v: 1,
    kind: input.kind,
    name: input.name,
    email: input.email,
    company: input.company,
    role: input.role,
    message: input.message,
    consent: input.consent,
    consentVersion: CONSENT_VERSION,
    page: /^\/[A-Za-z0-9\-._~/]*$/.test(options.page) ? options.page.slice(0, 200) : '',
    website: options.honeypot,
    fillMs: Math.max(0, Math.round(options.fillMs)),
    pow: options.pow,
  };
  if (input.kind === 'healthcheck' && options.healthCheck) {
    payload.healthCheck = options.healthCheck;
  }
  return payload;
}

export type SubmitOutcome = 'ok' | 'expired' | 'invalid' | 'rate_limited' | 'error';

export function interpretResponse(status: number, body: unknown): SubmitOutcome {
  const data = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  if (status === 200 && data.ok === true) return 'ok';
  if (status === 429) return 'rate_limited';
  if (status === 400 && data.error === 'expired') return 'expired';
  if (status === 400) return 'invalid';
  return 'error';
}

const KIND_SUBJECT: Record<LeadKind, string> = {
  healthcheck: 'Health-Check: persönliche Auswertung',
  contact: 'Projektanfrage über dynamics-tim.dev',
  recruiter: 'Recruiter-Anfrage über dynamics-tim.dev',
};

/** Fallback when the endpoint is unreachable: a pre-filled e-mail the visitor sends themselves. */
export function fallbackMail(input: LeadInput, healthSummaryLines: string[] = []) {
  const clean = normalizeInput(input);
  const lines = [
    'Hallo Tim,',
    '',
    clean.message || 'ich interessiere mich für eine persönliche Auswertung meines Health-Checks.',
    '',
    ...(healthSummaryLines.length ? ['Mein Health-Check:', ...healthSummaryLines, ''] : []),
    `Name: ${clean.name}`,
    clean.company ? `Firma: ${clean.company}` : '',
    '',
    'Viele Grüße',
  ].filter((line, i, all) => line !== '' || all[i - 1] !== '');
  return { subject: KIND_SUBJECT[clean.kind], body: lines.join('\n') };
}
