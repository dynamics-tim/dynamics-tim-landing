/**
 * Central site configuration — the single place for values that appear on
 * several pages (contact data, booking link, availability, social profiles).
 *
 * Change a value here and every page/component picks it up.
 */

const email = 'hello@dynamics-tim.dev';

export const site = {
  name: 'Tim Friedrich',

  availability: {
    /** Display label shown in the UI, e.g. "Q1 2027" */
    label: 'Q1 2027',
    /** ISO date of the first available day */
    availableFrom: '2027-02-01',
  },

  contact: {
    email,
    mailto: `mailto:${email}`,
    /** Microsoft Bookings / Outlook "book with me" page for the free 30-min call */
    bookingUrl:
      'https://outlook.office.com/bookwithme/user/c7bd6282644a4fcb82fd8cc491a921e5@dynamics-tim.dev?anonymous&ismsaljsauthenabled&ep=plink',
  },

  social: {
    github: 'https://github.com/dynamics-tim',
    linkedin: 'https://www.linkedin.com/in/tim-friedrich-37a166203/',
  },

  /** Home base shown in hero, recruiter facts and footer */
  location: 'Oberschwaben · Remote DACH',

  /**
   * Lead endpoint base (n8n workflow "Website-Leads · dynamics-tim.dev").
   * `GET {leadApi}/challenge` issues a proof-of-work challenge, `POST {leadApi}/submit`
   * accepts a lead. The URL is public by design — security lives server-side (see
   * src/lib/lead.ts). Override with PUBLIC_LEAD_API, set it to "off" to disable the form.
   */
  // `import.meta.env` is undefined when this module runs outside Vite (Playwright unit tests)
  leadApi: resolveLeadApi(import.meta.env?.PUBLIC_LEAD_API),
} as const;

function resolveLeadApi(value: string | undefined): string | null {
  if (value === 'off') return null;
  const url = value?.trim() || 'https://n8n.dynamics-tim.dev/webhook/dt-lead';
  return /^https:\/\/[^\s/]+\/\S+$/.test(url) ? url.replace(/\/$/, '') : null;
}

/** Build a `mailto:` link with a pre-filled subject and (optional) body. */
export function mailtoWith(subject: string, body?: string): string {
  const params = [`subject=${encodeURIComponent(subject)}`];
  if (body !== undefined) params.push(`body=${encodeURIComponent(body)}`);
  return `${site.contact.mailto}?${params.join('&')}`;
}
