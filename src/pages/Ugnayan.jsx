import { useState, useCallback } from "react";
import "./Ugnayan.css";
import { LEVELS, PUZZLES } from "../models/WordsUgnayan";
// ─────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────
function getRandomPuzzle() {
  return PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildGrid(puzzle) {
  return shuffle(puzzle.groups.flatMap(g => g.words));
}

// Given a word, find which group it belongs to
function groupOf(word, puzzle) {
  return puzzle.groups.find(g => g.words.includes(word));
}

// ─────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────
function IconBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} className="ugnayan-icon-btn">
      {children}
    </button>
  );
}

function UModal({ onClose, children }) {
  return (
    <div className="ugnayan-modal-overlay" onClick={onClose}>
      <div className="ugnayan-modal" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  GAME COMPONENT
// ─────────────────────────────────────────
function UgnayanGame({ onBack, onRetry }) {
  const [puzzle]   = useState(getRandomPuzzle);
  const [grid, setGrid]         = useState(() => buildGrid(puzzle));
  const [selected, setSelected] = useState([]);
  const [solved, setSolved]     = useState([]);   // array of group level ids
  const [mistakes, setMistakes] = useState(0);
  const MAX_MISTAKES = 4;
  const [shake, setShake]       = useState(false);
  const [toast, setToast]       = useState("");
  const [showHelp, setShowHelp] = useState(true);
  const [showResult, setShowResult] = useState(false);

  const over = mistakes >= MAX_MISTAKES || solved.length === 4;
  const won  = solved.length === 4;

  const showToast = (msg, dur = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(""), dur);
  };

  const toggleSelect = useCallback((word) => {
    if (over) return;
    setSelected(prev => {
      if (prev.includes(word)) return prev.filter(w => w !== word);
      if (prev.length >= 4)    return prev; // max 4 selected
      return [...prev, word];
    });
  }, [over]);

  const handleShuffle = () => {
    setGrid(g => shuffle(g));
  };

  const handleDeselect = () => setSelected([]);

  const handleSubmit = useCallback(() => {
    if (selected.length !== 4) {
      showToast("Pumili ng 4 na salita!");
      return;
    }

    // Check if all 4 belong to the same group
    const firstGroup = groupOf(selected[0], puzzle);
    const allMatch   = selected.every(w => groupOf(w, puzzle) === firstGroup);

    if (allMatch) {
      // Correct!
      const newSolved = [...solved, firstGroup.level];
      setSolved(newSolved);

      // Remove solved words from grid
      setGrid(g => g.filter(w => !selected.includes(w)));
      setSelected([]);

      if (newSolved.length === 4) {
        setTimeout(() => setShowResult(true), 500);
      } else {
        showToast("Tama! 🎉");
      }
    } else {
      // Wrong — check if they're one away
      const counts = {};
      selected.forEach(w => {
        const g = groupOf(w, puzzle);
        counts[g.level] = (counts[g.level] || 0) + 1;
      });
      const maxMatch = Math.max(...Object.values(counts));
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setSelected([]);
      setShake(true);
      setTimeout(() => setShake(false), 600);

      if (newMistakes >= MAX_MISTAKES) {
        showToast("Tapos na ang mga pagkakataon!", 4000);
        setTimeout(() => setShowResult(true), 1200);
      } else if (maxMatch === 3) {
        showToast("Malapit ka na! Isa pa lang!");
      } else {
        showToast("Mali. Subukan ulit.");
      }
    }
  }, [selected, puzzle, solved, mistakes]);

  // Sorted solved groups for display
  const solvedGroups = puzzle.groups
    .filter(g => solved.includes(g.level))
    .sort((a, b) => a.level - b.level);

  // Remaining grid words (not yet solved)
  const remainingGrid = grid;

  return (
    <div className="ugnayan-root">
      {/* Header */}
      <div className="ugnayan-header">
        <button className="ugnayan-back-btn" onClick={onBack} title="Bumalik">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Bumalik
        </button>
        <div className="ugnayan-title-block">
          <div className="ugnayan-title">UGNAYAN</div>
          <div className="ugnayan-subtitle">TAGALOG CONNECTIONS</div>
        </div>
        <div className="ugnayan-header-icons">
          <IconBtn title="Tulong" onClick={() => setShowHelp(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="ugnayan-toast">{toast}</div>}

      <div className="ugnayan-main">

        {/* Instruction */}
        <p style={{ margin: 0, fontSize: 13, color: "#818384", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
          Hanapin ang apat na grupo ng magkakaugnay na salita.
        </p>

        {/* Mistakes */}
        <div className="ugnayan-mistakes">
          <span>Buhay:</span>
          <div className="ugnayan-mistake-dots">
            {Array(MAX_MISTAKES).fill(null).map((_, i) => (
              <div
                key={i}
                className={`ugnayan-dot${i < mistakes ? " ugnayan-dot--used" : ""}`}
              />
            ))}
          </div>
        </div>

        {/* Solved group banners */}
        {solvedGroups.length > 0 && (
          <div className="ugnayan-solved-groups">
            {solvedGroups.map(g => {
              const lvl = LEVELS[g.level];
              return (
                <div
                  key={g.level}
                  className="ugnayan-solved-group"
                  style={{ background: lvl.bg, border: `2px solid ${lvl.color}` }}
                >
                  <div className="ugnayan-solved-group-label" style={{ color: lvl.color }}>
                    {lvl.label}
                  </div>
                  <div className="ugnayan-solved-group-title" style={{ color: lvl.color }}>
                    {g.theme}
                  </div>
                  <div className="ugnayan-solved-group-words">
                    {g.words.join(", ")}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Word grid */}
        {remainingGrid.length > 0 && (
          <div className={`ugnayan-grid${shake ? " ugnayan-grid--shake" : ""}`}>
            {remainingGrid.map(word => {
              const isSelected = selected.includes(word);
              return (
                <div
                  key={word}
                  className={`ugnayan-card${isSelected ? " ugnayan-card--selected" : ""}`}
                  onClick={() => toggleSelect(word)}
                >
                  {word}
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        {!over && (
          <div className="ugnayan-actions">
            <button className="ugnayan-btn ugnayan-btn--outline" onClick={handleShuffle}>
              I-Shuffle
            </button>
            <button
              className="ugnayan-btn ugnayan-btn--outline"
              onClick={handleDeselect}
              disabled={selected.length === 0}
            >
              I-Deselect
            </button>
            <button
              className="ugnayan-btn ugnayan-btn--primary"
              onClick={handleSubmit}
              disabled={selected.length !== 4}
            >
              Isumite
            </button>
          </div>
        )}

        {/* Play again when over but result modal is closed */}
        {over && !showResult && (
          <div className="ugnayan-actions">
            <button className="ugnayan-btn ugnayan-btn--primary" onClick={() => setShowResult(true)}>
              Tingnan ang Resulta
            </button>
            <button className="ugnayan-btn ugnayan-btn--outline" onClick={onRetry}>
              Maglaro Ulit 🔁
            </button>
          </div>
        )}
      </div>

      {/* ── Help Modal ── */}
      {showHelp && (
        <UModal onClose={() => setShowHelp(false)}>
          <h2>PAANO MAGLARO</h2>
          <p>
            Pumili ng <strong style={{ color: "#fff" }}>4 na salita</strong> na sa palagay mo ay
            magkakaugnay. Pindutin ang <strong style={{ color: "#fff" }}>Isumite</strong> upang
            suriin. May <strong style={{ color: "#fff" }}>4 na pagkakataon</strong> ka bago matapos
            ang laro.
          </p>
          <div className="ugnayan-modal-divider" />
          <div className="ugnayan-help-colors">
            {LEVELS.map(lvl => (
              <div key={lvl.id} className="ugnayan-help-color-row">
                <div className="ugnayan-help-swatch" style={{ background: lvl.color }} />
                <span><strong style={{ color: "#fff" }}>{lvl.label}</strong> — pinakamadali hanggang pinakamahirap</span>
              </div>
            ))}
          </div>
          <p style={{ marginBottom: 4 }}>
            Kapag "Malapit ka na!", nangangahulugang tatlo sa iyong pinili ay nasa iisang grupo.
          </p>
          <button className="ugnayan-modal-btn" onClick={() => setShowHelp(false)}>
            Maglaro na!
          </button>
        </UModal>
      )}

      {/* ── Result Modal ── */}
      {showResult && (
        <UModal onClose={() => setShowResult(false)}>
          <h2>{won ? "🎉 NAGWAGI KA!" : "😔 TAPOS NA"}</h2>
          <p style={{ textAlign: "center", marginBottom: 16 }}>
            {won
              ? `Natapos mo nang walang ${mistakes === 0 ? "pagkakamali!" : `${mistakes} pagkakamaling lang!`}`
              : `${MAX_MISTAKES} na pagkakamali. Narito ang mga sagot:`}
          </p>
          <div className="ugnayan-result-groups">
            {puzzle.groups
              .slice()
              .sort((a, b) => a.level - b.level)
              .map((g, i) => {
                const lvl = LEVELS[g.level];
                return (
                  <div
                    key={g.level}
                    className="ugnayan-result-group"
                    style={{
                      background: lvl.bg,
                      border: `2px solid ${lvl.color}`,
                      animationDelay: `${i * 120}ms`,
                    }}
                  >
                    <div className="ugnayan-result-group-title" style={{ color: lvl.color }}>
                      {lvl.label} · {g.theme}
                    </div>
                    <div className="ugnayan-result-group-words">
                      {g.words.join(", ")}
                    </div>
                  </div>
                );
              })}
          </div>
          <button className="ugnayan-modal-btn" onClick={() => setShowResult(false)}>
            Isara
          </button>
          <button className="ugnayan-modal-btn ugnayan-modal-btn--secondary" onClick={onRetry}>
            Maglaro Ulit 🔁
          </button>
        </UModal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
//  EXPORTED WRAPPER — manages retry
// ─────────────────────────────────────────
export default function Ugnayan({ onBack }) {
  const [retryKey, setRetryKey] = useState(0);
  return (
    <UgnayanGame
      key={retryKey}
      onBack={onBack}
      onRetry={() => setRetryKey(k => k + 1)}
    />
  );
}