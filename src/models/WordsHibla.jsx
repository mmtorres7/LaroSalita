// HIBLA puzzle bank. Each puzzle is generated into a 6x8 board:
// the spangram is placed first, then all theme words fill the rest.

const COLS = 6;
const ROWS = 8;

const PUZZLE_SETS = [
  {
    clue: "Luto tayo!",
    spangram: "Pangluto",
    words: ["Sandok", "Kaserola", "Kawali", "Kalan", "Kaldero", "Kutsilyo"],
  },
  {
    clue: "Tapos na ako!",
    spangram: "Iskolar ng bayan",
    words: ["Sablay", "Oblation", "Mirasol", "Barong", "Bestida"],
  },
  {
    clue: "Ligo, ano tara?",
    spangram: "Pangligo",
    words: ["Sabon", "Tuwalya", "Siyampu", "Sipilyo", "Tutpeyst", "Suklay"],
  },
  {
    clue: "Magandang umaga! Maayong buntag!",
    spangram: "Lenggwahe",
    words: ["Filipino", "Sebwano", "Ilokano", "Waray", "Pangasinense"],
  },
  {
    clue: "It's more fun in the Philippines!",
    spangram: "Sagisag",
    words: ["Jose Rizal", "Agila", "Kalabaw", "Mangga", "Anahaw", "Filipino"],
  },
  {
    clue: "Medyo amoy araw ka, 'nak",
    spangram: "Larong Pinoy",
    words: ["Patintero", "Luksong Baka", "Piko", "Sungka", "Tiyakad"],
  },
  {
    clue: "Gabi na sa probinsya",
    spangram: "Mitolohiya",
    words: ["Manananggal", "Kapre", "Aswang", "Tiyanak", "Tikbalang"],
  },
  {
    clue: "Bahay kubo, kahit munti",
    spangram: "Pananim",
    words: ["Singkamas", "Mani", "Kundol", "Kalabasa", "Sibuyas", "Mustasa"],
  },
  {
    clue: "Matamis, maasim, sariwa",
    spangram: "Prutas",
    words: ["Mangga", "Saging", "Pinya", "Papaya", "Chico", "Rambutan", "Santol"],
  },
  {
    clue: "Huli mula sa dagat",
    spangram: "Lamang dagat",
    words: ["Pusit", "Sugpo", "Hipon", "Alimasag", "Alimango", "Talaba"],
  },
  {
    clue: "Saw-saw muna bago kain",
    spangram: "Sawsawan",
    words: ["Toyo", "Toyomansi", "Suka", "Patis", "Bagoong", "Sarsa", "Ketsap"],
  },
  {
    clue: "Merienda sa bilao",
    spangram: "Kakanin",
    words: ["Puto", "Palitaw", "Bibingka", "Kutsinta", "Kalamay", "Nilupak"],
  },
  {
    clue: "Mesa, taya, baraha",
    spangram: "Baraha",
    words: ["Tongits", "Sakla", "Bente uno", "Pusoy dos", "Pekwa", "Tres Siete"],
  },
  {
    clue: "Tingnan ang petsa",
    spangram: "Kalendaryo",
    words: ["Pebrero", "Abril", "Enero", "Disyembre", "Oktubre", "Hulyo"],
  },
  {
    clue: "Ang init, tara langoy!",
    spangram: "Anyong tubig",
    words: ["Karagatan", "Dagat", "Ilog", "Batis", "Lawa", "Bukal", "Talon"],
  },
  {
    clue: "Taas, baba, lawak",
    spangram: "Anyong lupa",
    words: ["Kapatagan", "Bundok", "Burol", "Lambak", "Talampas", "Pulo"],
  },
];

function normalizeWord(word) {
  return word.toUpperCase().replace(/[^A-Z]/g, "");
}

function seededRandom(seed) {
  let value = seed || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function neighbors([r, c]) {
  const result = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) result.push([nr, nc]);
    }
  }
  return result;
}

function edgeOf([r, c]) {
  if (c === 0) return "left";
  if (c === COLS - 1) return "right";
  if (r === 0) return "top";
  if (r === ROWS - 1) return "bottom";
  return "";
}

function isOppositeEdge(a, b) {
  return (
    (a === "left" && b === "right") ||
    (a === "right" && b === "left") ||
    (a === "top" && b === "bottom") ||
    (a === "bottom" && b === "top")
  );
}

function makeSpangramPath(length, seed) {
  const starts = [
    ...Array(ROWS).fill(null).map((_, r) => [r, 0]),
    ...Array(ROWS).fill(null).map((_, r) => [r, COLS - 1]),
    ...Array(COLS).fill(null).map((_, c) => [0, c]),
    ...Array(COLS).fill(null).map((_, c) => [ROWS - 1, c]),
  ];

  function walk(start, rand) {
    const startEdge = edgeOf(start);
    const path = [start];
    const visited = new Set([`${start[0]},${start[1]}`]);

    while (path.length < length) {
      const current = path[path.length - 1];
      const remaining = length - path.length;
      const options = neighbors(current)
        .filter(([r, c]) => !visited.has(`${r},${c}`))
        .map(cell => {
          const endEdge = edgeOf(cell);
          const isFinal = remaining === 1;
          const diagonal = cell[0] !== current[0] && cell[1] !== current[1];
          const opposite = isOppositeEdge(startEdge, endEdge);
          const distanceScore = startEdge === "left" || startEdge === "right"
            ? Math.abs(cell[1] - start[1]) * 8
            : Math.abs(cell[0] - start[0]) * 8;
          const edgeScore = opposite ? 100 : endEdge ? 8 : 0;
          return {
            cell,
            score: distanceScore + edgeScore + (diagonal ? 18 : 0) + rand() + (isFinal && !opposite ? -1000 : 0),
          };
        })
        .sort((a, b) => b.score - a.score);

      if (!options.length || options[0].score < -500) return null;
      const chosen = options[Math.floor(rand() * Math.min(options.length, 2))].cell;
      path.push(chosen);
      visited.add(`${chosen[0]},${chosen[1]}`);
    }

    const firstEdge = edgeOf(path[0]);
    const lastEdge = edgeOf(path[path.length - 1]);
    return isOppositeEdge(firstEdge, lastEdge) ? path : null;
  }

  for (let attempt = 0; attempt < 500; attempt++) {
    const rand = seededRandom(seed + attempt * 131);
    const start = starts[Math.floor(rand() * starts.length)];
    const path = walk(start, rand);
    if (path) return path;
  }

  const rowPath = [];
  for (let r = 0; r < ROWS; r++) {
    const cols = [...Array(COLS)].map((_, c) => c);
    if (r % 2 === 1) cols.reverse();
    cols.forEach(c => rowPath.push([r, c]));
  }
  return rowPath.slice(0, length);
}

function makeDiagonalPath(seed, blocked = new Set()) {
  const starts = [
    [0, 0], [0, COLS - 1], [ROWS - 1, 0], [ROWS - 1, COLS - 1],
    [0, Math.floor(COLS / 2)], [ROWS - 1, Math.floor(COLS / 2)],
    [Math.floor(ROWS / 2), 0], [Math.floor(ROWS / 2), COLS - 1],
  ];

  function walk(startR, startC, rand) {
    if (blocked.has(`${startR},${startC}`)) return null;
    const path = [[startR, startC]];
    const visited = new Set([...blocked, `${startR},${startC}`]);

    while (path.length < ROWS * COLS - blocked.size) {
      const cur = path[path.length - 1];
      const free = neighbors(cur).filter(([r, c]) => !visited.has(`${r},${c}`));
      if (!free.length) return null;

      // Score by fewest onward options (Warnsdorff) + random tiebreak
      const scored = free.map(cell => ({
        cell,
        deg: neighbors(cell).filter(([r, c]) => !visited.has(`${r},${c}`) && !(r === cur[0] && c === cur[1])).length,
        noise: rand(),
      }));
      scored.sort((a, b) => a.deg - b.deg || a.noise - b.noise);

      const chosen = scored[0].cell;
      path.push(chosen);
      visited.add(`${chosen[0]},${chosen[1]}`);
    }
    return path;
  }

  for (let a = 0; a < 200; a++) {
    const rand = seededRandom(seed + a * 97);
    const [sr, sc] = starts[a % starts.length];
    const p = walk(sr, sc, rand);
    if (p) return p;
  }

  // boustrophedon fallback
  const fallback = [];
  for (let r = 0; r < ROWS; r++) {
    const cols = [...Array(COLS)].map((_, c) => c);
    if (r % 2 === 1) cols.reverse();
    cols.forEach(c => {
      if (!blocked.has(`${r},${c}`)) fallback.push([r, c]);
    });
  }
  return fallback;
}

function buildPuzzle(raw, id) {
  const spangram = normalizeWord(raw.spangram);
  const entries = [
    { label: raw.spangram, word: spangram, isTheme: true },
    ...raw.words.map(label => ({ label, word: normalizeWord(label), isTheme: false })),
  ];
  const totalLetters = entries.reduce((sum, entry) => sum + entry.word.length, 0);

  if (totalLetters !== COLS * ROWS) {
    throw new Error(`Hibla puzzle "${raw.clue}" has ${totalLetters} letters instead of ${COLS * ROWS}.`);
  }

  const grid = Array(COLS * ROWS).fill("");
  const spangramPath = makeSpangramPath(spangram.length, id + 2026);
  const blocked = new Set(spangramPath.map(([r, c]) => `${r},${c}`));
  const restPath = makeDiagonalPath(id + 4048, blocked);
  let offset = 0;
  const words = entries.map((entry, entryIndex) => {
    const cells = entryIndex === 0
      ? spangramPath
      : restPath.slice(offset, offset + entry.word.length);

    entry.word.split("").forEach((letter, i) => {
      const [r, c] = cells[i];
      grid[r * COLS + c] = letter;
    });
    if (entryIndex !== 0) offset += entry.word.length;
    return { ...entry, cells };
  });

  return {
    id,
    theme: raw.clue,
    spangramLabel: raw.spangram,
    cols: COLS,
    rows: ROWS,
    grid: grid.join(""),
    words,
  };
}

const PUZZLES = PUZZLE_SETS.map(buildPuzzle);

export default PUZZLES;
