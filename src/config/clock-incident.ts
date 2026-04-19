/**
 * The reference incident for the Clock page.
 * Edit this file to reset the counter when a new unauthorized AI likeness
 * incident is flagged. The Clock will count up from `date` in real time.
 *
 * `date` must be an ISO 8601 string (UTC preferred).
 */
export const clockIncident = {
  date: '2026-04-15T14:00:00Z',
  headline: 'Placeholder: unauthorized AI voice clone of a working actor circulates on social',
  description:
    'A high-engagement clip featuring a synthetic version of a working actor\'s voice reading ad copy they never recorded spread across X and TikTok before being taken down.',
  sourceName: 'TBD',
  sourceUrl: 'https://example.com/incident',
} as const;
