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
      tiers.push(fromNorm(pre + "\x00"));
      tiers.push(fromNorm("\x00"));
      tiers.push(pre);
    } else if (pre && !isV(pre)) {
      const prepre = n[len - 3] ?? "";
      if (isV(prepre)) {
        tiers.push(fromNorm(prepre + pre + "\x00"));
        tiers.push(fromNorm(prepre + "\x00"));
        tiers.push(fromNorm("\x00"));
        tiers.push(prepre);
      } else {
        tiers.push(fromNorm("\x00"));
      }
    } else {
      tiers.push(fromNorm("\x00"));
    }
  } else if (endsVowel) {
    const pre = n[len - 2] ?? "";
    if (pre && !isV(pre) && pre !== "\x00") {
      tiers.push(fromNorm(pre + last));
      tiers.push(last);
    } else {
      tiers.push(last);
    }
  } else {
    const c1 = last;
    const v1 = n[len - 2] ?? "";
    if (isV(v1)) {
      const c0 = n[len - 3] ?? "";
      if (c0 && !isV(c0) && c0 !== "\x00") {
        tiers.push(fromNorm(c0 + v1 + c1));
        tiers.push(fromNorm(v1 + c1));
        tiers.push(v1);
      } else {
        tiers.push(fromNorm(v1 + c1));
        tiers.push(v1);
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
  const [screen, setScreen]             = useState("intro");
  const [showForfeit, setShowForfeit]   = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [helpTab, setHelpTab]           = useState("rules");

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

  useEffect(() => {
    if (chainRef.current)
      chainRef.current.scrollLeft = chainRef.current.scrollWidth;
  }, [chain]);

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

  function confirmForfeit() {
    clearInterval(timerRef.current);
    setShowForfeit(false);
    onRetry();
  }

  function showToast(msg, dur = 2000) {
    setToast(msg);
    setTimeout(() => setToast(""), dur);
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

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

  const timerPct     = Math.min(1, timeLeft / MAX_TIME);
  const strokeOffset = CIRC * (1 - timerPct);
  const timerColor   = timeLeft > 15 ? "#538d4e" : timeLeft > 7 ? "#b59f3b" : "#e74c3c";
  const { best, ok } = getHintParts(promptWord);
  const wordCount    = chain.length - 1;
  const longestWord  = chain.slice(1).reduce((a, w) => Math.max(a, w.word.length), 0);
  const bestWord     = chain.slice(1).reduce((a, w) => w.word.length > a.length ? w.word : a, "");

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
          <button className="salitaan-icon-btn" title="Gabay sa Mga Pattern" onClick={() => setShowGlossary(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
          </button>

          <button
            className="salitaan-icon-btn"
            title={screen === "playing" ? "Paano Maglaro (babaguhin ang laro)" : "Paano Maglaro"}
            onClick={() => setShowForfeit(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </button>

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
          INTRO MODAL — tabbed tutorial
         ══════════════════════════════════════ */}
      {screen === "intro" && (
        <SModal dismissable={false}>
          <h2>PAANO MAGLARO</h2>

          <div className="salitaan-modal-answer" style={{ marginBottom: 14 }}>
            <div className="salitaan-modal-answer-label">UNANG SALITA NGAYON</div>
            <div className="salitaan-modal-answer-word" style={{ letterSpacing: 6 }}>
              {starterWord.toUpperCase()}
            </div>
          </div>

          {/* Tab buttons */}
          <div className="salitaan-help-tabs">
            {["rules","bonus","patterns"].map(t => (
              <button
                key={t}
                className={`salitaan-help-tab${helpTab === t ? " salitaan-help-tab--active" : ""}`}
                onClick={() => setHelpTab(t)}
              >
                {t === "rules" ? "Patakaran" : t === "bonus" ? "Oras & Puntos" : "Mga Pattern"}
              </button>
            ))}
          </div>

          {/* ── RULES ── */}
          {/* ── RULES ── */}
{helpTab === "rules" && (
  <div className="salitaan-help-body">
    <div className="salitaan-help-card-list">
      <div className="salitaan-help-card">
        <span className="salitaan-help-card-icon">⛓️</span>
        <div className="salitaan-help-card-text">
          Gumawa ng <strong className="force-white">kadena ng mga salitang Filipino</strong>. Ang bawat salita ay dapat magsimula sa <strong className="force-white">huling pantig</strong> ng nakaraang salita.
        </div>
      </div>

      <div className="salitaan-help-card">
        <span className="salitaan-help-card-icon">⏱️</span>
        <div className="salitaan-help-card-text">
          Magsisimula ka sa <strong className="force-white">30 segundo</strong>. Maximum ay <strong className="force-white">60 segundo</strong>. Ang bawat tamang salita ay nagdagdag ng oras.
        </div>
      </div>

      <div className="salitaan-help-card">
        <span className="salitaan-help-card-icon">📖</span>
        <div className="salitaan-help-card-text">
          Lahat ng salita ay dapat nasa <strong className="force-white">diksyunaryo</strong>. Hindi maaaring <strong className="force-white">ulitin</strong> ang mga salita.
        </div>
      </div>

      <div className="salitaan-help-card">
        <span className="salitaan-help-card-icon">🔤</span>
        <div className="salitaan-help-card-text">
          Ang unang salita ay dapat magsimula sa <strong className="force-white">CV, CVC, o NGV</strong> — hindi pure patinig.
        </div>
      </div>
    </div>

    <div className="salitaan-help-ng-box">
      <strong className="force-white">Espesyal: Ang titik NG</strong>
      <br />
      Ang NG ay <strong className="force-white">isang titik</strong> sa Filipino.
      Maaaring magsimula ng salita sa NG — hal. <em>ngiti, ngayon</em>.
      Kung nagtatapos ang salita sa NG (hal. <em>walang</em>),
      posibleng simula:
      <strong className="force-white"> lang… ang… ng… a…</strong>
    </div>

    <div className="salitaan-intro-warning" style={{ marginBottom: 0 }}>
      ⚠️ Kapag nagsimula na ang laro, ang pagbubukas ng{" "}
      <strong className="force-white">Paano Maglaro</strong> ay
      magpapatapos ng iyong kasalukuyang laro.
    </div>
  </div>
)}

          {/* ── BONUS ── */}
          {/* ── BONUS ── */}
{helpTab === "bonus" && (
  <div className="salitaan-help-body">
    <div className="salitaan-help-bonus-cards">
      {[
        { bg:"#1e3a1e", border:"#538d4e", dot:"#538d4e", label:"Pinakamahaba", desc:"Pinakamahabang pantig ang katugma", time:"+4–7s", timeColor:"#6aff75" },
        { bg:"#2e2400", border:"#b59f3b", dot:"#b59f3b", label:"OK", desc:"Mas maikling tugma ang katugma", time:"+1–3s", timeColor:"#f0d060" },
        { bg:"#1e1e2e", border:"#6060aa", dot:"#6060aa", label:"Maikli", desc:"Pinakamaikli / parusa", time:"+0s", timeColor:"#818384" },
      ].map(item => (
        <div
          key={item.label}
          className="salitaan-help-bonus-row"
          style={{ background: item.bg, border: `1px solid ${item.border}` }}
        >
          <div
            className="salitaan-help-bonus-dot"
            style={{ background: item.dot }}
          />

          <div style={{ flex: 1 }}>
            <div
              className="salitaan-help-bonus-label"
              style={{ color: item.timeColor }}
            >
              <strong className="force-white">{item.label}</strong>
            </div>

            <div className="salitaan-help-bonus-desc">
              {item.desc}
            </div>
          </div>

          <div
            className="salitaan-help-bonus-time"
            style={{ color: item.timeColor }}
          >
            {item.time}
          </div>
        </div>
      ))}
    </div>

    <div className="salitaan-help-chain-demo">
      <div className="salitaan-help-chain-label">
        <strong className="force-white">HALIMBAWA</strong>
      </div>

      <div className="salitaan-help-chain-row">
        {[
          { word:"buhay", bg:"#3a3a3c", bonus:null },
          { word:"hayop", bg:"#538d4e", bonus:"+6s" },
          { word:"opo", bg:"#b59f3b", bonus:"+1s" },
          { word:"poo", bg:"#538d4e", bonus:"+4s" },
        ].map((c, i) => (
          <span
            key={i}
            style={{
              display:"inline-flex",
              alignItems:"baseline",
              gap:2,
              padding:"4px 10px",
              borderRadius:99,
              fontSize:12,
              fontWeight:700,
              background:c.bg,
              color:"#fff",
              border:`1px solid ${c.bg}`
            }}
          >
            {c.word}
            {c.bonus && <sup style={{ fontSize:9, opacity:0.85 }}>{c.bonus}</sup>}
          </span>
        ))}
      </div>
    </div>

    <div className="salitaan-help-formula">
      <strong className="force-white">Formula:</strong><br/>
      Antas 0 → 4 + ⌊haba÷3⌋ segundo<br/>
      Antas 1 → 1 + ⌊haba÷4⌋ segundo<br/>
      Antas 2 → +0 segundo<br/><br/>

      <strong className="force-white">Puntos:</strong>
      Antas 0 = haba × 2 &nbsp;·&nbsp; Antas 1–2 = haba × 1
    </div>
  </div>
)}

          {/* ── PATTERNS ── */}
          {/* ── PATTERNS ── */}
{helpTab === "patterns" && (
  <div className="salitaan-help-body">
    {[
      { tag:"CV", example:"bata, saya", rows:[
        { starter:"CV (ta…)", bonus:"+4–7s", color:"#538d4e", note:"Buong katinig+patinig" },
        { starter:"V (a…)", bonus:"+0s", color:"#818384", note:"Parusa — tanggap lang" },
      ]},
      { tag:"CVC", example:"buhok, takot", rows:[
        { starter:"CVC (hok…)", bonus:"+4–7s", color:"#538d4e", note:"Pinakamahaba" },
        { starter:"VC (ok…)", bonus:"+1–3s", color:"#b59f3b", note:"OK" },
        { starter:"V (o…)", bonus:"+0s", color:"#818384", note:"Pinakamaikli" },
      ]},
      { tag:"CVNG", example:"walang, silong", rows:[
        { starter:"CVNG (lang…)", bonus:"+4–7s", color:"#538d4e", note:"Pinakamahaba" },
        { starter:"VNG (ang…)", bonus:"+4–7s", color:"#538d4e", note:"Mahaba rin" },
        { starter:"NG (ng…)", bonus:"+0s", color:"#818384", note:"OK lang" },
        { starter:"V (a…)", bonus:"+0s", color:"#818384", note:"Pinakamaikli" },
      ]},
      { tag:"VC", example:"aral, utos", rows:[
        { starter:"VC (al…)", bonus:"+4–7s", color:"#538d4e", note:"Pinakamahaba" },
        { starter:"V (a…)", bonus:"+1–3s", color:"#b59f3b", note:"OK" },
      ]},
    ].map(pat => (
      <div key={pat.tag} className="salitaan-help-pattern-block">
        <div className="salitaan-help-pattern-head">
          <span className="salitaan-help-pattern-tag">
            <strong className="force-white">{pat.tag}</strong>
          </span>

          <span className="salitaan-help-pattern-example">
            hal. <strong className="force-white">{pat.example}</strong>
          </span>
        </div>

        {pat.rows.map((row, i) => (
          <div key={i} className="salitaan-help-pattern-row">
            <span className="salitaan-help-pattern-starter">
              <strong className="force-white">{row.starter}</strong>
            </span>

            <span className="salitaan-help-pattern-bonus">
              <strong className="force-white">{row.bonus}</strong>
            </span>

            <span className="salitaan-help-pattern-note">
              {row.note}
            </span>
          </div>
        ))}
      </div>
    ))}
  </div>
)}

          <button className="salitaan-modal-btn" onClick={startGame} style={{marginTop:8}}>
            Handa na ako — Maglaro! ▶
          </button>
        </SModal>
      )}

      {/* ══════════════════════════════════════
          FORFEIT MODAL
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
          GLOSSARY MODAL
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
            {[
              { tag:"CV",   example:"bata, saya",    rows:[
                {starter:"CV (ta…)",     bonus:"+4–7s", color:"#538d4e", note:"Buong katinig+patinig"},
                {starter:"V (a…)",       bonus:"+0s",   color:"#818384", note:"Parusa — tanggap lang"},
              ]},
              { tag:"CVC",  example:"buhok, takot",  rows:[
                {starter:"CVC (hok…)",   bonus:"+4–7s", color:"#538d4e", note:"Pinakamahaba"},
                {starter:"VC (ok…)",     bonus:"+1–3s", color:"#b59f3b", note:"OK"},
                {starter:"V (o…)",       bonus:"+0s",   color:"#818384", note:"Pinakamaikli"},
              ]},
              { tag:"CVNG", example:"walang, silong", rows:[
                {starter:"CVNG (lang…)", bonus:"+4–7s", color:"#538d4e", note:"Pinakamahaba"},
                {starter:"VNG (ang…)",   bonus:"+4–7s", color:"#538d4e", note:"Mahaba rin"},
                {starter:"NG (ng…)",     bonus:"+0s",   color:"#818384", note:"OK lang"},
                {starter:"V (a…)",       bonus:"+0s",   color:"#818384", note:"Pinakamaikli"},
              ]},
              { tag:"VC",   example:"aral, utos",    rows:[
                {starter:"VC (al…)",     bonus:"+4–7s", color:"#538d4e", note:"Pinakamahaba"},
                {starter:"V (a…)",       bonus:"+1–3s", color:"#b59f3b", note:"OK"},
              ]},
            ].map((pat, pi) => (
              <div key={pi} className="salitaan-glossary-block">
                <div className="salitaan-glossary-heading">
                  <span className="salitaan-glossary-tag">{pat.tag}</span>
                  <span className="salitaan-glossary-example">hal. <em>{pat.example}</em></span>
                </div>
                <div className="salitaan-glossary-rows">
                  {pat.rows.map((row, ri) => (
                    <div key={ri} className="salitaan-glossary-row">
                      <span className="salitaan-glossary-starter" style={{color:row.color}}>{row.starter}</span>
                      <span className="salitaan-glossary-bonus"   style={{color:row.color}}>{row.bonus}</span>
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
          STATS MODAL
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