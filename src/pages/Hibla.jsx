import { useState, useCallback, useRef, useEffect } from "react";
import PUZZLES from "../models/WordsHibla.jsx";
import "./Hibla.css";

// ─── Injected animation CSS (no CSS file edits required) ─────────────────────
const ANIM_CSS = `
  @keyframes hibla-cell-pop {
    0%   { transform: scale(1);    }
    35%  { transform: scale(1.22); filter: brightness(1.4); }
    65%  { transform: scale(0.93); }
    100% { transform: scale(1);    filter: brightness(1); }
  }
  @keyframes hibla-cell-pop-span {
    0%   { transform: scale(1);    }
    35%  { transform: scale(1.26); filter: brightness(1.6); }
    65%  { transform: scale(0.91); }
    100% { transform: scale(1);    filter: brightness(1); }
  }
  @keyframes hibla-shake {
    0%,100% { transform: translateX(0); }
    18%     { transform: translateX(-7px); }
    36%     { transform: translateX(7px); }
    54%     { transform: translateX(-5px); }
    72%     { transform: translateX(5px); }
    90%     { transform: translateX(-2px); }
  }
  @keyframes hibla-hint-pulse {
    0%,100% { box-shadow: 0 0 0 2px #6aab5e inset; }
    50%     { box-shadow: 0 0 0 3px #9fd494 inset, 0 0 8px rgba(106,171,94,0.4); }
  }
  @keyframes hibla-toast-in {
    from { opacity: 0; transform: translate(-50%, -8px) scale(0.93); }
    to   { opacity: 1; transform: translate(-50%, 0)    scale(1); }
  }
  @keyframes hibla-hint-dot-fill {
    from { transform: scale(0.6); opacity: 0.4; }
    to   { transform: scale(1);   opacity: 1; }
  }
  .hibla-cell--anim-regular {
    animation: hibla-cell-pop 0.42s cubic-bezier(.36,.07,.19,.97) both;
  }
  .hibla-cell--anim-spangram {
    animation: hibla-cell-pop-span 0.48s cubic-bezier(.36,.07,.19,.97) both;
  }
  .hibla-cell--hint {
    animation: hibla-hint-pulse 1.6s ease-in-out infinite !important;
    background: #142e12 !important;
    border-color: #6aab5e !important;
    color: #9fd494 !important;
  }
  .hibla-grid--shake {
    animation: hibla-shake 0.42s cubic-bezier(.36,.07,.19,.97);
  }
  .hibla-toast--success  { background: #1a3318; border-color: #6aab5e; color: #9fd494; }
  .hibla-toast--error    { background: #2c1a1a; border-color: #cc4444; color: #f08080; }
  .hibla-toast--spangram { background: #3d2a00; border-color: #f9a825; color: #ffc94d; }
  .hibla-toast--hint     { background: #1a2030; border-color: #4a8ac0; color: #80b8e8; }
  .hibla-toast--info     { background: #2a2a2c; border-color: #555;    color: #aaa; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getRandPuzzle = () => PUZZLES[Math.floor(Math.random() * PUZZLES.length)];

const isAdjacent = ([r1, c1], [r2, c2]) =>
  Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && !(r1 === r2 && c1 === c2);

const pathToWord = (path, grid, cols) =>
  path.map(([r, c]) => grid[r * cols + c]).join("");

const matchPuzzleWord = (path, puzzle) => {
  if (path.length < 3) return null;
  const word = pathToWord(path, puzzle.grid, puzzle.cols);
  return puzzle.words.find(w => w.word === word) || null;
};

const cellKey = (r, c) => `${r},${c}`;

// ─── Sub-components ───────────────────────────────────────────────────────────
function IconBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} className="hibla-icon-btn">
      {children}
    </button>
  );
}

function HModal({ onClose, children }) {
  return (
    <div className="hibla-modal-overlay" onClick={onClose}>
      <div className="hibla-modal" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// Hint meter dots + button
function HintMeter({ progress, available, onUse }) {
  const ready = available > 0;
  return (
    <div className="hibla-hint-row">
      <div className="hibla-hint-dots">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="hibla-hint-dot"
            style={{
              background:   i < progress ? "#6aab5e" : "#2e2e30",
              borderColor:  i < progress ? "#6aab5e" : "#484848",
              transform:    i === progress - 1 ? "scale(1.15)" : "scale(1)",
              transition:   "all 0.3s cubic-bezier(.34,1.56,.64,1)",
              animation:    i === progress - 1 ? "hibla-hint-dot-fill 0.35s ease both" : "none",
            }}
          />
        ))}
      </div>
      <button
        className={`hibla-hint-btn${ready ? " hibla-hint-btn--ready" : ""}`}
        onClick={onUse}
        disabled={!ready}
        title={ready ? `Gamitin ang pahiwatig (${available} available)` : "Kailangan pa ng higit pang pagsubok"}
      >
        💡 {ready ? `Pahiwatig (${available})` : "Pahiwatig"}
      </button>
    </div>
  );
}

// Real-time SVG path overlay rendered inside the grid wrapper
function PathOverlay({ path, pointerXY, gridEl }) {
  if (!gridEl || path.length === 0) return null;

  const gridRect = gridEl.getBoundingClientRect();

  const getCenter = (r, c) => {
    const el = gridEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left - gridRect.left + rect.width  / 2,
      y: rect.top  - gridRect.top  + rect.height / 2,
    };
  };

  const pts = path.map(([r, c]) => getCenter(r, c)).filter(Boolean);
  if (pts.length === 0) return null;

  // Extend the last point to live cursor position
  const cursorPt = pointerXY
    ? { x: pointerXY.x - gridRect.left, y: pointerXY.y - gridRect.top }
    : null;

  const allPts = cursorPt ? [...pts, cursorPt] : pts;
  const stroke = "rgba(249,168,37,0.72)";

  return (
    <svg
      style={{
        position: "absolute", top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 20, overflow: "visible",
      }}
    >
      {/* Connection lines */}
      {allPts.slice(0, -1).map((pt, i) => (
        <line
          key={`l${i}`}
          x1={pt.x}          y1={pt.y}
          x2={allPts[i+1].x} y2={allPts[i+1].y}
          stroke={stroke}
          strokeWidth="11"
          strokeLinecap="round"
          opacity="0.6"
        />
      ))}
      {/* Dot at each confirmed cell */}
      {pts.map((pt, i) => (
        <circle
          key={`c${i}`}
          cx={pt.x} cy={pt.y}
          r={i === 0 ? 13 : 10}
          fill={stroke}
          opacity={i === 0 ? 0.85 : 0.65}
        />
      ))}
    </svg>
  );
}

// ─── Main game ─────────────────────────────────────────────────────────────────
function HiblaGame({ onBack, onRetry }) {
  const [puzzle]          = useState(getRandPuzzle);
  const [selecting,    setSelecting]    = useState(false);
  const [path,         setPath]         = useState([]);
  const [foundWords,   setFoundWords]   = useState([]);
  const [toast,        setToast]        = useState({ msg: "", type: "info" });
  const [showHelp,     setShowHelp]     = useState(false);
  const [showResult,   setShowResult]   = useState(false);
  const [shake,        setShake]        = useState(false);
  const [cellAnims,    setCellAnims]    = useState({}); // cellKey -> { delay, type }
  const [hintCells,    setHintCells]    = useState(new Set());
  const [wrongAttempts,setWrongAttempts]= useState(0); // drives hint meter
  const [hintsUsed,    setHintsUsed]    = useState(0);
  const [pointerXY,    setPointerXY]    = useState(null);

  const gridRef = useRef(null);

  const { cols, rows, grid, words, theme } = puzzle;
  const totalWords   = words.length;
  const spangram     = words.find(w => w.isTheme) ?? words[words.length - 1];
  const regularWords = words.filter(w => !w.isTheme);
  const won          = foundWords.length === totalWords;

  // Hint meter: every 3 wrong attempts = 1 hint; cap at unfound regular words
  const hintsEarned    = Math.floor(wrongAttempts / 3);
  const hintsAvailable = Math.max(0, hintsEarned - hintsUsed);
  const hintProgress   = wrongAttempts % 3; // 0 → 1 → 2 dots filled

  // ── Build cell-state lookup ──
  const foundCellKeys    = new Set();
  const spangramCellKeys = new Set();
  foundWords.forEach(fw => {
    fw.cells?.forEach(([r, c]) => {
      if (fw.isTheme) spangramCellKeys.add(cellKey(r, c));
      else            foundCellKeys.add(cellKey(r, c));
    });
  });
  const selectingKeys = new Set(path.map(([r, c]) => cellKey(r, c)));

  // ── Toast helper ──
  const showToast = useCallback((msg, type = "info", dur = 2200) => {
    setToast({ msg, type });
    const id = setTimeout(() => setToast(t => t.msg === msg ? { msg: "", type: "info" } : t), dur);
    return () => clearTimeout(id);
  }, []);

  // ── Shake animation ──
  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  }, []);

  // ── Staggered cell pop animations ──
  const triggerCellAnims = useCallback((cells, type) => {
    if (!cells) return;
    const map = {};
    cells.forEach(([r, c], i) => {
      map[cellKey(r, c)] = { delay: i * 55, type };
    });
    setCellAnims(map);
    setTimeout(() => setCellAnims({}), cells.length * 55 + 700);
  }, []);

  // ── Cell position lookup (for SVG overlay) ──
  const getCellFromPoint = useCallback((x, y) => {
    if (!gridRef.current) return null;
    for (const el of gridRef.current.querySelectorAll(".hibla-cell")) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
        return [parseInt(el.dataset.row), parseInt(el.dataset.col)];
    }
    return null;
  }, []);

  // ── Selection controls ──
  const startSelect = useCallback((r, c) => {
    setSelecting(true);
    setPath([[r, c]]);
  }, []);

  const extendSelect = useCallback((r, c) => {
    if (!selecting) return;
    setPath(prev => {
      const last = prev[prev.length - 1];
      const key  = cellKey(r, c);
      const existingIdx = prev.findIndex(([pr, pc]) => cellKey(pr, pc) === key);
      if (existingIdx !== -1) return prev.slice(0, existingIdx + 1); // backtrack
      if (!isAdjacent(last, [r, c])) return prev;
      return [...prev, [r, c]];
    });
  }, [selecting]);

  const endSelect = useCallback(() => {
    if (!selecting) return;
    setSelecting(false);
    setPointerXY(null);

    const matched = matchPuzzleWord(path, puzzle);

    if (matched) {
      const alreadyFound = foundWords.some(fw => fw.word === matched.word);
      if (!alreadyFound) {
        const newFound = [...foundWords, matched];
        setFoundWords(newFound);

        const animType = matched.isTheme ? "spangram" : "regular";
        triggerCellAnims(matched.cells, animType);

        // Remove revealed hint cells that were just found
        setHintCells(prev => {
          if (prev.size === 0) return prev;
          const next = new Set(prev);
          matched.cells?.forEach(([r, c]) => next.delete(cellKey(r, c)));
          return next;
        });

        if (matched.isTheme) {
          showToast("🌟 SPANGRAM! Nahanap mo ang Pangkat na salita!", "spangram", 4000);
        } else {
          showToast(`✓ ${matched.word}!`, "success", 1800);
        }

        if (newFound.length === totalWords) {
          setTimeout(() => setShowResult(true), 750);
        }
      } else {
        showToast("Nahanap mo na iyan!", "info", 1500);
      }
    } else if (path.length >= 3) {
      triggerShake();
      showToast("Hindi kilalang salita.", "error", 1600);
      setWrongAttempts(c => c + 1);
    }
    setPath([]);
  }, [selecting, path, puzzle, foundWords, totalWords, triggerCellAnims, triggerShake, showToast]);

  // ── Use hint ──
  const handleUseHint = useCallback(() => {
    if (hintsAvailable <= 0) return;
    const unfound = regularWords.filter(w => !foundWords.some(fw => fw.word === w.word));
    if (!unfound.length) return;
    const target = unfound[0]; // reveal first unfound regular word
    setHintCells(prev => {
      const next = new Set(prev);
      target.cells?.forEach(([r, c]) => next.add(cellKey(r, c)));
      return next;
    });
    setHintsUsed(h => h + 1);
    const masked = target.word.slice(0, 1) + "?".repeat(target.word.length - 1);
    showToast(`💡 Pahiwatig: salitang nagsisimula sa "${masked}"`, "hint", 3500);
  }, [hintsAvailable, regularWords, foundWords, showToast]);

  // ── Pointer event handlers ──
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    const cell = getCellFromPoint(pt.clientX, pt.clientY);
    if (cell) startSelect(...cell);
  }, [getCellFromPoint, startSelect]);

  const handlePointerMove = useCallback((e) => {
    if (!selecting) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    setPointerXY({ x: pt.clientX, y: pt.clientY });
    const cell = getCellFromPoint(pt.clientX, pt.clientY);
    if (cell) extendSelect(...cell);
  }, [selecting, getCellFromPoint, extendSelect]);

  const handlePointerUp = useCallback((e) => {
    e.preventDefault();
    endSelect();
  }, [endSelect]);

  const handleLeave = useCallback(() => {
    if (selecting) endSelect();
  }, [selecting, endSelect]);

  // ── Attach events (needed for touch passivity) ──
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const opts = { passive: false };
    el.addEventListener("mousedown",  handlePointerDown, opts);
    el.addEventListener("mousemove",  handlePointerMove, opts);
    el.addEventListener("mouseup",    handlePointerUp,   opts);
    el.addEventListener("touchstart", handlePointerDown, opts);
    el.addEventListener("touchmove",  handlePointerMove, opts);
    el.addEventListener("touchend",   handlePointerUp,   opts);
    return () => {
      el.removeEventListener("mousedown",  handlePointerDown);
      el.removeEventListener("mousemove",  handlePointerMove);
      el.removeEventListener("mouseup",    handlePointerUp);
      el.removeEventListener("touchstart", handlePointerDown);
      el.removeEventListener("touchmove",  handlePointerMove);
      el.removeEventListener("touchend",   handlePointerUp);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  const progress     = foundWords.length / totalWords;
  const foundPercent = Math.round(progress * 100);
  const currentWord  = path.length > 0 ? pathToWord(path, grid, cols) : "";

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="hibla-root">
      <style>{ANIM_CSS}</style>

      {/* ── Header ── */}
      <div className="hibla-header">
        <button className="hibla-back-btn" onClick={onBack} title="Bumalik">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Bumalik
        </button>
        <div className="hibla-title-block">
          <div className="hibla-title">HIBLA</div>
          <div className="hibla-subtitle">TAGALOG STRANDS</div>
        </div>
        <div className="hibla-header-icons">
          <IconBtn title="Tulong" onClick={() => setShowHelp(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast.msg && (
        <div
          className={`hibla-toast hibla-toast--${toast.type}`}
          style={{ animation: "hibla-toast-in 0.22s ease both" }}
        >
          {toast.msg}
        </div>
      )}

      <div className="hibla-main">

        {/* ── Theme banner ── */}
        <div className="hibla-theme-banner">
          <div className="hibla-theme-label">Tema ng Laro</div>
          <div className="hibla-theme-text">{theme}</div>
          <div className="hibla-theme-hint">
            Hanapin ang {regularWords.length} na salita + 1 na Pangkat (Spangram)
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="hibla-progress-wrap">
          <div className="hibla-progress-label">
            {foundWords.length} / {totalWords} nahanap
          </div>
          <div className="hibla-progress-track">
            <div className="hibla-progress-fill" style={{ width: `${foundPercent}%` }} />
          </div>
        </div>

        {/* ── Hint meter ── */}
        <HintMeter
          progress={hintProgress}
          available={hintsAvailable}
          onUse={handleUseHint}
        />

        {/* ── Letter grid ── */}
        <div
          className="hibla-grid-wrapper"
          ref={gridRef}
          onMouseLeave={handleLeave}
          style={{ position: "relative", display: "inline-block" }}
        >
          <div
            className={`hibla-grid${shake ? " hibla-grid--shake" : ""}`}
            style={{ gridTemplateColumns: `repeat(${cols}, 52px)` }}
          >
            {Array(rows).fill(null).flatMap((_, r) =>
              Array(cols).fill(null).map((__, c) => {
                const key         = cellKey(r, c);
                const letter      = grid[r * cols + c] || "";
                const isSpan      = spangramCellKeys.has(key);
                const isFound     = foundCellKeys.has(key);
                const isSel       = selectingKeys.has(key);
                const isHint      = hintCells.has(key) && !isFound && !isSpan;
                const animData    = cellAnims[key];

                let cls = "hibla-cell";
                if (isSpan)   cls += " hibla-cell--theme";
                else if (isFound) cls += " hibla-cell--found";
                else if (isSel)   cls += " hibla-cell--selecting";
                if (isHint)       cls += " hibla-cell--hint";
                if (animData)     cls += ` hibla-cell--anim-${animData.type}`;

                return (
                  <div
                    key={key}
                    className={cls}
                    data-row={r}
                    data-col={c}
                    style={animData ? { animationDelay: `${animData.delay}ms` } : undefined}
                  >
                    {letter}
                  </div>
                );
              })
            )}
          </div>

          {/* Real-time SVG path overlay */}
          {selecting && (
            <PathOverlay
              path={path}
              pointerXY={pointerXY}
              gridEl={gridRef.current}
            />
          )}
        </div>

        {/* ── Live word preview ── */}
        <div style={{
          fontSize: 15, fontWeight: 900, letterSpacing: 4,
          color: "#f9a825", minHeight: 26, textAlign: "center",
          userSelect: "none", transition: "all 0.08s",
        }}>
          {currentWord || "\u00A0"}
        </div>

        {/* ── Word chips ── */}
        <div className="hibla-wordlist">
          {regularWords.map(w => {
            const isFound = foundWords.some(fw => fw.word === w.word);
            return (
              <div
                key={w.word}
                className={`hibla-word-chip${isFound ? " hibla-word-chip--found" : ""}`}
              >
                {isFound ? w.word : "?????"}
              </div>
            );
          })}
          {/* Spangram chip */}
          {(() => {
            const isFound = foundWords.some(fw => fw.isTheme);
            return (
              <div className={`hibla-word-chip${isFound ? " hibla-word-chip--theme" : ""}`}>
                {isFound ? `⭐ ${spangram.word}` : "⭐ Pangkat"}
              </div>
            );
          })()}
        </div>

      </div>{/* .hibla-main */}

      {/* ══════════ Help Modal ══════════ */}
      {showHelp && (
        <HModal onClose={() => setShowHelp(false)}>
          <h2>PAANO MAGLARO</h2>
          <p>
            I-<strong style={{ color: "#fff" }}>drag</strong> ang iyong daliri sa mga titik
            upang bumuo ng salita. Maaaring magpatuloy nang{" "}
            <strong style={{ color: "#fff" }}>diretso, patagilid, o pahilis</strong>.
            Ang bawat titik ay magagamit nang <strong style={{ color: "#fff" }}>isang beses
            lamang</strong> sa isang salita.
          </p>

          <div className="hibla-modal-divider" />

          <p style={{ marginBottom: 6 }}>
            <strong style={{ color: "#f9a825" }}>💡 Sistema ng Pahiwatig</strong>
          </p>
          <p>
            Ang bawat 3 maling pagtatangka ay nagbibigay ng isang pahiwatig.
            Ang pahiwatig ay nagpapakita ng mga titik ng isang nakatagong salita
            (may{" "}
            <span style={{ color: "#6aab5e", fontWeight: 700 }}>berdeng glowing border</span>).
          </p>

          <div className="hibla-modal-divider" />

          <div className="hibla-modal-legend">
            {[
              { bg: "#2a2a2c", bc: "#3a3a3c", label: "Hindi pa nahanap" },
              { bg: "#4a3a10", bc: "#f9a825", label: "Kasalukuyang pinipili" },
              { bg: "#1a3318", bc: "#6aab5e", label: "Nahanap na (regular)" },
              { bg: "#3d2a00", bc: "#f9a825", label: "⭐ Pangkat / Spangram", gold: true },
            ].map(({ bg, bc, label, gold }) => (
              <div key={label} className="hibla-modal-legend-row">
                <div className="hibla-legend-swatch"
                  style={{ background: bg, borderColor: bc }} />
                <span style={gold ? { color: "#f9a825" } : {}}>{label}</span>
              </div>
            ))}
          </div>

          <p style={{ marginBottom: 4, fontSize: 13, color: "#aaa" }}>
            Ang <strong style={{ color: "#f9a825" }}>Pangkat (Spangram)</strong> ay isang espesyal
            na salita na tumatawid sa buong board mula sa isang gilid patungo sa kabilang gilid.
          </p>
          <button className="hibla-modal-btn" onClick={() => setShowHelp(false)}>
            Maglaro na!
          </button>
        </HModal>
      )}

      {/* ══════════ Result Modal ══════════ */}
      {showResult && (
        <HModal onClose={() => setShowResult(false)}>
          <h2>{won ? "🎉 NATAPOS MO!" : "📋 MGA SAGOT"}</h2>
          <p style={{ textAlign: "center", marginBottom: 12 }}>
            {won
              ? "Nahanap mo ang lahat ng salita! Mahusay!"
              : "Narito ang lahat ng salita sa puzzle na ito:"}
          </p>
          <div className="hibla-result-words">
            {regularWords.map((w, i) => (
              <div
                key={w.word}
                className="hibla-result-chip hibla-result-chip--regular"
                style={{ animationDelay: `${i * 75}ms` }}
              >
                {w.word}
              </div>
            ))}
            <div
              className="hibla-result-chip hibla-result-chip--theme"
              style={{ animationDelay: `${regularWords.length * 75}ms` }}
            >
              ⭐ {spangram.word}
            </div>
          </div>
          <button className="hibla-modal-btn" onClick={() => setShowResult(false)}>
            Isara
          </button>
          <button
            className="hibla-modal-btn hibla-modal-btn--secondary"
            onClick={onRetry}
          >
            Maglaro Ulit 🔁
          </button>
        </HModal>
      )}
    </div>
  );
}

// ─── Exported wrapper — handles retry by resetting key ───────────────────────
export default function Hibla({ onBack }) {
  const [retryKey, setRetryKey] = useState(0);
  return (
    <HiblaGame
      key={retryKey}
      onBack={onBack}
      onRetry={() => setRetryKey(k => k + 1)}
    />
  );
}