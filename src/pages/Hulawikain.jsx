import { useCallback, useEffect, useMemo, useState } from "react";
import Sawikain from "../models/WordsHulawikain.jsx";
import rawWords from "../public/tagalog_dict.json";
import "./Hulawikain.css";

const KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

const TC = { correct: "#538d4e", present: "#b59f3b", absent: "#3a3a3c", misplaced: "#7b3fb5" };
const ANSWER_POOL = Sawikain.filter(item => item.letters.length <= 24);
const WORD_SET = new Set(rawWords.data.map(word => normalizeLetters(word)).filter(Boolean));

["ANG", "NG", "DI", "SA", "AT", "NA"].forEach(word => WORD_SET.add(word));

function normalizeLetters(value) {
  return value.toUpperCase().replace(/[^A-Z]/g, "");
}

function getRandomSawikain() {
  const pool = ANSWER_POOL.length ? ANSWER_POOL : Sawikain;
  return pool[Math.floor(Math.random() * pool.length)];
}

function evaluate(guess, answer, wordLengths) {
  const res = Array(answer.length).fill("absent");

  // Build per-word letter pools from the answer
  let idx = 0;
  const answerWordLetters = wordLengths.map(len => {
    const letters = answer.slice(idx, idx + len).split("");
    idx += len;
    return letters;
  });

  // Build per-word letter pools from the guess
  idx = 0;
  const guessWordLetters = wordLengths.map(len => {
    const letters = guess.slice(idx, idx + len).split("");
    idx += len;
    return letters;
  });

  // Figure out which word each absolute index belongs to
  function wordIndexOf(absIndex) {
    let count = 0;
    for (let w = 0; w < wordLengths.length; w++) {
      if (absIndex < count + wordLengths[w]) return w;
      count += wordLengths[w];
    }
    return -1;
  }

  // Pass 1: mark greens
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) {
      res[i] = "correct";
      const w = wordIndexOf(i);
      const localIdx = i - wordLengths.slice(0, w).reduce((a, b) => a + b, 0);
      answerWordLetters[w][localIdx] = null;
      guessWordLetters[w][localIdx] = null;
    }
  }

  // Pass 2: mark yellow (same word) and purple (different word)
  let guessAbsIdx = 0;
  for (let w = 0; w < wordLengths.length; w++) {
    for (let localIdx = 0; localIdx < wordLengths[w]; localIdx++) {
      const letter = guessWordLetters[w][localIdx];
      if (!letter) { guessAbsIdx++; continue; } // already green

      // Check same word first (yellow)
      const sameWordMatch = answerWordLetters[w].indexOf(letter);
      if (sameWordMatch !== -1) {
        res[guessAbsIdx] = "present";
        answerWordLetters[w][sameWordMatch] = null;
      } else {
        // Check other words (purple)
        const otherWord = answerWordLetters.findIndex(
          (pool, wi) => wi !== w && pool.includes(letter)
        );
        if (otherWord !== -1) {
          res[guessAbsIdx] = "misplaced";
          const matchIdx = answerWordLetters[otherWord].indexOf(letter);
          answerWordLetters[otherWord][matchIdx] = null;
        }
      }
      guessAbsIdx++;
    }
  }

  return res;
}

function phraseParts(phrase) {
  const parts = [];
  let word = "";

  phrase.toUpperCase().split("").forEach(char => {
    if (/[A-Z]/.test(char)) {
      word += char;
      return;
    }
    if (word) {
      parts.push({ type: "word", value: word });
      word = "";
    }
    if (char === " ") parts.push({ type: "space", value: char });
    else parts.push({ type: "punct", value: char });
  });

  if (word) parts.push({ type: "word", value: word });
  return parts;
}

function buildDisplay(answerPhrase, letters) {
  let index = 0;
  return phraseParts(answerPhrase).map((part, partIndex) => {
    if (part.type !== "word") return { ...part, key: `${part.type}-${partIndex}` };
    const startIndex = index;
    const chars = part.value.split("").map(() => {
      const letter = letters[index] || "";
      index += 1;
      return letter;
    });
    return { ...part, key: `word-${partIndex}`, chars, startIndex };
  });
}

function getWordLengths(phrase) {
  return phrase
    .toUpperCase()
    .trim()
    .split(/\s+/)
    .map(word => normalizeLetters(word).length)
    .filter(Boolean);
}

function splitGuessByLengths(guess, lengths) {
  let index = 0;
  return lengths.map(length => {
    const word = guess.slice(index, index + length);
    index += length;
    return word;
  });
}

function Modal({ onClose, children }) {
  return (
    <div className="hulawikain-modal-overlay" onClick={onClose}>
      <div className="hulawikain-modal" onClick={event => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function HulawikainGame({ onBack, onRetry }) {
  const [answer] = useState(getRandomSawikain);
  const [guesses, setGuesses] = useState([]);
  const [current, setCurrent] = useState("");
  const [letterMap, setLetterMap] = useState({});
  const [toast, setToast] = useState("");
  const [shake, setShake] = useState(false);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const answerLength = answer.letters.length;
  const wordLengths = useMemo(() => getWordLengths(answer.phrase), [answer.phrase]);

  const showToast = (message, duration = 2400) => {
    setToast(message);
    setTimeout(() => setToast(""), duration);
  };

  const reject = message => {
    showToast(message);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const submit = useCallback(() => {
    if (over) return;

    if (current.length !== answerLength) {
      reject(`Kailangan ng ${answerLength} titik.`);
      return;
    }

    const invalidWord = splitGuessByLengths(current, wordLengths).find(word => !WORD_SET.has(word));

    if (invalidWord) {
      reject(`Hindi kilalang salita: ${invalidWord}`);
      return;
    }

    const result = evaluate(current, answer.letters, wordLengths);
    const nextGuesses = [...guesses, { letters: current, result }];
    const nextMap = { ...letterMap };
    const priority = { correct: 3, present: 2, misplaced: 2, absent: 1 };

    current.split("").forEach((letter, index) => {
      if (!nextMap[letter] || priority[result[index]] > priority[nextMap[letter]]) {
        nextMap[letter] = result[index];
      }
    });

    setGuesses(nextGuesses);
    setLetterMap(nextMap);
    setCurrent("");

    if (current === answer.letters) {
      setWon(true);
      setOver(true);
      showToast("Tumpak!", 3500);
      setTimeout(() => setShowResult(true), 500);
    } else if (nextGuesses.length >= 6) {
      setOver(true);
      showToast(`Sagot: ${answer.phrase}`, 6500);
      setTimeout(() => setShowResult(true), 500);
    }
  }, [answer, answerLength, current, guesses, letterMap, over, wordLengths]);

  useEffect(() => {
    const onKeyDown = event => {
      if (over) return;
      const key = event.key.toUpperCase();
      if (key === "ENTER") submit();
      else if (key === "BACKSPACE") setCurrent(prev => prev.slice(0, -1));
      else if (/^[A-Z]$/.test(key) && current.length < answerLength) setCurrent(prev => prev + key);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answerLength, current.length, over, submit]);

  const tap = key => {
    if (over) return;
    if (key === "ENTER") submit();
    else if (key === "⌫") setCurrent(prev => prev.slice(0, -1));
    else if (current.length < answerLength) setCurrent(prev => prev + key);
  };

  const keyClass = key => {
    const wide = key === "ENTER" || key === "⌫";
    const state = letterMap[key] ? ` hulawikain-key--${letterMap[key]}` : "";
    return `hulawikain-key${wide ? " hulawikain-key--wide" : ""}${state}`;
  };

  const rows = Array(6).fill(null).map((_, rowIndex) => {
    if (rowIndex < guesses.length) return guesses[rowIndex];
    if (rowIndex === guesses.length) {
      return { letters: current, result: Array(answerLength).fill("empty"), isCurrent: true };
    }
    return { letters: "", result: Array(answerLength).fill("empty") };
  });

  const remaining = answerLength - current.length;

  return (
    <div className="hulawikain-root">
      <div className="hulawikain-header">
        <button className="hulawikain-back-btn" onClick={onBack} title="Bumalik">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Bumalik
        </button>
        <div className="hulawikain-title-block">
          <div className="hulawikain-title">HULAWIKAIN</div>
          <div className="hulawikain-subtitle">SAWIKAIN PHRAZLE</div>
        </div>
        <button className="hulawikain-icon-btn" onClick={() => setShowHelp(true)} title="Tulong">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </button>
      </div>

      {toast && <div className="hulawikain-toast">{toast}</div>}

      <div className="hulawikain-info">
        <span>{answer.phrase.split(" ").length} salita</span>
        <span>{answerLength} titik</span>
        <span>{remaining} kulang</span>
      </div>

      <div className="hulawikain-hint">
        <div className="hulawikain-hint-label">PAHIWATIG</div>
        <div className="hulawikain-hint-text">{answer.definition}</div>
      </div>

      <div className="hulawikain-grid">
        {rows.map((row, rowIndex) => {
          const display = buildDisplay(answer.phrase, row.letters);

          return (
            <div
              key={rowIndex}
              className={`hulawikain-row${shake && row.isCurrent ? " hulawikain-row--shake" : ""}`}
            >
              {display.map(part => {
                if (part.type === "space") return <div key={part.key} className="hulawikain-space" />;
                if (part.type === "punct") return <div key={part.key} className="hulawikain-punct">{part.value}</div>;

                return (
                  <div key={part.key} className="hulawikain-word">
                    {part.chars.map((letter, charIndex) => {
                      const state = row.result[part.startIndex + charIndex] || "empty";
                      return (
                        <div key={charIndex} className={`hulawikain-tile hulawikain-tile--${state}`}>
                          {letter}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="hulawikain-keyboard">
        {KB_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="hulawikain-kb-row">
            {row.map(key => (
              <button key={key} className={keyClass(key)} onClick={() => tap(key)}>
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>

      {showHelp && (
        <Modal onClose={() => setShowHelp(false)}>
          <h2>PAANO MAGLARO</h2>
          <p>Hulaan ang sawikain sa 6 na pagkakataon. I-type lang ang mga titik; awtomatikong ipinapakita ang puwang at bantas ng parirala.</p>
          <p>Ang hula ay kailangang kapareho ng bilang ng titik sa bawat salita. Bawat salitang nabuo ay dapat nasa diksyunaryong Tagalog.</p>
          <div className="hulawikain-help-key">
            <span className="hulawikain-help-dot hulawikain-help-dot--correct" /> Tamang titik at puwesto
          </div>
          <div className="hulawikain-help-key">
            <span className="hulawikain-help-dot hulawikain-help-dot--present" /> Nasa tamang salita pero ibang puwesto
          </div>
          <div className="hulawikain-help-key">
            <span className="hulawikain-help-dot hulawikain-help-dot--misplaced" /> 
            Tamang titik pero nasa ibang salita
          </div>
          <div className="hulawikain-help-key">
            <span className="hulawikain-help-dot hulawikain-help-dot--absent" /> Wala sa sagot
          </div>
          <button className="hulawikain-modal-btn" onClick={() => setShowHelp(false)}>
            Maglaro na!
          </button>
        </Modal>
      )}

      {showResult && (
        <Modal onClose={() => setShowResult(false)}>
          <h2>{won ? "NAGWAGI KA!" : "TAPOS NA"}</h2>
          <div className="hulawikain-answer-label">ANG SAGOT</div>
          <div className={`hulawikain-answer ${won ? "hulawikain-answer--win" : "hulawikain-answer--lose"}`}>
            {answer.phrase}
          </div>
          <div className="hulawikain-result-definition">{answer.definition}</div>
          <button className="hulawikain-modal-btn" onClick={() => setShowResult(false)}>
            Bumalik
          </button>
          <button className="hulawikain-modal-btn hulawikain-modal-btn--secondary" onClick={onRetry}>
            Maglaro Ulit
          </button>
        </Modal>
      )}
    </div>
  );
}

export default function Hulawikain({ onBack }) {
  const [retryKey, setRetryKey] = useState(0);
  return (
    <HulawikainGame
      key={retryKey}
      onBack={onBack}
      onRetry={() => setRetryKey(key => key + 1)}
    />
  );
}
