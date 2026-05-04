/**
 * Post-mortem protection terms by jurisdiction.
 *
 * `termYears` is a numeric value used purely for sorting:
 *   - Indefinite while commercially exploited → 9999 (sentinel for "top")
 *   - For tiered statutes (e.g., WA 75/10) → highest tier
 *
 * States not listed (Massachusetts, Rhode Island, Wisconsin, Utah, and all
 * common-law jurisdictions) do not have a codified post-mortem term.
 */
export interface PostMortemRow {
  jurisdiction: string;
  term: string;
  termYears: number;
  citation: string;
}

export const POST_MORTEM_ROWS: PostMortemRow[] = [
  { jurisdiction: 'Tennessee',     term: 'Indefinite while commercially exploited',                    termYears: 9999, citation: 'Tenn. Code Ann. § 47-25-1104' },
  { jurisdiction: 'Indiana',       term: '100 years',                                                  termYears: 100,  citation: 'Ind. Code § 32-36-1-8(a)' },
  { jurisdiction: 'Washington',    term: '75 years (personalities) / 10 years (individuals)',         termYears: 75,   citation: 'RCW 63.60.040' },
  { jurisdiction: 'California',    term: '70 years',                                                  termYears: 70,   citation: 'Cal. Civ. Code § 3344.1(g)' },
  { jurisdiction: 'Hawaii',        term: '70 years',                                                  termYears: 70,   citation: 'Haw. Rev. Stat. § 482P-4' },
  { jurisdiction: 'Ohio',          term: '60 years (10 years for armed forces)',                     termYears: 60,   citation: 'Ohio Rev. Code § 2741.02' },
  { jurisdiction: 'Texas',         term: '50 years',                                                  termYears: 50,   citation: 'Tex. Prop. Code § 26.012(d)' },
  { jurisdiction: 'Nevada',        term: '50 years',                                                  termYears: 50,   citation: 'NRS 597.790(1)' },
  { jurisdiction: 'Illinois',      term: '50 years',                                                  termYears: 50,   citation: '765 ILCS 1075/30' },
  { jurisdiction: 'Louisiana',     term: '50 years (audiovisual performance right expires at death)', termYears: 50,   citation: 'La. R.S. 51:470.3' },
  { jurisdiction: 'Kentucky',      term: '50 years (public figures only)',                           termYears: 50,   citation: 'KRS § 391.170(2)' },
  { jurisdiction: 'Florida',       term: '40 years',                                                  termYears: 40,   citation: 'Fla. Stat. § 540.08(5)' },
  { jurisdiction: 'New York',      term: '40 years',                                                  termYears: 40,   citation: 'N.Y. Civ. Rights L. § 50-f(8)' },
  { jurisdiction: 'Pennsylvania',  term: '30 years',                                                  termYears: 30,   citation: '42 Pa.C.S. § 8316(c)' },
  { jurisdiction: 'Virginia',      term: '20 years',                                                  termYears: 20,   citation: 'Va. Code § 8.01-40(B)' },
];
