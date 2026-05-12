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
  // ── ORIGINAL PUZZLES ──────────────────
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

  // ── SET 1 ─────────────────────────────
  {
    id: 4,
    groups: [
      {
        level: 0,
        theme: "Mga Kilalang Isda",
        words: ["BANGUS", "TILAPIA", "GALUNGGONG", "MAYA-MAYA"],
      },
      {
        level: 1,
        theme: "Maaasim na Prutas",
        words: ["DAYAP", "KAMIAS", "CATMON", "CALAMANSI"],
      },
      {
        level: 2,
        theme: "Mga Karaniwang Sangkap sa Sinigang",
        words: ["KAMATIS", "SAMPALOK", "OKRA", "KANGKONG"],
      },
      {
        level: 3,
        theme: "Mga Prutas na Berde Kapag Hinog",
        words: ["ABOKADO", "BAYABAS", "PAKWAN", "BALIMBING"],
      },
    ],
  },

  // ── SET 2 ─────────────────────────────
  {
    id: 5,
    groups: [
      {
        level: 0,
        theme: "Mga Salitang sa Ingles ay \"Correct\"",
        words: ["TAMA", "TUMPAK", "WASTO", "EKSAKTO"],
      },
      {
        level: 1,
        theme: "Mga Salitang sa Ingles ay \"Wrong\"",
        words: ["MALI", "MASAMA", "SALA", "KABALIGTARAN"],
      },
      {
        level: 2,
        theme: "Mga Salitang sa Ingles ay \"Left\"",
        words: ["ALIS", "KALIWA", "NATIRA", "PROGRESIBO"],
      },
      {
        level: 3,
        theme: "Mga Salitang sa Ingles ay \"Right\"",
        words: ["MAAYOS", "KANAN", "MATUWID", "KARAPATAN"],
      },
    ],
  },

  // ── SET 3 ─────────────────────────────
  {
    id: 6,
    groups: [
      {
        level: 0,
        theme: "Paghihirap",
        words: ["DALITA", "SALAT", "POBRE", "SAKIT"],
      },
      {
        level: 1,
        theme: "Mga Salitang sa Ingles ay \"Challenge\" o \"Defiance\"",
        words: ["RETO", "LABAN", "SUWAY", "TUTOL"],
      },
      {
        level: 2,
        theme: "Mga Kilalang Bayani ng Pilipinas",
        words: ["RIZAL", "BONIFACIO", "DEL PILAR", "MABINI"],
      },
      {
        level: 3,
        theme: "Karaniwang Tradisyon/Kagamitan Tuwing Pasko",
        words: ["AGUINALDO", "HAMON", "PAROL", "BELEN"],
      },
    ],
  },

  // ── SET 4 ─────────────────────────────
  {
    id: 7,
    groups: [
      {
        level: 0,
        theme: "Mga Lugar sa Region II",
        words: ["BATANES", "CAGAYAN", "ISABELA", "NUEVA VIZCAYA"],
      },
      {
        level: 1,
        theme: "Mga Lugar na May Kilalang Tabing-Dagat",
        words: ["AKLAN", "PALAWAN", "BOHOL", "SIARGAO"],
      },
      {
        level: 2,
        theme: "Mga Lugar na May Kilalang Bulkan",
        words: ["ALBAY", "BATANGAS", "NEGROS", "ZAMBALES"],
      },
      {
        level: 3,
        theme: "Mga Lugar na may Pinakamalaking Populasyon",
        words: ["CEBU", "BULACAN", "CAVITE", "LAGUNA"],
      },
    ],
  },

  // ── SET 5 ─────────────────────────────
  {
    id: 8,
    groups: [
      {
        level: 0,
        theme: "Mga Kilalang Mapanirang Bagyo sa Pilipinas",
        words: ["YOLANDA", "ONDOY", "ODETTE", "PABLO"],
      },
      {
        level: 1,
        theme: "Pangalan ng Mga Santo",
        words: ["PEDRO", "JUAN", "AGUSTIN", "JOSE"],
      },
      {
        level: 2,
        theme: "Mga Ipiniprito",
        words: ["MANOK", "SABA", "TALONG", "TOKWA"],
      },
      {
        level: 3,
        theme: "Kahulugan ng Salitang \"Sira\" sa Iba't Ibang Wika ng Pilipinas",
        words: ["BALIW", "ISDA", "PINSALA", "DEPEKTIBO"],
      },
    ],
  },

  // ── SET 6 ─────────────────────────────
  {
    id: 9,
    groups: [
      {
        level: 0,
        theme: "Uri ng Ibon",
        words: ["KALAPATI", "UWAK", "MANOK", "MULAWIN"],
      },
      {
        level: 1,
        theme: "Mga Domesticated na Hayop na Herbivore",
        words: ["BAKA", "KAMBING", "TUPA", "KABAYO"],
      },
      {
        level: 2,
        theme: "Simbolikong Hayop sa Pilipinas",
        words: ["BUWAYA", "TAMARAW", "KALABAW", "BANGUS"],
      },
      {
        level: 3,
        theme: "Hayop na Makikita sa Philippine Bills",
        words: ["AGILA", "USA", "PABO", "LEOPARDO"],
      },
    ],
  },

  // ── SET 8 ─────────────────────────────
  {
    id: 10,
    groups: [
      {
        level: 0,
        theme: "Kasapi ng Katipunan",
        words: ["BONIFACIO", "JACINTO", "BASA", "MABINI"],
      },
      {
        level: 1,
        theme: "Mga Pangulo ng Pilipinas",
        words: ["AQUINO", "AGUINALDO", "MACAPAGAL", "MAGSAYSAY"],
      },
      {
        level: 2,
        theme: "Mga Kilalang Pilipino sa Kasaysayan",
        words: ["RIZAL", "QUEZON", "QUIRINO", "SULTAN KUDARAT"],
      },
      {
        level: 3,
        theme: "Mga Depensa ni Joseph Estrada sa Impeachment",
        words: ["FLAMINIANO", "DAZA", "MENDOZA", "NARVASA"],
      },
    ],
  },

  // ── SET 9 ─────────────────────────────
  {
    id: 11,
    groups: [
      {
        level: 0,
        theme: "Mga Karaniwang Bulaklak sa Pilipinas",
        words: ["GUMAMELA", "SAMPAGUITA", "YLANG-YLANG", "SANTAN"],
      },
      {
        level: 1,
        theme: "Mga Kakanin",
        words: ["SUMAN", "KUTSINTA", "SAPIN-SAPIN", "PUTO"],
      },
      {
        level: 2,
        theme: "Karaniwang Kulay ng Gumamela",
        words: ["ROSAS", "PUTI", "DILAW", "PULA"],
      },
      {
        level: 3,
        theme: "Karaniwang Tinitinda sa Simbahan",
        words: ["BIBINGKA", "BIBLIYA", "ROSARYO", "KANDILA"],
      },
    ],
  },

  // ── SET 10 ────────────────────────────
  {
    id: 12,
    groups: [
      {
        level: 0,
        theme: "Mga Nausong Binaligtad o Pinaikling Salita",
        words: ["ASTIG", "PETMALU", "LODI", "CHIKA"],
      },
      {
        level: 1,
        theme: "Mga Salitang Gamit Kapag May Diprensya ang Isang Bagay",
        words: ["BASAG", "WASAK", "GIBA", "PUNIT"],
      },
      {
        level: 2,
        theme: "Mga Sawsawang Pinoy",
        words: ["SUKA", "PATIS", "BAGOONG", "ATCHARA"],
      },
      {
        level: 3,
        theme: "Mga Katawagan para sa \"Baliw\"",
        words: ["TOYO", "SIRA", "SALTIK", "TOPAK"],
      },
    ],
  },

  // ── SET 11 ────────────────────────────
  {
    id: 13,
    groups: [
      {
        level: 0,
        theme: "Mga Parte ng Katawan sa Pambatang Kanta",
        words: ["ULO", "BALIKAT", "TUHOD", "PAA"],
      },
      {
        level: 1,
        theme: "Mga Lumalabas sa Katawan",
        words: ["IHI", "TAE", "KULANGOT", "PLEMA"],
      },
      {
        level: 2,
        theme: "Mga Bagay na Karaniwang Kinukulayang Pula",
        words: ["ROSAS", "PUSO", "SILI", "MANSANAS"],
      },
      {
        level: 3,
        theme: "Mga Bagay na Tumataas",
        words: ["PRESYO", "DUGO", "BAHA", "KILAY"],
      },
    ],
  },

  // ── SET 12 ────────────────────────────
  {
    id: 14,
    groups: [
      {
        level: 0,
        theme: "Mga Kadalasang Binabanggit sa mga Larong Pinoy",
        words: ["TAYMPERS", "SALIMPUSA", "TAYA", "SIRIT"],
      },
      {
        level: 1,
        theme: "Mga Hayop na Nangingitlog",
        words: ["AHAS", "MANOK", "BUWAYA", "PALAKA"],
      },
      {
        level: 2,
        theme: "Mga Ibon na Karaniwang sa Tubig Namamalagi",
        words: ["BIBE", "ITIK", "GANSA", "PATO"],
      },
      {
        level: 3,
        theme: "Mga Karaniwang Kinatatakutan sa Karagatan",
        words: ["DIKYA", "PATING", "SYOKOY", "KALALIMAN"],
      },
    ],
  },

  // ── SET 13 ────────────────────────────
  {
    id: 15,
    groups: [
      {
        level: 0,
        theme: "Mga Kulay",
        words: ["MURADO", "KUNIG", "ASUL", "ABO"],
      },
      {
        level: 1,
        theme: "Mga Hayop sa Bukid",
        words: ["MANOK", "BABOY", "KAMBING", "BAKA"],
      },
      {
        level: 2,
        theme: "Mga Prutas na Pareho ang Pangalan sa Ingles at Filipino",
        words: ["DURIAN", "CHICO", "RAMBUTAN", "PAPAYA"],
      },
      {
        level: 3,
        theme: "Mga Uri ng Mangga",
        words: ["KALABAW", "PIKO", "INDIAN", "PADERA"],
      },
    ],
  },

  // ── SET 14 ────────────────────────────
  {
    id: 16,
    groups: [
      {
        level: 0,
        theme: "Mga Kilalang Pagkain sa Batangas",
        words: ["KALAMAY", "BULALO", "LOMI", "MAMI"],
      },
      {
        level: 1,
        theme: "Mga Karaniwang Almusal",
        words: ["PANDESAL", "SUMAN", "CHAMPORADO", "LUGAW"],
      },
      {
        level: 2,
        theme: "Mga Karaniwang Nakikita sa Burol",
        words: ["BARAHA", "KAPE", "KENDI", "BULAKLAK"],
      },
      {
        level: 3,
        theme: "Mga Karaniwang Pinapabili sa mga Bata sa Sari-Sari Store",
        words: ["SITSIRYA", "SABON", "PALAMIG", "TOYO"],
      },
    ],
  },

  // ── SET 15 ────────────────────────────
  {
    id: 17,
    groups: [
      {
        level: 0,
        theme: "Karaniwang Sawsawan",
        words: ["PATIS", "SUKA", "TOYO", "ACHARA"],
      },
      {
        level: 1,
        theme: "Mga Kilala sa Bicol",
        words: ["NIYOG", "MAYON", "PILI NUTS", "ABAKA"],
      },
      {
        level: 2,
        theme: "Mga Uri ng Hanging Amoy/Singaw",
        words: ["ALINGASAW", "HAMOG", "SIMOY", "SINGAW"],
      },
      {
        level: 3,
        theme: "Klasikong Meryendang Pinoy",
        words: ["MANGGA", "SILI", "ASIN", "BAGOONG"],
      },
    ],
  },

  // ── SET 18 ─────────────────────────────
{
  id: 18,
  groups: [
    {
      level: 0,
      theme: "Kalikasan (Kakahuyan)",
      words: ["KAKAHUYAN", "NARRA", "YAKAL", "MOLAVE"],
    },
    {
      level: 1,
      theme: "Kakahuyan (Iba pang puno)",
      words: ["APITONG", "MANGKONO", "TANGUILE"],
    },
    {
      level: 2,
      theme: "Paggalang sa Kalikasan",
      words: ["TABI TABI PO"],
    },
    {
      level: 3,
      theme: "Panimula ng Gabi sa Gubat",
      words: ["KALIKASAN", "KAGUBATAN", "TAHIMIK", "DILIM"],
    },
  ],
},

// ── SET 19 ─────────────────────────────
{
  id: 19,
  groups: [
    {
      level: 0,
      theme: "Piyesta sa Pilipinas",
      words: ["PYESTA", "ATI ATIHAN", "SINULOG", "PAHIYAS"],
    },
    {
      level: 1,
      theme: "Mga Kilalang Festival",
      words: ["PANAGBENGA", "KADAYAWAN"],
    },
    {
      level: 2,
      theme: "Pagdiriwang sa Kultura",
      words: ["HALA BIRA"],
    },
    {
      level: 3,
      theme: "Kultura at Tradisyon",
      words: ["SAYAW", "MUSIKA", "PARADA", "TRADISYON"],
    },
  ],
},

// ── SET 20 ─────────────────────────────
{
  id: 20,
  groups: [
    {
      level: 0,
      theme: "Pagkain sa Bahay",
      words: ["SINIGANG", "ADOBO", "KARE KARE", "NILAGA"],
    },
    {
      level: 1,
      theme: "Karaniwang Ulam",
      words: ["TINOLA", "AFRITADA"],
    },
    {
      level: 2,
      theme: "Tanong sa Kusina",
      words: ["MA", "ANONG ULAM"],
    },
    {
      level: 3,
      theme: "Pagkain ng Pamilyang Pinoy",
      words: ["KANIN", "ULAM", "SABAW", "KASAMA"],
    },
  ],
},
];