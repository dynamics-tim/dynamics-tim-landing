import { createHash, webcrypto } from 'node:crypto';
import { expect, test } from '@playwright/test';
import {
  buildPayload,
  fallbackMail,
  interpretResponse,
  isChallenge,
  normalizeText,
  solveChallenge,
  validateLead,
  webCryptoSha256,
  type LeadInput,
} from '../src/lib/lead';
import { makeChallenge } from './fixtures';

const valid: LeadInput = {
  kind: 'contact',
  name: 'Erika Mustermann',
  email: 'erika@example.com',
  company: 'Muster GmbH',
  role: 'it-leitung',
  message: 'Wir brauchen Unterstützung bei unseren Plugins.',
  consent: true,
};

test.describe('lead validation', () => {
  test('valid input has no errors', () => {
    expect(validateLead(valid)).toEqual({});
  });

  test('required fields, e-mail syntax and consent', () => {
    const errors = validateLead({ ...valid, name: ' ', email: 'kein-at', consent: false, message: 'kurz' });
    expect(Object.keys(errors).sort()).toEqual(['consent', 'email', 'message', 'name']);
  });

  test('health-check leads may omit the message', () => {
    expect(validateLead({ ...valid, kind: 'healthcheck', message: '' })).toEqual({});
  });

  test('unknown role and over-long fields are rejected', () => {
    const errors = validateLead({ ...valid, role: 'admin', company: 'x'.repeat(121), message: 'y'.repeat(3001) });
    expect(Object.keys(errors).sort()).toEqual(['company', 'message', 'role']);
  });

  test('normalizeText strips control and bidi-override characters', () => {
    expect(normalizeText('  Max‮\u0000 Muster​  ')).toBe('Max  Muster');
    expect(normalizeText('a\r\n\n\n\nb', true)).toBe('a\n\nb');
  });
});

test.describe('proof-of-work', () => {
  test('isChallenge only accepts the exact server shape', () => {
    const challenge = makeChallenge();
    expect(isChallenge(challenge)).toBe(true);
    expect(isChallenge({ ...challenge, maxnumber: 5_000_000 })).toBe(false); // refuse absurd work
    expect(isChallenge({ ...challenge, salt: 'x?expires=1' })).toBe(false);
    expect(isChallenge({ ...challenge, algorithm: 'MD5' })).toBe(false);
    expect(isChallenge(null)).toBe(false);
  });

  test('solver finds the secret number with WebCrypto', async () => {
    const challenge = makeChallenge(4242, 50_000) as ReturnType<typeof makeChallenge> & { algorithm: 'SHA-256' };
    const solution = await solveChallenge(challenge, webCryptoSha256(webcrypto.subtle as unknown as SubtleCrypto));
    expect(solution?.number).toBe(4242);
    expect(createHash('sha256').update(challenge.salt + solution?.number).digest('hex')).toBe(challenge.challenge);
  });

  test('solver gives up when the number is out of range', async () => {
    const challenge = { ...makeChallenge(150), maxnumber: 100 } as ReturnType<typeof makeChallenge> & { algorithm: 'SHA-256' };
    expect(await solveChallenge(challenge, webCryptoSha256(webcrypto.subtle as unknown as SubtleCrypto))).toBeNull();
  });
});

test.describe('payload & responses', () => {
  const pow = { algorithm: 'SHA-256' as const, challenge: 'a'.repeat(64), salt: 's', signature: 'b'.repeat(64), number: 1 };

  test('payload contains exactly the whitelisted keys', () => {
    const payload = buildPayload({ input: valid, fillMs: 5000.7, page: '/contact/', honeypot: '', pow });
    expect(Object.keys(payload).sort()).toEqual(
      ['consent', 'consentVersion', 'company', 'email', 'fillMs', 'kind', 'message', 'name', 'page', 'pow', 'role', 'v', 'website'].sort()
    );
    expect(payload.fillMs).toBe(5001);
  });

  test('health-check summary is only attached to health-check leads', () => {
    const healthCheck = { answers: { release: 'pipeline' }, score: 90, grade: 'exzellent', recommendation: 'sparring' };
    expect(buildPayload({ input: valid, fillMs: 1, page: '/', honeypot: '', pow, healthCheck })).not.toHaveProperty('healthCheck');
    expect(
      buildPayload({ input: { ...valid, kind: 'healthcheck' }, fillMs: 1, page: '/', honeypot: '', pow, healthCheck })
    ).toHaveProperty('healthCheck');
  });

  test('suspicious page paths are dropped', () => {
    expect(buildPayload({ input: valid, fillMs: 1, page: 'javascript:alert(1)', honeypot: '', pow }).page).toBe('');
  });

  test('response interpretation', () => {
    expect(interpretResponse(200, { ok: true })).toBe('ok');
    expect(interpretResponse(200, { message: 'Workflow was started' })).toBe('error'); // origin gate / unexpected
    expect(interpretResponse(400, { ok: false, error: 'expired' })).toBe('expired');
    expect(interpretResponse(400, { ok: false, error: 'invalid' })).toBe('invalid');
    expect(interpretResponse(429, null)).toBe('rate_limited');
    expect(interpretResponse(500, null)).toBe('error');
  });

  test('fallback mail is pre-filled but contains no e-mail header injection', () => {
    const mail = fallbackMail({ ...valid, name: 'Max\r\nBcc: evil@example.com' });
    expect(mail.subject).toBe('Projektanfrage über dynamics-tim.dev');
    expect(mail.body).toContain('Name: Max Bcc: evil@example.com'); // newline collapsed, stays in body
  });
});
