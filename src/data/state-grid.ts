/**
 * Tile-grid layout for the US map. Each state has (col, row) coordinates.
 * Layout chosen for readability on desktop — geographically roughly correct,
 * but every state gets the same tile size (so Rhode Island reads the same
 * as Texas). This is an editorial choice: equal visual weight.
 */
export interface GridCell {
  abbr: string;
  col: number;
  row: number;
}

export const STATE_GRID: GridCell[] = [
  { abbr: 'AK', col: 0, row: 0 },
  { abbr: 'ME', col: 10, row: 0 },

  { abbr: 'VT', col: 9, row: 1 },
  { abbr: 'NH', col: 10, row: 1 },

  { abbr: 'WA', col: 1, row: 2 },
  { abbr: 'ID', col: 2, row: 2 },
  { abbr: 'MT', col: 3, row: 2 },
  { abbr: 'ND', col: 4, row: 2 },
  { abbr: 'MN', col: 5, row: 2 },
  { abbr: 'WI', col: 6, row: 2 },
  { abbr: 'MI', col: 8, row: 2 },
  { abbr: 'NY', col: 9, row: 2 },
  { abbr: 'MA', col: 10, row: 2 },

  { abbr: 'OR', col: 1, row: 3 },
  { abbr: 'NV', col: 2, row: 3 },
  { abbr: 'WY', col: 3, row: 3 },
  { abbr: 'SD', col: 4, row: 3 },
  { abbr: 'IA', col: 5, row: 3 },
  { abbr: 'IL', col: 6, row: 3 },
  { abbr: 'IN', col: 7, row: 3 },
  { abbr: 'OH', col: 8, row: 3 },
  { abbr: 'PA', col: 9, row: 3 },
  { abbr: 'NJ', col: 10, row: 3 },
  { abbr: 'CT', col: 11, row: 3 },

  { abbr: 'CA', col: 1, row: 4 },
  { abbr: 'UT', col: 2, row: 4 },
  { abbr: 'CO', col: 3, row: 4 },
  { abbr: 'NE', col: 4, row: 4 },
  { abbr: 'MO', col: 5, row: 4 },
  { abbr: 'KY', col: 6, row: 4 },
  { abbr: 'WV', col: 8, row: 4 },
  { abbr: 'VA', col: 9, row: 4 },
  { abbr: 'MD', col: 10, row: 4 },
  { abbr: 'DE', col: 11, row: 4 },
  { abbr: 'RI', col: 12, row: 4 },

  { abbr: 'AZ', col: 2, row: 5 },
  { abbr: 'NM', col: 3, row: 5 },
  { abbr: 'KS', col: 4, row: 5 },
  { abbr: 'AR', col: 5, row: 5 },
  { abbr: 'TN', col: 6, row: 5 },
  { abbr: 'NC', col: 8, row: 5 },
  { abbr: 'SC', col: 9, row: 5 },

  { abbr: 'HI', col: 0, row: 6 },
  { abbr: 'OK', col: 4, row: 6 },
  { abbr: 'LA', col: 5, row: 6 },
  { abbr: 'MS', col: 6, row: 6 },
  { abbr: 'AL', col: 7, row: 6 },
  { abbr: 'GA', col: 8, row: 6 },

  { abbr: 'TX', col: 4, row: 7 },
  { abbr: 'FL', col: 8, row: 7 },
];

export const GRID_COLS = 13;
export const GRID_ROWS = 8;
