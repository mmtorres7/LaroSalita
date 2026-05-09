import { useState, useEffect, useRef, useCallback } from "react";
import raw from "../public/tagalog_dict.json";
import "./Salitaan.css";

// ─────────────────────────────────────────
//  DICTIONARY
// ─────────────────────────────────────────
const DICT = new Set(raw.data.map(w => w.toLowerCase().trim()));

// ─────────────────────────────────────────
//  ENGINE
// ─────────────────────────────────────────
const VOWELS = new Set(["a","e","i","o","u"]);
function isV(c) { return !!c && VOWELS.has(c); }
function toNorm(w) { return w.toLowerCase().replace(/ng/g, "\x00"); }
function fromNorm(s) { return s.replace(/\x00/g, "ng"); }

function getChainTiers(word) {
  const n = toNorm(word.toLowerCase());
  const len = n.length;
  if (!len) return { tiers: [], endsVowel: false };

  const last     = n[len - 1];
  const endsNG   = last === "\x00";
  const endsVowel = isV(last);
  let tiers = [];

  if (endsNG) {
    const pre = n[len - 2] ?? "";
    if (isV(pre)) {
      // VNG: e.g. "silong" → ang, ng, a
      tiers.push(fromNorm(pre + "\x00")); // best: VNG
      tiers.push(fromNorm("\x00"));       // ok:   ng
      tiers.push(pre);                    // min:  V
    } else if (pre && !isV(pre)) {
      const prepre = n[len - 3] ?? "";
      if (isV(prepre)) {
        // CVNG: e.g. "walang" → lang, ang, ng, a
        tiers.push(fromNorm(prepre + pre + "\x00")); // best: CVNG
        tiers.push(fromNorm(prepre + "\x00"));       // ok:   VNG
        tiers.push(fromNorm("\x00"));                // ok:   ng
        tiers.push(prepre);                          // min:  V
      } else {
        tiers.push(fromNorm("\x00"));
      }
    } else {
      tiers.push(fromNorm("\x00"));
    }
  } else if (endsVowel) {
    const pre = n[len - 2] ?? "";
    if (pre && !isV(pre) && pre !== "\x00") {
      // CV: e.g. "bata" → ta (best), a (penalty 0 bonus)
      tiers.push(fromNorm(pre + last)); // best: CV
      tiers.push(last);                 // penalty: V
    } else {
      tiers.push(last);                 // bare V
    }
  } else {
    // ends consonant (non-ng)
    const c1 = last;
    const v1 = n[len - 2] ?? "";
    if (isV(v1)) {
      const c0 = n[len - 3] ?? "";
      if (c0 && !isV(c0) && c0 !== "\x00") {
        tiers.push(fromNorm(c0 + v1 + c1)); // best: CVC
        tiers.push(fromNorm(v1 + c1));      // ok:   VC
        tiers.push(v1);                     // min:  V
      } else {
        tiers.push(fromNorm(v1 + c1)); // best: VC
        tiers.push(v1);                // ok:   V
      }
    } else {
      tiers.push(fromNorm(c1));
    }
  }

  return { tiers: tiers.filter(Boolean), endsVowel };
}

function checkChain(word, prevWord) {
  if (!prevWord) return { valid: true, tier: 0 };
  const wl = word.toLowerCase();
  const { tiers, endsVowel } = getChainTiers(prevWord);
  for (let i = 0; i < tiers.length; i++) {
    if (tiers[i] && wl.startsWith(tiers[i])) return { valid: true, tier: i };
  }
  if (endsVowel && isV(wl[0])) return { valid: true, tier: tiers.length };
  return { valid: false, tiers };
}

function validFirstWord(word) {
  const wl = word.toLowerCase();
  if (!wl.length) return false;
  if (wl.startsWith("ng") && wl.length > 2 && isV(wl[2])) return true;
  if (isV(wl[0])) return false;
  return wl.length >= 2 && isV(wl[1]);
}

function getHintParts(prevWord) {
  if (!prevWord) return { best: [], ok: [] };
  const { tiers } = getChainTiers(prevWord);
  return { best: tiers.slice(0, 1), ok: tiers.slice(1) };
}

function calcBonus(word, tier) {
  const l = word.length;
  if (tier === 0) return 4 + Math.floor(l / 3);
  if (tier === 1) return 1 + Math.floor(l / 4);
  return 0;
}

// ─────────────────────────────────────────
//  GLOSSARY DATA — static pattern table
// ─────────────────────────────────────────
const PATTERNS = [
  {
    ending: "CV",
    example: "bata",
    desc: "Nagtatapos sa katinig + patinig",
    rows: [
      { starter: "CV (ta…)",  bonus: "+4–7s", tier: 0, note: "Pinakamahaba — buong CV" },
      { starter: "V (a…)",    bonus: "+0s",   tier: 2, note: "Parusa — tanggap pero walang dagdag na oras" },
    ],
  },
  {
    ending: "CVC",
    example: "buhok",
    desc: "Nagtatapos sa katinig + patinig + katinig",
    rows: [
      { starter: "CVC (hok…)", bonus: "+4–7s", tier: 0, note: "Pinakamahaba" },
      { starter: "VC (ok…)",   bonus: "+1–3s", tier: 1, note: "Ok" },
      { starter: "V (o…)",     bonus: "+0s",   tier: 2, note: "Pinakamaikli" },
    ],
  },
  {
    ending: "VC",
    example: "aral",
    desc: "Nagtatapos sa patinig + katinig (walang nauna)",
    rows: [
      { starter: "VC (al…)",  bonus: "+4–7s", tier: 0, note: "Pinakamahaba" },
      { starter: "V (a…)",    bonus: "+1–3s", tier: 1, note: "Ok" },
    ],
  },
  {
    ending: "VNG",
    example: "silong",
    desc: "Nagtatapos sa patinig + NG",
    rows: [
      { starter: "VNG (ong…)", bonus: "+4–7s", tier: 0, note: "Pinakamahaba" },
      { starter: "NG (ng…)",   bonus: "+1–3s", tier: 1, note: "Ok — NG ay isang titik" },
      { starter: "V (o…)",     bonus: "+0s",   tier: 2, note: "Pinakamaikli" },
    ],
  },
  {
    ending: "CVNG",
    example: "walang",
    desc: "Nagtatapos sa CV + NG — pinakamaraming opsyon",
    rows: [
      { starter: "CVNG (lang…)", bonus: "+4–7s", tier: 0, note: "Pinakamahaba" },
      { starter: "VNG (ang…)",   bonus: "+4–7s", tier: 0, note: "Mahaba rin" },
      { starter: "NG (ng…)",     bonus: "+0s",   tier: 2, note: "Ok" },
      { starter: "V (a…)",       bonus: "+0s",   tier: 2, note: "Pinakamaikli" },
    ],
  },
  {
    ending: "V (bare)",
    example: "oo",
    desc: "Nagtatapos sa nag-iisang patinig",
    rows: [
      { starter: "V (o…)", bonus: "+4–7s", tier: 0, note: "Tanging opsyon" },
    ],
  },
];

const TIER_NOTE_COLOR = ["#538d4e", "#b59f3b", "#4a4a6a"];

// ─────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────
const STARTERS = [
  "bata","kain","saya","tula","wika","bago","sala","tama","walo","yaman",
  "bayan","kapit","salita","tubig","walang","yelo","buhay","kahoy","sagot",
  "tanim","walis","bagay","takot","galit","luha","ngiti","puso","bituin","buwan",
];

function pickStarter(used) {
  const pool = STARTERS.filter(w => !used.has(w));
  return pool[Math.floor(Math.random() * pool.length)] ?? "bata";
}

const TIER_COLOR = [
  { bg: "#538d4e", border: "#538d4e", label: "Pinakamahaba" },
  { bg: "#b59f3b", border: "#b59f3b", label: "OK" },
  { bg: "#4a4a6a", border: "#6060aa", label: "Maikli" },
  { bg: "#3a3a3c", border: "#3a3a3c", label: "Simula" },
];

const MAX_TIME = 60;
const CIRC = 2 * Math.PI * 44;

// ─────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────
function SalitaanGame({ onBack, onRetry }) {
  // screen: "intro" | "playing" | "over"
  const [screen, setScreen]         = useState("intro");
  const [showForfeit, setShowForfeit] = useState(false);   // ? during play
  const [showGlossary, setShowGlossary] = useState(false); // book icon

  const [chain, setChain]           = useState([]);
  const [promptWord, setPromptWord] = useState("");
  const [usedWords, setUsedWords]   = useState(new Set());
  const [score, setScore]           = useState(0);
  const [streak, setStreak]         = useState(0);
  const [timeLeft, setTimeLeft]     = useState(30);
  const [inputVal, setInputVal]     = useState("");
  const [toast, setToast]           = useState("");
  const [shake, setShake]           = useState(false);
  const [bonusFlash, setBonusFlash] = useState(null);
  const [showStats, setShowStats]   = useState(false);

  const timerRef = useRef(null);
  const timeRef  = useRef(30);
  const inputRef = useRef(null);
  const chainRef = useRef(null);
  const gameOver = screen === "over";

  const [starterWord] = useState(() => pickStarter(new Set()));

  // ── scroll chain ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (chainRef.current)
      chainRef.current.scrollLeft = chainRef.current.scrollWidth;
  }, [chain]);

  // ── keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = e => {
      if (screen !== "playing" || showStats || showForfeit || showGlossary) return;
      if (e.key === "Enter") handleSubmit();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, showStats, showForfeit, showGlossary, inputVal]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── startGame ─────────────────────────────────────────────────────────────
  function startGame() {
    const used = new Set([starterWord]);
    timeRef.current = 30;
    setTimeLeft(30);
    setChain([{ word: starterWord, tier: 3, bonus: 0 }]);
    setPromptWord(starterWord);
    setUsedWords(used);
    setScore(0);
    setStreak(0);
    setInputVal("");
    setScreen("playing");
    setShowForfeit(false);

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      timeRef.current = Math.max(0, parseFloat((timeRef.current - 0.1).toFixed(1)));
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) {
        clearInterval(timerRef.current);
        setScreen("over");
        setShowStats(true);
      }
    }, 100);

    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ── forfeit — timer keeps running, new intro triggers on confirm ──────────
  function confirmForfeit() {
    clearInterval(timerRef.current);
    setShowForfeit(false);
    onRetry(); // remounts with fresh state + intro
  }

  function showToast(msg, dur = 2000) {
    setToast(msg);
    setTimeout(() => setToast(""), dur);
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const word = inputVal.trim().toLowerCase();
    if (!word) return;

    if (word.length < 2) {
      showToast("Masyadong maikli!");
      triggerShake();
      return;
    }
    if (usedWords.has(word)) {
      showToast("Ginamit na ang salitang ito!");
      triggerShake();
      setStreak(0);
      return;
    }
    if (!DICT.has(word)) {
      showToast("Hindi nahanap sa diksyunaryo.");
      triggerShake();
      setStreak(0);
      return;
    }
    if (!promptWord && !validFirstWord(word)) {
      showToast("Dapat CV, CVC, o NGV ang simula.");
      triggerShake();
      return;
    }

    const result = checkChain(word, promptWord);
    if (!result.valid) {
      const { tiers = [] } = result;
      const hint = tiers.length ? tiers.map(t => `"${t}"`).join(" o ") : "";
      showToast(`Mali ang simula. Dapat: ${hint}`);
      triggerShake();
      setStreak(0);
      return;
    }

    const bonus = calcBonus(word, result.tier);
    timeRef.current = Math.min(MAX_TIME, timeRef.current + bonus);
    setTimeLeft(timeRef.current);

    const pts = word.length * (result.tier === 0 ? 2 : 1);
    setScore(s => s + pts);
    setStreak(s => s + 1);
    setUsedWords(prev => new Set([...prev, word]));
    setChain(prev => [...prev, { word, tier: result.tier, bonus }]);
    setPromptWord(word);
    setInputVal("");

    if (bonus > 0) {
      setBonusFlash(`+${bonus}s`);
      setTimeout(() => setBonusFlash(null), 900);
    }
    showToast(`+${pts} puntos${bonus > 0 ? `  ·  +${bonus}s` : ""}`, 1500);
  }, [inputVal, usedWords, promptWord]);

  // ── derived ───────────────────────────────────────────────────────────────
  const timerPct     = Math.min(1, timeLeft / MAX_TIME);
  const strokeOffset = CIRC * (1 - timerPct);
  const timerColor   = timeLeft > 15 ? "#538d4e" : timeLeft > 7 ? "#b59f3b" : "#e74c3c";
  const { best, ok } = getHintParts(promptWord);
  const wordCount    = chain.length - 1;
  const longestWord  = chain.slice(1).reduce((a, w) => Math.max(a, w.word.length), 0);
  const bestWord     = chain.slice(1).reduce((a, w) => w.word.length > a.length ? w.word : a, "");

  // ─────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────
  return (
    <div className="salitaan-root">

      {/* ── HEADER ── */}
      <div className="salitaan-header">
        <button className="salitaan-back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Bumalik
        </button>

        <div className="salitaan-title-block">
          <div className="salitaan-title">SALITAAN</div>
          <div className="salitaan-subtitle">FILIPINO SHIRITORI</div>
        </div>

        <div className="salitaan-header-icons">
          {/* Glossary — always visible, timer keeps running */}
          <button
            className="salitaan-icon-btn"
            title="Gabay sa Mga Pattern"
            onClick={() => setShowGlossary(true)}
          >
            {/* book icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
          </button>

          {/* Help / forfeit — always visible */}
          <button
            className="salitaan-icon-btn"
            title={screen === "playing" ? "Paano Maglaro (babaguhin ang laro)" : "Paano Maglaro"}
            onClick={() => screen === "playing" ? setShowForfeit(true) : setShowForfeit(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </button>

          {/* Stats — only after game over */}
          {gameOver && (
            <button className="salitaan-icon-btn" title="Istatistika" onClick={() => setShowStats(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6"  y1="20" x2="6"  y2="14"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && <div className="salitaan-toast">{toast}</div>}

      {/* ── GAME AREA ── */}
      <div className="salitaan-body">

        <div className="salitaan-top-row">
          <div className="salitaan-timer-wrap">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#3a3a3c" strokeWidth="6"/>
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke={timerColor} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={strokeOffset}
                style={{ transform:"rotate(-90deg)", transformOrigin:"50% 50%", transition:"stroke-dashoffset 0.1s linear, stroke 0.3s" }}
              />
            </svg>
            <div className="salitaan-timer-num" style={{ color: timerColor }}>
              {Math.ceil(timeLeft)}
            </div>
          </div>

          <div className="salitaan-stats-row">
            {[
              { label: "Puntos",      val: score },
              { label: "Salita",      val: wordCount },
              { label: "Sunod-sunod", val: streak },
            ].map(({ label, val }) => (
              <div key={label} className="salitaan-stat-box">
                <div className="salitaan-stat-val">{val}</div>
                <div className="salitaan-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {bonusFlash && <div className="salitaan-bonus-flash">{bonusFlash}</div>}

        <div className="salitaan-chain" ref={chainRef}>
          {chain.map((item, i) => {
            const tc = TIER_COLOR[item.tier];
            return (
              <span key={i} className="salitaan-chip" style={{ background: tc.bg, borderColor: tc.border }}>
                {item.word}
                {item.bonus > 0 && <sup className="salitaan-chip-sup">+{item.bonus}s</sup>}
              </span>
            );
          })}
        </div>

        <div className="salitaan-prompt-box">
          <div className="salitaan-prompt-label">Sagutin ang:</div>
          <div className="salitaan-prompt-word">{promptWord || starterWord}</div>
          <div className="salitaan-prompt-hint">
            Magsimula sa:{" "}
            {best.map((b, i) => <span key={i} className="salitaan-hint-best">"{b}"</span>)}
            {ok.length > 0 && (
              <> o kaya:{" "}{ok.map((o, i) => <span key={i} className="salitaan-hint-ok">"{o}"</span>)}</>
            )}
          </div>
        </div>

        <div className={`salitaan-input-row${shake ? " salitaan-shake" : ""}`}>
          <input
            ref={inputRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Isulat ang salita..."
            className="salitaan-input"
            autoComplete="off" autoCorrect="off" spellCheck={false}
            disabled={screen !== "playing"}
          />
          <button className="salitaan-submit-btn" onClick={handleSubmit} disabled={screen !== "playing"}>
            →
          </button>
        </div>

        <div className="salitaan-legend">
          {TIER_COLOR.slice(0, 3).map((tc, i) => (
            <span key={i} className="salitaan-legend-chip" style={{ background: tc.bg, borderColor: tc.border }}>
              {tc.label}
            </span>
          ))}
          <span className="salitaan-dict-badge">📖 {DICT.size.toLocaleString()} salita</span>
        </div>
      </div>

      {/* ══════════════════════════════════════
          INTRO MODAL — comprehensive tutorial
          Timer does NOT start until button press
         ══════════════════════════════════════ */}
      {screen === "intro" && (
        <SModal dismissable={false}>
          <h2>SALITAAN</h2>

          <div className="salitaan-modal-answer" style={{ marginBottom: 12 }}>
            <div className="salitaan-modal-answer-label">UNANG SALITA NGAYON</div>
            <div className="salitaan-modal-answer-word" style={{ letterSpacing: 6 }}>
              {starterWord.toUpperCase()}
            </div>
          </div>

          {/* Core rules */}
          <div className="salitaan-intro-section">
            <div className="salitaan-intro-section-title">ANG LARO</div>
            <p>
              Gumawa ng pinakamahabang <strong style={{color:"#fff"}}>kadena ng mga salitang Filipino</strong> bago
              maubos ang oras. Ang bawat salita ay dapat magsimula sa{" "}
              <strong style={{color:"#fff"}}>huling pantig</strong> ng nakaraang salita.
            </p>
            <ul className="salitaan-intro-list">
              <li>Simula: <strong style={{color:"#fff"}}>30 segundo</strong>. Maximum: <strong style={{color:"#fff"}}>60 segundo</strong>.</li>
              <li>Ang bawat tamang salita ay nagdadagdag ng oras batay sa haba ng tugma.</li>
              <li>Dapat ang unang salita ay magsimula sa <strong style={{color:"#fff"}}>CV, CVC, o NGV</strong> — hindi pure patinig.</li>
              <li>Hindi maaaring ulitin ang mga salita.</li>
              <li>Lahat ng salita ay dapat nasa <strong style={{color:"#fff"}}>diksyunaryo</strong>.</li>
            </ul>
          </div>

          {/* Time bonuses */}
          <div className="salitaan-intro-section">
            <div className="salitaan-intro-section-title">DAGDAG NA ORAS</div>
            <div className="salitaan-bonus-table">
              <div className="salitaan-bonus-row salitaan-bonus-header">
                <span>Antas</span><span>Tugma</span><span>Dagdag</span>
              </div>
              <div className="salitaan-bonus-row">
                <span className="salitaan-chip" style={{background:TIER_COLOR[0].bg,borderColor:TIER_COLOR[0].border,fontSize:11}}>Pinakamahaba</span>
                <span>Pinakamahabang pantig</span>
                <span style={{color:"#538d4e",fontWeight:700}}>+4–7s</span>
              </div>
              <div className="salitaan-bonus-row">
                <span className="salitaan-chip" style={{background:TIER_COLOR[1].bg,borderColor:TIER_COLOR[1].border,fontSize:11}}>OK</span>
                <span>Mas maikling tugma</span>
                <span style={{color:"#b59f3b",fontWeight:700}}>+1–3s</span>
              </div>
              <div className="salitaan-bonus-row">
                <span className="salitaan-chip" style={{background:TIER_COLOR[2].bg,borderColor:TIER_COLOR[2].border,fontSize:11}}>Maikli</span>
                <span>Pinakamaikli / parusa</span>
                <span style={{color:"#818384",fontWeight:700}}>+0s</span>
              </div>
            </div>
            <p style={{fontSize:11,color:"#818384",marginTop:6}}>
              Formula: Antas 0 → 4 + ⌊haba/3⌋s · Antas 1 → 1 + ⌊haba/4⌋s
            </p>
          </div>

          {/* NG rule */}
          <div className="salitaan-intro-section">
            <div className="salitaan-intro-section-title">ESPESYAL: ANG TITIK NG</div>
            <p>
              Ang <strong style={{color:"#fff"}}>NG</strong> ay isang titik sa Filipino alphabet.
              Maaaring magsimula ng salita sa <strong style={{color:"#fff"}}>NG</strong> (hal. <em>ngiti, ngayon, nginig</em>).
              Kung nagtatapos ang salita sa NG (hal. <em>walang</em>), ang mga posibleng simula ay:
            </p>
            <div className="salitaan-intro-chain-demo">
              {[
                {w:"lang…", t:0},{w:"ang…", t:0},{w:"ng…", t:2},{w:"a…", t:2}
              ].map((item,i) => (
                <span key={i} className="salitaan-chip"
                  style={{background:TIER_COLOR[item.t].bg, borderColor:TIER_COLOR[item.t].border}}>
                  {item.w}
                </span>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="salitaan-intro-warning">
            ⚠️ Kapag nagsimula na ang laro, ang pagbubukas ng <strong>Paano Maglaro</strong> ay magpapatapos ng iyong kasalukuyang laro. Tiyaking naiintindihan mo ang mga patakaran bago pindutin ang Maglaro!
          </div>

          <button className="salitaan-modal-btn" onClick={startGame} style={{marginTop:4}}>
            Handa na ako — Maglaro! ▶
          </button>
        </SModal>
      )}

      {/* ══════════════════════════════════════
          FORFEIT MODAL — ? during active play
          Timer keeps running — no pause exploit
         ══════════════════════════════════════ */}
      {showForfeit && (
        <SModal dismissable={true} onClose={() => setShowForfeit(false)}>
          <h2>PAANO MAGLARO</h2>

          {screen === "playing" && (
            <div className="salitaan-forfeit-warning">
              ⏱ Patuloy ang oras! Ang pagpindot ng <strong>Sisuko</strong> ay magpapatapos ng iyong laro.
            </div>
          )}

          <div className="salitaan-intro-section" style={{marginTop:8}}>
            <div className="salitaan-intro-section-title">BUOD NG PATAKARAN</div>
            <ul className="salitaan-intro-list">
              <li>Simula ng laro: <strong style={{color:"#fff"}}>30s</strong>. Maximum: <strong style={{color:"#fff"}}>60s</strong>.</li>
              <li>Ang susunod na salita ay dapat magsimula sa <strong style={{color:"#fff"}}>huling pantig</strong> ng nakaraang salita.</li>
              <li>Mas mahaba ang katugmang pantig → mas maraming oras.</li>
              <li>Ang <strong style={{color:"#fff"}}>NG</strong> ay isang titik — maaaring magsimula ng salita.</li>
              <li>Hindi maaaring ulitin ang salita.</li>
            </ul>
          </div>

          <div className="salitaan-forfeit-btns">
            <button
              className="salitaan-modal-btn"
              style={{background:"#3a3a3c", border:"1px solid #555"}}
              onClick={() => setShowForfeit(false)}
            >
              Magpatuloy ▶
            </button>
            {screen === "playing" && (
              <button
                className="salitaan-modal-btn"
                style={{background:"#7f1d1d", border:"1px solid #991b1b", marginTop:8}}
                onClick={confirmForfeit}
              >
                Sisuko — Bagong Laro 🔁
              </button>
            )}
            {screen !== "playing" && (
              <button className="salitaan-modal-btn" style={{marginTop:8}} onClick={() => setShowForfeit(false)}>
                Sige!
              </button>
            )}
          </div>
        </SModal>
      )}

      {/* ══════════════════════════════════════
          GLOSSARY MODAL — static pattern table
          Timer keeps running
         ══════════════════════════════════════ */}
      {showGlossary && (
        <SModal dismissable={true} onClose={() => setShowGlossary(false)}>
          <h2>GABAY SA MGA PATTERN</h2>

          {screen === "playing" && (
            <div className="salitaan-forfeit-warning">
              ⏱ Patuloy ang oras habang binabasa ito.
            </div>
          )}

          <div className="salitaan-glossary">
            {PATTERNS.map((pat, pi) => (
              <div key={pi} className="salitaan-glossary-block">
                <div className="salitaan-glossary-heading">
                  <span className="salitaan-glossary-tag">{pat.ending}</span>
                  <span className="salitaan-glossary-example">hal. <em>{pat.example}</em></span>
                </div>
                <div className="salitaan-glossary-desc">{pat.desc}</div>
                <div className="salitaan-glossary-rows">
                  {pat.rows.map((row, ri) => (
                    <div key={ri} className="salitaan-glossary-row">
                      <span
                        className="salitaan-glossary-starter"
                        style={{ color: TIER_NOTE_COLOR[Math.min(row.tier, 2)] }}
                      >
                        {row.starter}
                      </span>
                      <span className="salitaan-glossary-bonus" style={{ color: row.tier === 0 ? "#538d4e" : row.tier === 1 ? "#b59f3b" : "#818384" }}>
                        {row.bonus}
                      </span>
                      <span className="salitaan-glossary-note">{row.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button className="salitaan-modal-btn" onClick={() => setShowGlossary(false)} style={{marginTop:8}}>
            Isara
          </button>
        </SModal>
      )}

      {/* ══════════════════════════════════════
          STATS MODAL — game over
         ══════════════════════════════════════ */}
      {showStats && (
        <SModal dismissable={false}>
          <h2>⏰ TAPOS NA ANG ORAS</h2>

          <div className="salitaan-modal-answer">
            <div className="salitaan-modal-answer-label">PINAKAMAHABA</div>
            <div className="salitaan-modal-answer-word">{bestWord || "—"}</div>
          </div>

          <div className="salitaan-stats-grid">
            {[
              { label: "Puntos",                val: score },
              { label: "Salita",                val: wordCount },
              { label: "Pinakamahabang Salita", val: longestWord || "—" },
              { label: "Pinakamataas na Sunod", val: streak },
            ].map(s => (
              <div key={s.label} className="salitaan-stat-box">
                <div className="salitaan-stat-val">{s.val}</div>
                <div className="salitaan-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {chain.length > 1 && (
            <div className="salitaan-modal-chain">
              <div className="salitaan-modal-answer-label" style={{ marginBottom: 8 }}>KADENA</div>
              <div className="salitaan-modal-chain-words">
                {chain.slice(1).map((item, i) => {
                  const tc = TIER_COLOR[item.tier];
                  return (
                    <span key={i} className="salitaan-chip" style={{ background: tc.bg, borderColor: tc.border }}>
                      {item.word}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <button className="salitaan-modal-btn" onClick={onRetry}>
            Maglaro Ulit 🔁
          </button>
        </SModal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
//  SHARED MODAL
// ─────────────────────────────────────────
function SModal({ dismissable = true, onClose, children }) {
  return (
    <div
      className="salitaan-modal-overlay"
      onClick={dismissable && onClose ? onClose : undefined}
    >
      <div className="salitaan-modal" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  EXPORTED WRAPPER
// ─────────────────────────────────────────
export default function Salitaan({ onBack }) {
  const [retryKey, setRetryKey] = useState(0);
  return (
    <SalitaanGame
      key={retryKey}
      onBack={onBack}
      onRetry={() => setRetryKey(k => k + 1)}
    />
  );
}