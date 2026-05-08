import { useState, useEffect, useCallback, useMemo } from "react";
import AllWords from "../models/WordsTitikPukyutan.jsx";
import "./TitikPukyutan.css";

// ─────────────────────────────────────────
//  HONEYCOMB GEOMETRY
//  Flat-top hexagons, 80×70 px each
//  Spelling Bee layout with small gaps between hexagons
// ─────────────────────────────────────────
const HEX_W = 80;
const HEX_H = 70;
const INNER_POS  = { x: 130, y: 115 };
const OUTER_POS  = [
  { x: 130, y:  39 }, // top
  { x: 194, y:  78 }, // upper-right
  { x: 194, y: 152 }, // lower-right
  { x: 130, y: 191 }, // bottom
  { x:  66, y: 152 }, // lower-left
  { x:  66, y:  78 }, // upper-left
];

// ─────────────────────────────────────────
//  RANK TABLE  (% of max score)
// ─────────────────────────────────────────
const RANKS = [
  { pct:   0, label: "Baguhan",            emoji: "🌱" },
  { pct:   2, label: "Nagsisimula",        emoji: "📖" },
  { pct:   5, label: "Natututo",           emoji: "✏️"  },
  { pct:   8, label: "Maayos",             emoji: "👍" },
  { pct:  15, label: "Malakas",            emoji: "💪" },
  { pct:  25, label: "Mahusay",            emoji: "⭐" },
  { pct:  40, label: "Napakahusay",        emoji: "🌟" },
  { pct:  50, label: "Kamangha-mangha",    emoji: "🏆" },
  { pct:  70, label: "Reyna ng Pukyutan",  emoji: "👑🐝" },
];

function getRank(score, maxScore) {
  if (maxScore === 0) return RANKS[0];
  const pct = (score / maxScore) * 100;
  let rank = RANKS[0];
  for (const r of RANKS) { if (pct >= r.pct) rank = r; }
  return rank;
}

// ─────────────────────────────────────────
//  PUZZLE GENERATION
// ─────────────────────────────────────────
function generatePuzzle(allWords) {
  // Strategy 1: Use pangrams (words with exactly 7 unique letters)
  const pangrams = allWords.filter(w => new Set(w.split("")).size === 7);

  function tryLetters(letters) {
    const letterSet = new Set(letters);
    let best = null;
    for (let ci = 0; ci < letters.length; ci++) {
      const center = letters[ci];
      const outer  = letters.filter((_, i) => i !== ci);
      const valid  = allWords.filter(w =>
        w.length >= 4 &&
        w.includes(center) &&
        w.split("").every(l => letterSet.has(l))
      );
      if (valid.length >= 8 && (!best || valid.length > best.validWords.length)) {
        best = { center, outer, letters, letterSet, validWords: valid };
      }
    }
    return best;
  }

  if (pangrams.length > 0) {
    const shuffled = [...pangrams].sort(() => Math.random() - 0.5);
    for (const pg of shuffled.slice(0, 40)) {
      const letters = [...new Set(pg.split(""))];
      const result = tryLetters(letters);
      if (result) return result;
    }
  }

  // Strategy 2: Frequency-weighted random 7 letters
  const FREQ = "AAAAAIIIIIOOOOOEEEEENNNNSSSSGGBBLRKTMHPDYG".split("");
  for (let attempt = 0; attempt < 200; attempt++) {
    const pool = new Set();
    while (pool.size < 7) pool.add(FREQ[Math.floor(Math.random() * FREQ.length)]);
    const letters = [...pool];
    const result = tryLetters(letters);
    if (result) return result;
  }

  return null;
}

function scoreWord(word, letters) {
  const len       = word.length;
  const isPangram = letters.every(l => word.includes(l));
  return (len === 4 ? 1 : len) + (isPangram ? 7 : 0);
}

// ─────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────
export default function TitikPukyutan({ onBack }) {
  const [puzzle,      setPuzzle]      = useState(null);
  const [input,       setInput]       = useState("");
  const [found,       setFound]       = useState([]);      // newest first
  const [score,       setScore]       = useState(0);
  const [toast,       setToast]       = useState("");
  const [shake,       setShake]       = useState(false);
  const [outerOrder,  setOuterOrder]  = useState([0,1,2,3,4,5]);
  const [showHelp,    setShowHelp]    = useState(false);
  const [showWords,   setShowWords]   = useState(false);
  const [flashWord,   setFlashWord]   = useState("");
  const [allFound,    setAllFound]    = useState(false);

  // Generate puzzle once on mount
  useEffect(() => {
    const p = generatePuzzle(AllWords);
    if (p) setPuzzle(p);
  }, []);

  const maxScore = useMemo(
    () => puzzle ? puzzle.validWords.reduce((s, w) => s + scoreWord(w, puzzle.letters), 0) : 0,
    [puzzle]
  );

  const rank = useMemo(() => getRank(score, maxScore), [score, maxScore]);

  /* ── helpers ── */
  const showToast = (msg, dur = 2000) => {
    setToast(msg);
    setTimeout(() => setToast(""), dur);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  /* ── input handlers ── */
  const addLetter   = useCallback(l  => setInput(p => p + l), []);
  const deleteLetter= useCallback(()  => setInput(p => p.slice(0, -1)), []);
  const shuffle     = useCallback(()  => setOuterOrder(p => [...p].sort(() => Math.random() - 0.5)), []);

  const submit = useCallback(() => {
    if (!puzzle) return;
    const word = input.trim();

    if (word.length < 4) {
      showToast("Napakaikli! (4 titik man lang)");
      triggerShake(); return;
    }
    if (!word.includes(puzzle.center)) {
      showToast(`Gamitin ang "${puzzle.center}"!`);
      triggerShake(); return;
    }
    if (!word.split("").every(l => puzzle.letterSet.has(l))) {
      showToast("May titik na wala sa pugad!");
      triggerShake(); return;
    }
    if (found.includes(word)) {
      showToast("Nahanap na iyan!");
      triggerShake(); return;
    }
    if (!puzzle.validWords.includes(word)) {
      showToast("Hindi kilalang salita!");
      triggerShake(); return;
    }

    const pts       = scoreWord(word, puzzle.letters);
    const isPangram = puzzle.letters.every(l => word.includes(l));
    const newFound  = [word, ...found];

    setFound(newFound);
    setScore(s => s + pts);
    setFlashWord(word);
    setTimeout(() => setFlashWord(""), 1500);

    if (newFound.length === puzzle.validWords.length) {
      setAllFound(true);
      showToast("🎉 Nahanap mo lahat! Henyo ka!", 5000);
    } else if (isPangram) {
      showToast(`🐝 PANGRAM! +${pts} puntos!`, 3000);
    } else {
      const kudos = ["Tama! 🌟","Magaling! ✨","Ayos! 👏","Ganda! 🐝","Wow! 💛"];
      showToast(`${kudos[Math.floor(Math.random() * kudos.length)]}  +${pts}`);
    }
    setInput("");
  }, [puzzle, input, found]);

  /* ── keyboard ── */
  useEffect(() => {
    const fn = e => {
      if (!puzzle) return;
      const k = e.key.toUpperCase();
      if      (k === "ENTER")     submit();
      else if (k === "BACKSPACE") deleteLetter();
      else if (/^[A-Z]$/.test(k) && puzzle.letterSet.has(k)) addLetter(k);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [puzzle, submit, deleteLetter, addLetter]);

  /* ── derived display data ── */
  const allPos = puzzle ? [
    { pos: INNER_POS, isCenter: true,  letter: puzzle.center },
    ...outerOrder.map((origIdx, posIdx) => ({
      pos:      OUTER_POS[posIdx],
      isCenter: false,
      letter:   puzzle.outer[origIdx],
    })),
  ] : [];

  const progressPct = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;

  /* ── loading screen ── */
  if (!puzzle) {
    return (
      <div className="tp-root">
        <div className="tp-header">
          <button className="tp-back-btn" onClick={onBack}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Bumalik
          </button>
          <div className="tp-title-block">
            <div className="tp-title">TITIK PUKYUTAN</div>
          </div>
          <div style={{ width: 80 }} />
        </div>
        <div className="tp-loading-text">🐝 Naglo-load...</div>
      </div>
    );
  }

  return (
    <div className="tp-root">

      {/* ── Header ── */}
      <div className="tp-header">
        <button className="tp-back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Bumalik
        </button>
        <div className="tp-title-block">
          <div className="tp-title">TITIK PUKYUTAN</div>
          <div className="tp-subtitle">SPELLING BEE SA TAGALOG</div>
        </div>
        <button className="tp-icon-btn" onClick={() => setShowHelp(true)} title="Tulong">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </button>
      </div>

      {/* ── Toast ── */}
      {toast && <div className="tp-toast">{toast}</div>}

      {/* ── Rank & Progress ── */}
      <div className="tp-score-area">
        <div className="tp-rank">
          <span className="tp-rank-emoji">{rank.emoji}</span>
          <span className="tp-rank-label">{rank.label}</span>
        </div>
        <div className="tp-progress-bar">
          {RANKS.map((r, i) => (
            <div
              key={r.pct}
              className="tp-progress-dot"
              style={{ left: `${Math.min(r.pct, 100)}%` }}
            />
          ))}
          <div className="tp-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="tp-score-num">{score} puntos</div>
      </div>

      {/* ── Input Display ── */}
      <div className={`tp-input-display${shake ? " tp-input--shake" : ""}`}>
        {input.length === 0
          ? <span className="tp-input-placeholder">i-type ang salita...</span>
          : input.split("").map((l, i) => (
              <span key={i} className={l === puzzle.center ? "tp-input-center" : ""}>
                {l}
              </span>
            ))
        }
        {input.length > 0 && <span className="tp-cursor" />}
      </div>

      {/* ── Honeycomb ── */}
      <div className="tp-hive">
        {allPos.map(({ pos, isCenter, letter }, idx) => (
          <button
            key={idx}
            className={`tp-hex${isCenter ? " tp-hex--center" : ""}`}
            style={{
              left:   pos.x - HEX_W / 2,
              top:    pos.y - HEX_H / 2,
              width:  HEX_W,
              height: HEX_H,
            }}
            onClick={() => addLetter(letter)}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="tp-controls">
        <button className="tp-ctrl-btn" onClick={deleteLetter}>Burahin</button>
        <button className="tp-ctrl-btn tp-ctrl-shuffle" onClick={shuffle} title="Haluin">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8"/>
            <line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/>
            <line x1="15" y1="15" x2="21" y2="21"/>
          </svg>
        </button>
        <button className="tp-ctrl-btn tp-ctrl-submit" onClick={submit}>Isumite</button>
      </div>

      {/* ── Found Words ── */}
      <div className="tp-found-section">
        <button className="tp-found-toggle" onClick={() => setShowWords(p => !p)}>
          <span>
            {found.length > 0
              ? `${found.length} salita nahanap`
              : "Wala pang salita"}
            {found.length > 0 && !allFound && (
              <span className="tp-found-pct">
                {" "}· {Math.round((found.length / puzzle.validWords.length) * 100)}%
              </span>
            )}
            {allFound && <span className="tp-all-found"> · Kumpleto! 👑</span>}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            style={{ transform: showWords ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {showWords && (
          <div className="tp-found-list">
            {found.map(w => {
              const isPangram = puzzle.letters.every(l => w.includes(l));
              return (
                <span
                  key={w}
                  className={[
                    "tp-found-word",
                    isPangram ? "tp-found-word--pangram" : "",
                    w === flashWord ? "tp-found-word--flash" : "",
                  ].join(" ").trim()}
                >
                  {w}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Help Modal ── */}
      {showHelp && (
        <div className="tp-overlay" onClick={() => setShowHelp(false)}>
          <div className="tp-modal" onClick={e => e.stopPropagation()}>
            <h2>🐝 PAANO MAGLARO</h2>
            <p>Gumawa ng mga salita gamit ang 7 titik sa pugad ng pukyutan.</p>
            <ul className="tp-help-list">
              <li>Ang <strong className="tp-hl-center">gintong titik sa gitna</strong> ay dapat laging gamitin.</li>
              <li>Maaaring gamitin ang isang titik nang maraming beses.</li>
              <li>Ang mga salita ay dapat <strong>4 titik man lang</strong>.</li>
              <li>Ang salitang gumagamit ng <strong>lahat ng 7 titik</strong> ay <span className="tp-pangram-badge">PANGRAM</span> — may dagdag na +7 puntos!</li>
            </ul>
            <div className="tp-help-scoring">
              <div className="tp-score-row"><span>4 titik</span><span className="tp-pts">1 puntos</span></div>
              <div className="tp-score-row"><span>5 titik</span><span className="tp-pts">5 puntos</span></div>
              <div className="tp-score-row"><span>6 titik</span><span className="tp-pts">6 puntos</span></div>
              <div className="tp-score-row"><span>7+ titik</span><span className="tp-pts">= bilang ng titik</span></div>
              <div className="tp-score-row"><span>Pangram</span><span className="tp-pts tp-pts--gold">+7 puntos bonus</span></div>
            </div>
            <button className="tp-modal-btn" onClick={() => setShowHelp(false)}>
              Maglaro na! 🐝
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
