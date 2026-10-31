/**
 * Persists the visitor's health-check ANSWERS (never personal data) in sessionStorage so a
 * reload keeps the result and the lead form can attach it. Storage can be unavailable
 * (private mode, blocked site data) — every access is guarded and falls back to memory.
 */
import { sanitizeAnswers, type HealthAnswers } from '../lib/health-check';

const STORAGE_KEY = 'dt-health-check:v1';
let memory: HealthAnswers = {};

export function loadAnswers(): HealthAnswers {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) return sanitizeAnswers(JSON.parse(raw));
  } catch {
    // storage blocked or corrupted — use the in-memory copy
  }
  return { ...memory };
}

export function saveAnswers(answers: HealthAnswers): void {
  memory = sanitizeAnswers(answers);
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // ignore — memory copy is enough for this page view
  }
}

export function clearAnswers(): void {
  memory = {};
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
