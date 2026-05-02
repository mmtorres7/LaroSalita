// WordsUgnayan.js

// ─────────────────────────────────────────
//  DIFFICULTY COLORS
// ─────────────────────────────────────────
export const LEVELS = [
  { id: 0, label: "Madali", color: "#c8a84b", bg: "#4a3a10" },
  { id: 1, label: "Katamtaman", color: "#6aab5e", bg: "#1a3318" },
  { id: 2, label: "Mahirap", color: "#5b8dd9", bg: "#0f2044" },
  { id: 3, label: "Napakahirap", color: "#b05fc7", bg: "#2d1040" },
];

// ─────────────────────────────────────────
//  PUZZLE BANK
// ─────────────────────────────────────────
export const PUZZLES = [
  {
    id: 0,
    groups: [
      {
        level: 0,
        theme: "Bahagi ng Katawan",
        words: ["KAMAY", "PUSO", "MATA", "ILONG"],
      },
      {
        level: 1,
        theme: "Kulay",
        words: ["PULA", "BERDE", "ASUL", "DILAW"],
      },
      {
        level: 2,
        theme: "Hayop sa Bukid",
        words: ["BAKA", "BABOY", "MANOK", "KALABAW"],
      },
      {
        level: 3,
        theme: "Nagsisimula sa 'B' na Pagkain",
        words: ["BAGOONG", "BIBINGKA", "BALUT", "BANGUS"],
      },
    ],
  },

  {
    id: 1,
    groups: [
      {
        level: 0,
        theme: "Panahon",
        words: ["ULAN", "ARAW", "BAGYO", "HANGIN"],
      },
      {
        level: 1,
        theme: "Bahagi ng Bahay",
        words: ["PINTO", "BINTANA", "DINGDING", "BUBONG"],
      },
      {
        level: 2,
        theme: "Wikang Pandama",
        words: ["INIT", "LAMIG", "TUNOG", "AMOY"],
      },
      {
        level: 3,
        theme: "Maaaring sumunod sa 'MA-'",
        words: ["HAL", "BUTI", "GANDA", "LAKAS"],
      },
    ],
  },

  {
    id: 2,
    groups: [
      {
        level: 0,
        theme: "Prutas",
        words: ["MANGGA", "BAYABAS", "SAGING", "LANGKA"],
      },
      {
        level: 1,
        theme: "Uri ng Tubig",
        words: ["DAGAT", "ILOG", "LAWA", "BUKAL"],
      },
      {
        level: 2,
        theme: "Bilang",
        words: ["ISA", "DALAWA", "TATLO", "LIMA"],
      },
      {
        level: 3,
        theme: "Panlapi na Nagpapakita ng Kilos",
        words: ["TAKBO", "LAKAD", "LUPAD", "LANGOY"],
      },
    ],
  },

  {
    id: 3,
    groups: [
      {
        level: 0,
        theme: "Damit",
        words: ["POLO", "PALDA", "MAONG", "SAPATOS"],
      },
      {
        level: 1,
        theme: "Emosyon",
        words: ["TUWA", "LUNGKOT", "GALIT", "TAKOT"],
      },
      {
        level: 2,
        theme: "Gamit sa Kusina",
        words: ["KALDERO", "KAWALI", "SANDOK", "PALAYOK"],
      },
      {
        level: 3,
        theme: "Katangian ng Bayani",
        words: ["TAPANG", "TAPAT", "MALAKAS", "MARUNONG"],
      },
    ],
  },
];