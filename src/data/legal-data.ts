import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface LegalData {
  BUSINESS_NAME: string;
  ADDRESS: string;
  EMAIL: string;
  PHONE: string;
  VAT_ID: string;
  TRADE_REGISTER: string;
  SUPERVISORY_AUTH: string;
  DPO: string;
  HOSTING: string;
  PROCESSORS: string[];
  CONTACT_RETENTION_MONTHS: number;
}

const defaultData: LegalData = {
  BUSINESS_NAME: 'Tim Friedrich - Dynamics 365 Freelancer',
  ADDRESS: 'Heßlingerstraße 2, 88518 Herbertingen, Deutschland',
  EMAIL: 'hello@dynamics-tim.dev',
  PHONE: '+4915156940452',
  VAT_ID: 'DE453253034',
  TRADE_REGISTER: 'optional',
  SUPERVISORY_AUTH: '',
  DPO: 'Tim Friedrich',
  HOSTING: 'GitHub Pages',
  PROCESSORS: [
    'GitHub (Pages/CDN)',
    'GoatCounter (Analytics-Dienst) - Betrieb durch Martin Tournoij (Irland); Datenhosting bei Hetzner in Finnland und Deutschland',
    'Cal.com (nur bei Terminbuchung)'
  ],
  CONTACT_RETENTION_MONTHS: 6
};

function sanitize(raw: Partial<LegalData>): Partial<LegalData> {
  const sanitized: Partial<LegalData> = {};

  if (typeof raw.BUSINESS_NAME === 'string' && raw.BUSINESS_NAME.trim().length > 0) {
    sanitized.BUSINESS_NAME = raw.BUSINESS_NAME.trim();
  }

  if (typeof raw.ADDRESS === 'string' && raw.ADDRESS.trim().length > 0) {
    sanitized.ADDRESS = raw.ADDRESS.trim();
  }

  if (typeof raw.EMAIL === 'string' && raw.EMAIL.trim().length > 0) {
    sanitized.EMAIL = raw.EMAIL.trim();
  }

  if (typeof raw.PHONE === 'string' && raw.PHONE.trim().length > 0) {
    sanitized.PHONE = raw.PHONE.trim();
  }

  if (typeof raw.VAT_ID === 'string' && raw.VAT_ID.trim().length > 0) {
    sanitized.VAT_ID = raw.VAT_ID.trim();
  }

  if (typeof raw.TRADE_REGISTER === 'string') {
    sanitized.TRADE_REGISTER = raw.TRADE_REGISTER.trim();
  }

  if (typeof raw.SUPERVISORY_AUTH === 'string') {
    sanitized.SUPERVISORY_AUTH = raw.SUPERVISORY_AUTH.trim();
  }

  if (typeof raw.DPO === 'string') {
    sanitized.DPO = raw.DPO.trim();
  }

  if (typeof raw.HOSTING === 'string' && raw.HOSTING.trim().length > 0) {
    sanitized.HOSTING = raw.HOSTING.trim();
  }

  if (Array.isArray(raw.PROCESSORS)) {
    sanitized.PROCESSORS = raw.PROCESSORS.map((processor) => String(processor).trim()).filter((processor) => processor.length > 0);
  }

  if (typeof raw.CONTACT_RETENTION_MONTHS === 'number' && Number.isFinite(raw.CONTACT_RETENTION_MONTHS)) {
    sanitized.CONTACT_RETENTION_MONTHS = raw.CONTACT_RETENTION_MONTHS;
  }

  return sanitized;
}

function loadOverrides(): Partial<LegalData> {
  try {
    const moduleDir = dirname(fileURLToPath(import.meta.url));
    const envPath = join(moduleDir, '..', '..', 'env', '.env.json');

    if (!existsSync(envPath)) {
      return {};
    }

    const raw = readFileSync(envPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<LegalData>;

    return sanitize(parsed);
  } catch {
    return {};
  }
}

const legalData: LegalData = { ...defaultData, ...loadOverrides() };

export default legalData;
