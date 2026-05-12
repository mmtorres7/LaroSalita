import { useState, useEffect, useCallback } from "react";
import Words from "../models/Words.jsx";
import "./Saltong.css";

const KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

const TC = { correct: "#538d4e", present: "#b59f3b", absent: "#3a3a3c" };

// ─────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────
function getRandomWord() {
  return Words[Math.floor(Math.random() * Words.length)];
}

function evaluate(guess, answer) {
  const res = Array(5).fill("absent");
  const ans = answer.split("");
  guess.split("").forEach((l, i) => {
    if (l === ans[i]) { res[i] = "correct"; ans[i] = null; }
  });
  guess.split("").forEach((l, i) => {
    if (res[i] !== "correct") {
      const j = ans.indexOf(l);
      if (j !== -1) { res[i] = "present"; ans[j] = null; }
    }
  });
  return res;
}

// ─────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────
function IconBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} className="saltong-icon-btn">
      {children}
    </button>
  );
}

function WModal({ onClose, children }) {
  return (
    <div className="saltong-modal-overlay" onClick={onClose}>
      <div className="saltong-modal" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────
function SaltongGame({ onBack, onRetry }) {
  const [answer] = useState(getRandomWord);
  const [guesses, setGuesses] = useState([]);
  const [current, setCurrent] = useState("");
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [toast, setToast] = useState("");
  const [letterMap, setLetterMap] = useState({});
  const [shake, setShake] = useState(false);
  const [revealIdx, setRevealIdx] = useState(-1);
  const [revealedCols, setRevealedCols] = useState({});
  const [bounceRow, setBounceRow] = useState(-1);
  const [showHelp, setShowHelp] = useState(true);
  const [showStats, setShowStats] = useState(false);

  const showToast = (msg, dur = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(""), dur);
  };

  const submit = useCallback(() => {
    if (current.length !== 5) {
      showToast("Kulang pa ang mga titik!");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    if (!Words.includes(current)) {
      showToast("Hindi kilalang salita!");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    const result = evaluate(current, answer);
    const row = guesses.length;
    const newGuesses = [...guesses, { word: current, result }];
    setGuesses(newGuesses);
    setRevealIdx(row);

    [0,1,2,3,4].forEach(col =>
      setTimeout(
        () => setRevealedCols(p => ({ ...p, [`${row}-${col}`]: true })),
        col * 280 + 140
      )
    );

    setTimeout(() => {
      setRevealIdx(-1);
      const map = { ...letterMap };
      const pri = { correct: 3, present: 2, absent: 1 };
      current.split("").forEach((l, i) => {
        if (!map[l] || pri[result[i]] > pri[map[l]]) map[l] = result[i];
      });
      setLetterMap(map);
    }, 5 * 280 + 200);

    const isWin = current === answer;
    const isLast = newGuesses.length >= 6;

    if (isWin) {
      setTimeout(() => {
        setBounceRow(row);
        setTimeout(() => setBounceRow(-1), 1000);
        setWon(true);
        setOver(true);
        const m = ["Kahanga-hanga!","Napakahusay!","Magaling!","Tama!","Mabuti na!","Swerte!"];
        showToast(m[Math.min(row, 5)], 4000);
        setShowStats(true);
      }, 5 * 280 + 400);
    } else if (isLast) {
      setTimeout(() => {
        setOver(true);
        showToast(`Sagot: ${answer}`, 8000);
        setShowStats(true);
      }, 5 * 280 + 400);
    }

    setCurrent("");
  }, [current, guesses, answer, letterMap]);

  useEffect(() => {
    const fn = e => {
      if (over) return;
      const k = e.key.toUpperCase();
      if (k === "ENTER") submit();
      else if (k === "BACKSPACE") setCurrent(p => p.slice(0, -1));
      else if (/^[A-Z]$/.test(k) && current.length < 5) setCurrent(p => p + k);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [over, current, submit]);

  const tap = k => {
    if (over) return;
    if (k === "ENTER") submit();
    else if (k === "⌫") setCurrent(p => p.slice(0, -1));
    else if (current.length < 5) setCurrent(p => p + k);
  };

  const getLetter = (r, c) =>
    r < guesses.length ? guesses[r].word[c] : r === guesses.length ? current[c] || "" : "";

  const getBg = (r, c) => {
    if (r < guesses.length && (revealedCols[`${r}-${c}`] || revealIdx === -1 || r < revealIdx))
      return TC[guesses[r].result[c]];
    return "transparent";
  };

  const getBorder = (r, c) => {
    if (r < guesses.length && (revealedCols[`${r}-${c}`] || r < revealIdx))
      return "2px solid transparent";
    const l = getLetter(r, c);
    return l ? "2px solid #818384" : "2px solid #3a3a3c";
  };

  const keyClass = k => {
    const st = letterMap[k];
    const wide = k === "ENTER" || k === "⌫";
    const stateClass = st ? `saltong-key--${st}` : "saltong-key--default";
    return `saltong-key ${stateClass}${wide ? " saltong-key--wide" : ""}`;
  };

  const helpExamples = [
    { word: "BAHAY", hi: [0], color: "correct", label: "Ang B ay nasa tamang lugar." },
    { word: "BAYAN", hi: [2], color: "present", label: "Ang Y ay nasa salita ngunit maling lugar." },
    { word: "TALAB", hi: [3], color: "absent",  label: "Ang L ay wala sa salita." },
  ];

  return (
    <div className="saltong-root">
      {/* Header */}
      <div className="saltong-header">
        <button className="saltong-back-btn" onClick={onBack} title="Bumalik">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Bumalik
        </button>
        <div className="saltong-title-block">
          <div className="saltong-title">SALTONG</div>
          <div className="saltong-subtitle">TAGALOG WORDLE</div>
        </div>
        <div className="saltong-header-icons">
          <IconBtn title="Tulong" onClick={() => setShowHelp(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </IconBtn>
          <IconBtn title="Istatistika" onClick={() => setShowStats(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="saltong-toast">{toast}</div>}

      {/* Grid */}
      <div className="saltong-grid">
        {Array(6).fill(null).map((_, r) => {
          const isShake = shake && r === guesses.length;
          const isBounce = bounceRow === r;
          return (
            <div
              key={r}
              className={`saltong-row${isShake ? " saltong-row--shake" : ""}${isBounce ? " saltong-row--bounce" : ""}`}
            >
              {Array(5).fill(null).map((_, c) => {
                const letter = getLetter(r, c);
                const bg = getBg(r, c);
                const border = getBorder(r, c);
                const isCurr = r === guesses.length;
                const isRevRow = r === revealIdx;
                const isFlipping = isRevRow && !revealedCols[`${r}-${c}`];

                const animStyle = letter && isCurr && !over
                  ? { animation: "gPop 0.1s ease" }
                  : isFlipping && r < guesses.length
                  ? { animation: `gFlip 0.28s ease ${c * 280}ms both` }
                  : {};

                return (
                  <div
                    key={c}
                    className="saltong-tile"
                    style={{ background: bg, border, color: bg !== "transparent" ? "#fff" : undefined, ...animStyle }}
                  > 
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Keyboard */}
      <div className="saltong-keyboard">
        {KB_ROWS.map((row, ri) => (
          <div key={ri} className="saltong-kb-row">
            {row.map(k => (
              <button key={k} className={keyClass(k)} onClick={() => tap(k)}>
                {k}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <WModal onClose={() => setShowHelp(false)}>
          <h2>PAANO MAGLARO</h2>
          <p>
            Hulaan ang <strong style={{ color: "#fff" }}>SALTONG</strong> sa 6 na pagkakataon.
            Ang bawat hula ay isang wastong <strong style={{ color: "#fff" }}>5-letrang salitang Tagalog</strong>.
            Pindutin ang <strong style={{ color: "#fff" }}>ENTER</strong> upang isumite.
          </p>
          <div className="saltong-modal-divider">
            {helpExamples.map(ex => (
              <div key={ex.word} className="saltong-modal-example">
                <div className="saltong-modal-example-row">
                  {ex.word.split("").map((l, i) => (
                    <div
  key={i}
  className="saltong-modal-tile"
  style={{
    background: ex.hi.includes(i) ? TC[ex.color] : "transparent",
    border: ex.hi.includes(i) ? "2px solid transparent" : "2px solid #3a3a3c",
    color: ex.hi.includes(i) ? "#fff" : "var(--tile-text, #121213)",
  }}
>
  {l}
</div>
                  ))}
                </div>
                <p>{ex.label}</p>
              </div>
            ))}
          </div>
          <button className="saltong-modal-btn" onClick={() => setShowHelp(false)}>
            Maglaro na!
          </button>
        </WModal>
      )}

      {/* Stats Modal */}
      {showStats && (
        <WModal onClose={() => setShowStats(false)}>
          <h2 style={{ letterSpacing: 2 }}>
            {won ? "🎉 NAGWAGI KA!" : over ? "😔 TAPOS NA" : "📊 ISTATISTIKA"}
          </h2>
          {over && (
            <div className="saltong-modal-answer">
              <div className="saltong-modal-answer-label">ANG SAGOT</div>
              <div className={`saltong-modal-answer-word saltong-modal-answer-word--${won ? "win" : "lose"}`}>
                {answer}
              </div>
            </div>
          )}
          <button className="saltong-modal-btn" onClick={() => setShowStats(false)}>
            {over ? "Salamat!" : "Bumalik"}
          </button>
          {over && (
            <button
              className="saltong-modal-btn"
              style={{ marginTop: 8, background: "#1a1a1b", border: "1px solid #3a3a3c" }}
              onClick={onRetry}
            >
              Maglaro Ulit 🔁
            </button>
          )}
        </WModal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
//  EXPORTED WRAPPER — manages retry
//  Changing retryKey unmounts + remounts
//  SaltongGame, giving it a fresh random word.
// ─────────────────────────────────────────
export default function Saltong({ onBack }) {
  const [retryKey, setRetryKey] = useState(0);
  return (
    <SaltongGame
      key={retryKey}
      onBack={onBack}
      onRetry={() => setRetryKey(k => k + 1)}
    />
  );
}