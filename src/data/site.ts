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
    /** Used in the footer */
    github: 'https://github.com/tecktim',
    /** Used in the footer */
    linkedin: 'https://www.linkedin.com/in/tim-friedrich-37a166203/',
    /**
     * Used on the profile page.
     * NOTE: differs from `linkedin` above — kept as-is during the refactoring,
     * consolidate once the correct profile URL is confirmed.
     */
    linkedinProfilePage: 'https://www.linkedin.com/in/tim-friedrich-dynamics365/',
  },

  seo: {
    /**
     * `sameAs` links in the Person JSON-LD (SeoHead).
     * NOTE: these differ from `social` above — kept as-is during the
     * refactoring, consolidate once the correct URLs are confirmed.
     */
    sameAs: [
      'https://github.com/tim-freelance',
      'https://www.linkedin.com/in/tim-friedrich',
      'https://www.youtube.com/@tim-freelance',
    ],
  },
} as const;

/** Build a `mailto:` link with a pre-filled subject and (optional) body. */
export function mailtoWith(subject: string, body?: string): string {
  const params = [`subject=${encodeURIComponent(subject)}`];
  if (body !== undefined) params.push(`body=${encodeURIComponent(body)}`);
  return `${site.contact.mailto}?${params.join('&')}`;
}
