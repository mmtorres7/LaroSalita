import { useEffect, useState } from "react";
import Saltong from "./pages/Saltong.jsx";
import Ugnayan from "./pages/Ugnayan.jsx";
import TitikPukyutan from "./pages/TItikPukyutan.jsx";
import Hulawikain from "./pages/Hulawikain.jsx";
import Hibla from "./pages/Hibla.jsx";
import Salitaan from "./pages/Salitaan.jsx";
import "./App.css";

// ─────────────────────────────────────────
//  ROUTER
// ─────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [theme, setTheme] = useState(() => localStorage.getItem("larosalita-theme") || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("larosalita-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(current => current === "light" ? "dark" : "light");

  const renderPage = () => {
    if (page === "saltong")        return <Saltong       onBack={() => setPage("home")} />;
    if (page === "ugnayan")        return <Ugnayan       onBack={() => setPage("home")} />;
    if (page === "titik-pukyutan") return <TitikPukyutan onBack={() => setPage("home")} />;
    if (page === "hulawikain")     return <Hulawikain    onBack={() => setPage("home")} />;
    if (page === "hibla")          return <Hibla         onBack={() => setPage("home")} />;
    if (page === "salitaan")       return <Salitaan      onBack={() => setPage("home")} />;
    return <Home onNavigate={setPage} />;
  };

  return (
    <>
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title={theme === "light" ? "Lumipat sa dark mode" : "Lumipat sa light mode"}
        aria-label={theme === "light" ? "Lumipat sa dark mode" : "Lumipat sa light mode"}
      >
        {theme === "light" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 7.3A9 9 0 1 1 12 3Z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        )}
      </button>
      {renderPage()}
    </>
  );
}

// ─────────────────────────────────────────
//  HOME PAGE
// ─────────────────────────────────────────
function Home({ onNavigate }) {
  const games = [
    {
      id: "saltong",
      title: "Saltong",
      desc: "Hulaan ang 5-letrang salita sa 6 na pagkakataon.",
      color: "#e8f5e9",
      accent: "#2e7d32",
      icon: <WordleIcon />,
      ready: true,
    },
    {
      id: "ugnayan",
      title: "Ugnayan",
      desc: "Pangkatin ang mga salitang may iisang tema.",
      color: "#f3e5f5",
      accent: "#7b1fa2",
      icon: <ConnectionsIcon />,
      ready: true,
    },
    {
      id: "hulawikain",
      title: "Hulawikain",
      desc: "Hulaan ang sawikain gamit ang Wordle-style na palatandaan.",
      color: "#e3f2fd",
      accent: "#1565c0",
      icon: <PhraseIcon />,
      ready: true,
    },
    {
      id: "hibla",
      title: "Hibla",
      desc: "Hanapin ang mga nakatagong salita at alamin ang tema.",
      color: "#fff8e1",
      accent: "#f9a825",
      icon: <StrandsIcon />,
      ready: true,
    },
    {
      id: "titik-pukyutan",
      title: "Titik-Pukyutan",
      desc: "Ilang salita ang makakagawa mo mula sa 7 titik?",
      color: "#fff3e0",
      accent: "#e65100",
      icon: <BeeIcon />,
      ready: true,
    },
    {
      id: "salitaan",
      title: "Salitaan",
      desc: "Gumawa ng pinakamahabang kadena ng salita bago maubos ang oras!",
      color: "#e8eaf6",
      accent: "#283593",
      icon: <SalitaanIcon />,
      ready: true,
    },
  ];

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="home-header-inner">
          <div>
            <div className="home-site-name">LaroSalita</div>
            <div className="home-site-tagline">Pang-araw-araw na laro sa Tagalog</div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="home-main">

        <div className="featured-banner">
          <div className="featured-left">
            <div className="featured-label">PABORITO NG MGA GUMAWA</div>
            <div className="featured-title">Saltong</div>
            <div className="featured-desc">
              Ang aming bersiyon ng sikat na word game — ngayon ay nasa Filipino na!
              Subukan mo ngayon at makita kung kaya mo sa 6 na hula.
            </div>
            <button className="play-button" onClick={() => onNavigate("saltong")}>
              Maglaro →
            </button>
          </div>
          <div className="featured-right">
            <div className="featured-grid">
              {["M","A","H","A","L"].map((l, i) => (
                <div
                  key={i}
                  className="featured-tile"
                  style={{
                    background: i === 0 ? "#538d4e" : i === 2 ? "#b59f3b" : "#3a3a3c",
                    animationDelay: `${i * 120}ms`,
                  }}
                >
                  {l}
                </div>
              ))}
              {["M","O","?","",""].map((l, i) => (
                <div
                  key={i}
                  className="featured-tile"
                  style={{
                    background: "#1a1a1b",
                    border: "2px solid #3a3a3c",
                    animationDelay: `${(i + 5) * 120}ms`,
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: "24px" }} />
        <h2 className="home-section-title">Aming Mga Koleksyon ng Laro</h2>

        <div className="games-grid">
          {games.map((g, i) => (
            <GameCard
              key={g.id}
              game={g}
              delay={i * 80}
              onClick={() => g.ready ? onNavigate(g.id) : null}
            />
          ))}
        </div>

      </main>

      <footer className="home-footer">
        <p>Inspirado ng NYT Games · Ginawa para sa proyekto sa Wika 1</p>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────
//  GAME CARD
// ─────────────────────────────────────────
function GameCard({ game, delay, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="game-card"
      style={{
        cursor: game.ready ? "pointer" : "default",
        transform: hovered && game.ready ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered && game.ready
          ? "0 8px 24px rgba(0,0,0,0.12)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        animation: `cardIn 0.4s ease ${delay}ms both`,
      }}
    >
      <div className="game-card-icon" style={{ background: game.color }}>
        {game.icon}
      </div>
      <div className="game-card-body">
        <div className="game-card-title">{game.title}</div>
        <div className="game-card-desc" style={{ color: game.ready ? game.accent : "#aaa" }}>
          {game.desc}
        </div>
        {!game.ready && (
          <div className="game-card-coming-soon">Malapit na</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  GAME CARD ICONS (SVG)
// ─────────────────────────────────────────
function WordleIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      {[
        [8,8,"#538d4e"],[28,8,"#538d4e"],[48,8,"#3a3a3c"],
        [8,28,"#b59f3b"],[28,28,"#538d4e"],[48,28,"#3a3a3c"],
        [8,48,"#3a3a3c"],[28,48,"#3a3a3c"],[48,48,"#b59f3b"],
      ].map(([x,y,c],i) => (
        <rect key={i} x={x} y={y} width="16" height="16" rx="2" fill={c}/>
      ))}
    </svg>
  );
}

function ConnectionsIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      {[
        [8,8,"#f9c74f"],[28,8,"#f9c74f"],[48,8,"#90be6d"],
        [8,28,"#f9c74f"],[28,28,"#90be6d"],[48,28,"#90be6d"],
        [8,48,"#a8dadc"],[28,48,"#a8dadc"],[48,48,"#c77dff"],
      ].map(([x,y,c],i) => (
        <rect key={i} x={x} y={y} width="16" height="16" rx="3" fill={c}/>
      ))}
    </svg>
  );
}

function PhraseIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      {[
        [8,10,16,"#538d4e"],[28,10,16,"#b59f3b"],[48,10,16,"#3a3a3c"],
        [12,30,16,"#3a3a3c"],[32,30,16,"#538d4e"],
        [8,50,16,"#b59f3b"],[28,50,16,"#3a3a3c"],[48,50,16,"#538d4e"],
      ].map(([x,y,s,c],i) => (
        <rect key={i} x={x} y={y} width={s} height={s} rx="2" fill={c}/>
      ))}
      <rect x="52" y="30" width="8" height="16" rx="2" fill="#90a4ae"/>
    </svg>
  );
}

function StrandsIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <path d="M16 36 Q24 20 36 28 Q48 36 56 20" stroke="#f9a825" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M16 44 Q28 32 40 40 Q52 48 60 36" stroke="#43a047" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M12 52 Q24 44 36 52 Q48 60 60 48" stroke="#1e88e5" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <circle cx="16" cy="36" r="4" fill="#f9a825"/>
      <circle cx="36" cy="28" r="4" fill="#f9a825"/>
      <circle cx="56" cy="20" r="4" fill="#f9a825"/>
    </svg>
  );
}

function BeeIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <ellipse cx="36" cy="42" rx="14" ry="18" fill="#f9a825"/>
      <rect x="22" y="34" width="28" height="4" rx="2" fill="#222"/>
      <rect x="22" y="42" width="28" height="4" rx="2" fill="#222"/>
      <ellipse cx="36" cy="24" rx="9" ry="9" fill="#f9a825"/>
      <ellipse cx="20" cy="28" rx="8" ry="5" fill="rgba(150,220,255,0.7)" transform="rotate(-30 20 28)"/>
      <ellipse cx="52" cy="28" rx="8" ry="5" fill="rgba(150,220,255,0.7)" transform="rotate(30 52 28)"/>
      <circle cx="32" cy="22" r="2" fill="#222"/>
      <circle cx="40" cy="22" r="2" fill="#222"/>
    </svg>
  );
}

function SalitaanIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      {/* Chain of word-chips */}
      <rect x="4"  y="28" width="20" height="16" rx="8" fill="#283593"/>
      <rect x="28" y="28" width="20" height="16" rx="8" fill="#3949ab"/>
      <rect x="52" y="28" width="16" height="16" rx="8" fill="#5c6bc0"/>
      {/* Connecting dots */}
      <circle cx="25" cy="36" r="2" fill="#283593"/>
      <circle cx="49" cy="36" r="2" fill="#3949ab"/>
      {/* Arrow hinting the chain continues */}
      <path d="M58 22 L64 28 L58 34" stroke="#9fa8da" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Letters S inside chips */}
      <text x="14" y="40" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900" fontFamily="Arial Black, Arial">S</text>
      <text x="38" y="40" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900" fontFamily="Arial Black, Arial">A</text>
      <text x="60" y="40" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900" fontFamily="Arial Black, Arial">L</text>
    </svg>
  );
}
