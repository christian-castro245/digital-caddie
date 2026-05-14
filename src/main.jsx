import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Home, MapPin, BookOpen, User, Brain, Mic, MicOff,
  ChevronLeft, ChevronRight, Plus, Minus, Flag, Share2,
  Pencil, Map, LayoutGrid, ArrowLeft, Play, CheckCircle,
  Target, Waves, RotateCcw, Info
} from "lucide-react";
import { course, defaultPlayer } from "./data/courseData";
import "./styles.css";

// ── Leaflet icon fix for Vite ─────────────────────────
delete L.Icon.Default.prototype._getIconUrl;

// ── Storage ───────────────────────────────────────────
const KEY = "kuhlendahl-v3";

const blankState = () => ({
  player: defaultPlayer,
  currentRound: null,
  roundHistory: [],
  strategies: {},
  activeHole: 1,
  activeMode: "plan",
  screen: "home",
});

function loadState() {
  try {
    const r = localStorage.getItem(KEY);
    return r ? { ...blankState(), ...JSON.parse(r) } : blankState();
  } catch { return blankState(); }
}
function saveState(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
function resetAll() { localStorage.removeItem(KEY); return blankState(); }

// ── Score helpers ─────────────────────────────────────
const QUICK = [
  { offset: -2, text: "Eagle",  bg: "#1a5c3a", fg: "#fff" },
  { offset: -1, text: "Birdie", bg: "#2d9e66", fg: "#fff" },
  { offset:  0, text: "Par",    bg: "#e8f4de", fg: "#1a5c3a" },
  { offset:  1, text: "Bogey",  bg: "#fff3cd", fg: "#856404" },
  { offset:  2, text: "Doppel", bg: "#ffe0e0", fg: "#9d342c" },
];
function diff(score, par) {
  const d = score - par;
  return d === 0 ? "Par" : d > 0 ? `+${d}` : `${d}`;
}

// ── KI-Strategie (client-side, bag-based) ─────────────
function aiStrategy(hole, bag) {
  if (!bag?.length) return [];
  const { men: dist, par, layups = [], svgHazards = [], risk = "" } = hole;
  const sorted = [...bag].sort((a, b) => b.carry - a.carry);
  const hasWater = svgHazards.some(h => h.type === "water") || risk.toLowerCase().includes("wasser");
  const dangerDist = hasWater && layups.length > 0 ? layups[0].men : null;

  const pick = (target, under) => {
    if (under != null) {
      const safe = sorted.filter(c => c.carry < under - 5);
      return safe[0] || sorted[sorted.length - 1];
    }
    return sorted.reduce((b, c) => Math.abs(c.carry - target) < Math.abs(b.carry - target) ? c : b);
  };

  const steps = [];
  if (par === 3) {
    const c = pick(dist);
    const d = c.carry - dist;
    steps.push({ n: 1, label: "Abschlag", club: c.club, carry: c.carry,
      note: Math.abs(d) <= 15 ? "Ideal" : d > 0 ? "etwas abschwächen" : "voll durchschwingen" });
  } else if (par === 4) {
    const tee = dangerDist ? pick(dist, dangerDist) : sorted[0];
    const rem = dist - tee.carry;
    steps.push({ n: 1, label: "Abschlag", club: tee.club, carry: tee.carry,
      note: dangerDist ? `sicher vor ${dangerDist}m Risiko` : "volle Länge" });
    if (rem > 15) {
      const app = pick(rem);
      steps.push({ n: 2, label: "Approach", club: app.club, carry: app.carry,
        note: `~${Math.round(rem)}m – Grünmitte` });
    }
  } else {
    const tee = dangerDist ? pick(dist, dangerDist) : sorted[0];
    const rem1 = dist - tee.carry;
    steps.push({ n: 1, label: "Abschlag", club: tee.club, carry: tee.carry,
      note: dangerDist ? `Risiko bei ${dangerDist}m` : "maximale Länge" });
    if (rem1 > 130) {
      const lay = pick(Math.min(rem1 - 80, sorted[0].carry));
      const rem2 = Math.max(0, rem1 - lay.carry);
      steps.push({ n: 2, label: "Layup", club: lay.club, carry: lay.carry,
        note: `~${Math.round(rem2)}m zum Grün` });
      if (rem2 > 10) {
        const app = pick(rem2);
        steps.push({ n: 3, label: "Approach", club: app.club, carry: app.carry, note: "Grünmitte" });
      }
    } else if (rem1 > 10) {
      const app = pick(rem1);
      steps.push({ n: 2, label: "Approach", club: app.club, carry: app.carry,
        note: `~${Math.round(rem1)}m` });
    }
  }
  return steps;
}

// ── Export / Share ────────────────────────────────────
function buildText(round) {
  let t = `⛳ ${course.clubName}\n📅 ${round.date}\n\n`;
  let tot = 0, totPar = 0, totPutts = 0, played = 0;
  course.holes.forEach(h => {
    const hd = round.holes?.[h.n];
    if (!hd?.score) return;
    played++;
    const d = hd.score - h.par;
    t += `B${h.n}: ${hd.score} (${diff(hd.score, h.par)})`;
    if (hd.putts) t += ` · ${hd.putts}P`;
    if (hd.note?.trim()) t += `\n  "${hd.note.trim()}"`;
    t += "\n";
    tot += hd.score; totPar += h.par; totPutts += (hd.putts || 0);
  });
  if (played > 0) {
    t += `\n📊 ${played}/18 Bahnen · ${tot} Schläge (${diff(tot, totPar)})`;
    if (totPutts) t += ` · ${totPutts} Putts`;
  }
  return t;
}
async function doExport(round) {
  const text = buildText(round);
  try {
    if (navigator.share) { await navigator.share({ title: "Meine Runde", text }); return; }
    if (navigator.clipboard) { await navigator.clipboard.writeText(text); alert("In Zwischenablage kopiert!"); return; }
  } catch {}
  alert(text);
}

// ── Voice dictation (Web Speech API) ─────────────────
function useDictation(onResult) {
  const [active, setActive] = useState(false);
  const ref = useRef(null);
  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Diktieren: Chrome oder Safari nutzen."); return; }
    const r = new SR();
    r.lang = "de-DE"; r.continuous = false; r.interimResults = false;
    r.onstart = () => setActive(true);
    r.onend = () => setActive(false);
    r.onerror = () => setActive(false);
    r.onresult = e => onResult(e.results[0][0].transcript);
    r.start(); ref.current = r;
  }, [onResult]);
  const stop = useCallback(() => ref.current?.stop(), []);
  return { active, start, stop };
}

// ── Leaflet Map ───────────────────────────────────────
function HoleMap({ hole, full = false }) {
  const el = useRef(null);
  const map = useRef(null);
  useEffect(() => {
    if (!el.current) return;
    if (map.current) { map.current.remove(); map.current = null; }
    const center = full ? [course.gps.lat, course.gps.lng] : [hole.gps.lat, hole.gps.lng];
    const zoom   = full ? course.gps.zoom : hole.gps.zoom;
    const m = L.map(el.current, { center, zoom, scrollWheelZoom: false });
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "© Esri", maxZoom: 20 }
    ).addTo(m);
    if (!full) {
      L.circleMarker([hole.gps.lat - 0.0006, hole.gps.lng],
        { radius: 7, fillColor: "#eab308", fillOpacity: 1, color: "#fff", weight: 2 })
        .addTo(m).bindTooltip("Abschlag");
      L.circleMarker([hole.gps.lat, hole.gps.lng],
        { radius: 10, fillColor: "#1a5c3a", fillOpacity: 1, color: "#fff", weight: 2 })
        .addTo(m).bindTooltip("Grün");
    } else {
      course.holes.forEach(h => {
        L.circleMarker([h.gps.lat, h.gps.lng], {
          radius: h.n === hole.n ? 12 : 8,
          fillColor: h.n === hole.n ? "#1a5c3a" : "#fff",
          fillOpacity: 0.95, color: "#1a5c3a",
          weight: h.n === hole.n ? 3 : 2,
        }).addTo(m).bindTooltip(`Bahn ${h.n} · Par ${h.par}`);
      });
    }
    map.current = m;
    return () => { map.current?.remove(); map.current = null; };
  }, [hole.n, full]);
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div ref={el} style={{ height: "100%", width: "100%" }} />
      <div className="map-note">GPS = Näherungswerte · vor Ort kalibrieren</div>
    </div>
  );
}

// ── Per-hole SVG ──────────────────────────────────────
function HoleSvg({ hole, wide = false }) {
  const { svgPath, svgTee = [100,455], svgGreen = [100,42], svgHazards = [], par, men, layups = [], green } = hole;
  const fw  = par === 3 ? 36 : 50;
  const grx = Math.min(22, Math.max(9,  (green?.breite || 24) / 2));
  const gry = Math.max(3,  Math.min(15, (green?.tiefe  || 24) / 3));
  const [tx, ty] = svgTee;
  const [gx, gy] = svgGreen;

  if (wide) {
    const wp = "M20 96 C100 45, 210 112, 395 40";
    const hasWater = svgHazards.some(h => h.type === "water");
    return (
      <svg viewBox="0 0 420 150" style={{ width: "100%", height: "100%" }}>
        <rect width="420" height="150" fill="#c8e6c2" />
        <path d={wp} fill="none" stroke="#52a333" strokeWidth={54} strokeLinecap="round" opacity={0.3} />
        <path d={wp} fill="none" stroke="#68bb46" strokeWidth={46} strokeLinecap="round" />
        <path d={wp} fill="none" stroke="#efffdc" strokeWidth={1.5} strokeDasharray="7 7" opacity={0.6} />
        {hasWater && <ellipse cx={78} cy={88} rx={62} ry={25} fill="#48b0d5" opacity={0.85} />}
        <ellipse cx={395} cy={40} rx={Math.min(26, grx*2)} ry={Math.max(11, gry*1.6)} fill="#4ade80" stroke="#166534" strokeWidth={1.5} />
        <circle cx={401} cy={34} r={3} fill="#dc2626" />
        <line x1={401} y1={34} x2={401} y2={20} stroke="#222" strokeWidth={1.5} />
        <polygon points="401,20 411,25 401,30" fill="#dc2626" />
        <circle cx={20} cy={96} r={7} fill="#eab308" stroke="#fff" strokeWidth={2} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 500" style={{ width: "100%", height: "100%" }}>
      <rect width="200" height="500" fill="#c8e6c2" />
      {Array.from({ length: 36 }).map((_, i) => (
        <circle key={i} cx={(i*53)%200} cy={(i*71)%500} r={5} fill="#1d6b3b" opacity={0.18} />
      ))}
      {svgPath && <path d={svgPath} fill="none" stroke="#52a333" strokeWidth={fw+10} strokeLinecap="round" opacity={0.28} />}
      {svgPath && <path d={svgPath} fill="none" stroke="#68bb46" strokeWidth={fw} strokeLinecap="round" />}
      {svgPath && <path d={svgPath} fill="none" stroke="#efffdc" strokeWidth={1.5} strokeDasharray="8 8" opacity={0.6} />}
      {svgHazards.map((h, i) => {
        if (h.type === "water")  return <ellipse key={i} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry} fill="#48b0d5" opacity={0.9} stroke="#2d8fba" strokeWidth={0.5} />;
        if (h.type === "bunker") return <ellipse key={i} cx={h.cx} cy={h.cy} rx={h.rx||16} ry={h.ry||8} fill="#e2c97b" opacity={0.95} stroke="#c4a84e" strokeWidth={0.5} />;
        if (h.type === "trees")  return <ellipse key={i} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry} fill="#1a5e30" opacity={0.5} />;
        if (h.type === "ob-line") {
          const x = h.side === "left" ? 18 : 182;
          return <g key={i}><line x1={x} y1={90} x2={x} y2={ty-20} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" opacity={0.8} /><text x={h.side==="left"?x+5:x-5} y={200} fontSize={9} fontWeight="bold" fill="#ef4444" textAnchor={h.side==="left"?"start":"end"}>AUS</text></g>;
        }
        return null;
      })}
      <ellipse cx={gx} cy={gy} rx={grx} ry={gry} fill="#4ade80" stroke="#166534" strokeWidth={1.5} />
      <circle cx={gx+3} cy={gy-2} r={2.5} fill="#dc2626" />
      <line x1={gx+3} y1={gy-2} x2={gx+3} y2={gy-17} stroke="#222" strokeWidth={1.5} />
      <polygon points={`${gx+3},${gy-17} ${gx+13},${gy-12} ${gx+3},${gy-7}`} fill="#dc2626" />
      <rect x={tx-8} y={ty-4} width={16} height={8} rx={2} fill="#eab308" stroke="#fff" strokeWidth={1} opacity={0.95} />
      {layups.slice(0,4).map((lp, i) => {
        const ratio = lp.men / men;
        const yPos  = ty - ratio * (ty - gy);
        return (
          <g key={i}>
            <line x1={105} y1={yPos} x2={164} y2={yPos} stroke="rgba(255,255,255,.5)" strokeWidth={1} strokeDasharray="3 2" />
            <rect x={165} y={yPos-8} width={28} height={15} rx={3} fill="rgba(26,92,58,.85)" />
            <text x={179} y={yPos+4} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#fff">{lp.men}m</text>
          </g>
        );
      })}
      <text x={8} y={490} fontSize={11} fontWeight="bold" fill="#073d2b" opacity={0.55}>Bahn {hole.n}</text>
    </svg>
  );
}

// ── App ───────────────────────────────────────────────
function App() {
  const [state, setState] = useState(loadState);
  const set = patch => setState(s => ({ ...s, ...patch }));
  useEffect(() => saveState(state), [state]);

  const hole = course.holes.find(h => h.n === state.activeHole) || course.holes[0];

  const goTo     = screen => set({ screen });
  const openHole = n => set({ activeHole: n, screen: "hole" });
  const prevHole = () => { const i = course.holes.findIndex(h => h.n === state.activeHole); if (i > 0) set({ activeHole: course.holes[i-1].n }); };
  const nextHole = () => { const i = course.holes.findIndex(h => h.n === state.activeHole); if (i < course.holes.length-1) set({ activeHole: course.holes[i+1].n }); };

  function ensureRound(mode = "live") {
    if (state.currentRound) return state.currentRound;
    const r = { id: crypto.randomUUID(), date: new Date().toISOString().slice(0,10), mode, holes: {} };
    set({ currentRound: r });
    return r;
  }
  function patchHoleData(n, patch) {
    const round  = state.currentRound || ensureRound("live");
    const cur    = round.holes?.[n] || { score: course.holes.find(h=>h.n===n)?.par||4, putts:0, note:"" };
    const updated = { ...round, holes: { ...round.holes, [n]: { ...cur, ...patch } } };
    setState(s => ({ ...s, currentRound: updated }));
  }
  function finishRound() {
    if (!state.currentRound) return;
    setState(s => ({ ...s, roundHistory: [s.currentRound, ...s.roundHistory].slice(0,20), currentRound: null }));
  }
  function patchPlayer(patch) { setState(s => ({ ...s, player: { ...s.player, ...patch } })); }
  function updateBag(id, patch) { setState(s => ({ ...s, player: { ...s.player, bag: s.player.bag.map(b => b.id===id ? {...b,...patch} : b) } })); }
  function addClub() { setState(s => ({ ...s, player: { ...s.player, bag: [...s.player.bag, {id:crypto.randomUUID(),club:"Neuer Schläger",carry:100,total:110}] } })); }
  function removeClub(id) { setState(s => ({ ...s, player: { ...s.player, bag: s.player.bag.filter(b=>b.id!==id) } })); }

  const holeData = state.currentRound?.holes?.[state.activeHole] || { score: hole.par, putts: 0, note: "" };
  const activeTab = ["home","rounds","profile"].includes(state.screen) ? state.screen : "course";

  return (
    <div className="app">
      {state.screen === "home" && (
        <HomeView
          player={state.player}
          currentRound={state.currentRound}
          roundHistory={state.roundHistory}
          onStart={() => { ensureRound("live"); goTo("course"); }}
          onContinue={() => goTo("course")}
          onNav={goTo}
        />
      )}
      {state.screen === "course" && (
        <CourseView
          selectedHole={state.activeHole}
          currentRound={state.currentRound}
          onHole={openHole}
          onBack={() => goTo("home")}
          onFinish={finishRound}
        />
      )}
      {state.screen === "hole" && (
        <HoleView
          hole={hole}
          mode={state.activeMode}
          holeData={holeData}
          strategy={state.strategies[hole.n] || ""}
          player={state.player}
          currentRound={state.currentRound}
          onModeChange={m => set({ activeMode: m })}
          onPatchHole={p => patchHoleData(hole.n, p)}
          onStrategy={t => setState(s => ({ ...s, strategies: { ...s.strategies, [hole.n]: t } }))}
          onPrev={prevHole} onNext={nextHole}
          canPrev={course.holes[0].n !== hole.n}
          canNext={course.holes[course.holes.length-1].n !== hole.n}
          onBack={() => goTo("course")}
          ensureRound={ensureRound}
        />
      )}
      {state.screen === "rounds" && (
        <RoundsView
          roundHistory={state.roundHistory}
          currentRound={state.currentRound}
          onFinish={finishRound}
        />
      )}
      {state.screen === "profile" && (
        <ProfileView
          player={state.player}
          onPatch={patchPlayer}
          onUpdateBag={updateBag}
          onAddClub={addClub}
          onRemoveClub={removeClub}
          onReset={() => { if (confirm("Alle Daten zurücksetzen?")) setState(resetAll()); }}
        />
      )}
      <BottomNav active={activeTab} onNav={s => { if (s==="course" && state.screen==="hole") goTo("course"); else goTo(s); }} />
    </div>
  );
}

// ── BottomNav ─────────────────────────────────────────
const TABS = [
  { id: "home",    label: "Home",    Icon: Home },
  { id: "course",  label: "Plätze",  Icon: MapPin },
  { id: "rounds",  label: "Runden",  Icon: BookOpen },
  { id: "profile", label: "Profil",  Icon: User },
];
function BottomNav({ active, onNav }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ id, label, Icon }) => (
        <button key={id} className={`nav-item ${active===id?"active":""}`} onClick={() => onNav(id)}>
          <Icon size={22} /><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── HomeView ──────────────────────────────────────────
function HomeView({ player, currentRound, roundHistory, onStart, onContinue, onNav }) {
  const h = new Date().getHours();
  const greeting = h < 12 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
  return (
    <div className="view-scroll">
      <div className="home-header">
        <div className="home-greeting-sub">{greeting}</div>
        <div className="home-greeting-name">{player.name}</div>
        <div className="home-greeting-detail">HCP {player.handicap} · Driver {player.bag[0]?.carry||"?"}m · {player.bag.length} Schläger</div>
      </div>

      {currentRound
        ? <button className="hero-btn" onClick={onContinue}><div><div className="hero-label">Aktive Runde</div><div className="hero-title">Runde fortsetzen →</div></div><Play size={24} color="rgba(255,255,255,.7)" /></button>
        : <button className="hero-btn" onClick={onStart}><div><div className="hero-label">Schnellstart</div><div className="hero-title">Neue Runde starten →</div></div><Flag size={24} color="rgba(255,255,255,.7)" /></button>
      }

      <div className="section-label">Funktionen</div>
      <div className="tile-grid">
        <div className="tile" onClick={() => onNav("course")}>
          <MapPin size={26} color="#1a5c3a" />
          <div><div className="tile-name">Platz wählen</div><div className="tile-sub">Gut Kuhlendahl</div></div>
        </div>
        <div className="tile" onClick={() => onNav("course")}>
          <Brain size={26} color="#7c3aed" />
          <div><div className="tile-name">KI-Strategie</div><div className="tile-sub">Dein Bag · pro Bahn</div></div>
        </div>
        <div className="tile" onClick={() => onNav("course")}>
          <Mic size={26} color="#1d6fa5" />
          <div><div className="tile-name">Live-Notizen</div><div className="tile-sub">Diktieren auf dem Platz</div></div>
        </div>
        <div className="tile" onClick={() => onNav("rounds")}>
          <BookOpen size={26} color="#b7791f" />
          <div><div className="tile-name">Meine Runden</div><div className="tile-sub">{roundHistory.length} gespeichert</div></div>
        </div>
      </div>

      {roundHistory.length > 0 && <>
        <div className="section-label">Zuletzt gespielt</div>
        {roundHistory.slice(0,2).map(r => {
          const holes = Object.values(r.holes||{});
          const tot   = holes.reduce((s,h) => s+(h.score||0), 0);
          const par   = holes.reduce((s,h) => { const ho=course.holes.find(c=>c.n===h.n); return s+(ho?.par||0); },0);
          return (
            <div key={r.id} className="recent-card">
              <div className="recent-icon"><Flag size={18} color="#1a5c3a" /></div>
              <div>
                <div className="recent-title">Gut Kuhlendahl · {r.date}</div>
                <div className="recent-sub">{holes.length} Bahnen · {tot>0 ? `${tot} (${diff(tot,par)})` : "kein Score"}</div>
              </div>
            </div>
          );
        })}
      </>}
    </div>
  );
}

// ── CourseView ────────────────────────────────────────
function CourseView({ selectedHole, currentRound, onHole, onBack, onFinish }) {
  const played = Object.keys(currentRound?.holes||{}).map(Number);
  return (
    <div className="view-scroll">
      <div className="course-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={17} /> Home</button>
        <div className="course-title">{course.clubName}</div>
        <div className="course-sub">18 Bahnen · Par {course.parTotal} · Slope {course.slope.men}</div>
        <div className="chip-row">
          <span className="chip">{course.menTotal}m Gelb</span>
          <span className="chip">CR {course.cr.men}</span>
          {currentRound && <span className="chip chip-green">{played.length}/18 gespielt</span>}
        </div>
      </div>

      <div style={{ padding: "12px 16px 4px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: ".05em" }}>Bahn wählen</div>
      </div>
      <div className="hole-grid">
        {course.holes.map(h => {
          const hd   = currentRound?.holes?.[h.n];
          const d    = hd?.score ? hd.score - h.par : null;
          return (
            <button key={h.n} className={`hole-card ${h.n===selectedHole?"active":""}`} onClick={() => onHole(h.n)}>
              <div className="hole-card-n">{h.n}</div>
              <div className="hole-card-par">Par {h.par}</div>
              <div className="hole-card-m">{h.men}m</div>
              {d !== null && <div className="hole-card-score" style={{ color: d===0?"#888":d<0?"#1a5c3a":d===1?"#b7791f":"#c0392b" }}>{diff(hd.score,h.par)}</div>}
            </button>
          );
        })}
      </div>

      {currentRound && (
        <div style={{ padding: "8px 16px 16px" }}>
          <button className="finish-btn" onClick={onFinish}><CheckCircle size={18} /> Runde beenden & speichern</button>
        </div>
      )}
    </div>
  );
}

// ── HoleView ──────────────────────────────────────────
function HoleView({ hole, mode, holeData, strategy, player, currentRound, onModeChange, onPatchHole, onStrategy, onPrev, onNext, canPrev, canNext, onBack, ensureRound }) {
  const [vizTab, setVizTab] = useState("map");
  const ai = aiStrategy(hole, player.bag);

  const score = holeData.score ?? hole.par;
  const putts = holeData.putts ?? 0;
  const note  = holeData.note  ?? "";

  const appendNote = useCallback(text => {
    onPatchHole({ note: (note ? note + " " : "") + text });
    if (!currentRound) ensureRound("live");
  }, [note]);
  const { active: dictOn, start: dictStart, stop: dictStop } = useDictation(appendNote);

  const setScore = v => { onPatchHole({ score: v }); if (!currentRound) ensureRound("live"); };
  const setPutts = v => { onPatchHole({ putts: v }); if (!currentRound) ensureRound("live"); };

  return (
    <div className="view-scroll">
      {/* Header */}
      <div className="hole-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={17} /> Alle Bahnen</button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div className="hole-title">Bahn {hole.n}</div>
            <div className="hole-sub">Par {hole.par} · HCP {hole.hcp} · {hole.men}m Gelb</div>
          </div>
          {hole.green && (
            <div className="green-chip">
              {hole.green.breite}×{hole.green.tiefe}m{hole.green.tiefe<=10?" ⚠️":""}
            </div>
          )}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="mode-bar">
        <button className={`mode-btn ${mode==="plan"?"on":""}`} onClick={() => onModeChange("plan")}>
          <Target size={15} /> Planung
        </button>
        <button className={`mode-btn ${mode==="live"?"on":""}`} onClick={() => { onModeChange("live"); if (!currentRound) ensureRound("live"); }}>
          <Play size={15} /> Auf dem Platz
        </button>
      </div>

      {/* ── PLAN MODE ── */}
      {mode === "plan" && <>
        <div className="viz-tabs">
          <button className={`viz-tab ${vizTab==="map"?"on":""}`} onClick={() => setVizTab("map")}><Map size={14} /> Satellit</button>
          <button className={`viz-tab ${vizTab==="svg"?"on":""}`} onClick={() => setVizTab("svg")}><LayoutGrid size={14} /> Bahnplan</button>
        </div>

        {vizTab === "map"
          ? <div className="map-wrap"><HoleMap hole={hole} /></div>
          : <div className="svg-wrap"><HoleSvg hole={hole} /></div>
        }

        {/* KI strategy */}
        <div className="ai-card">
          <div className="ai-head"><Brain size={14} /> KI-Strategie · dein Bag</div>
          {ai.length === 0
            ? <div className="ai-note">Schläger im Profil hinterlegen</div>
            : ai.map(s => (
              <div key={s.n} className="ai-row">
                <div className="ai-step">{s.n}</div>
                <div className="ai-body">
                  <span className="ai-label-text">{s.label}: </span>
                  <span className="ai-club">{s.club} ({s.carry}m)</span>
                  {s.note && <span className="ai-note"> · {s.note}</span>}
                </div>
              </div>
            ))
          }
        </div>

        {/* Risk */}
        <div className="risk-card"><Waves size={14} /><span>{hole.risk}</span></div>

        {/* Layup table */}
        {hole.layups?.length > 0 && (
          <div className="card" style={{ marginTop: 10 }}>
            <div className="card-label"><Info size={13} /> Birdiebook Layup-Zonen</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#1a5c3a", color: "#fff" }}>
                  <th style={{ padding: "7px 10px", borderRadius: "8px 0 0 0", textAlign:"left" }}>Zone</th>
                  <th style={{ padding: "7px 10px", textAlign:"center" }}>Herren</th>
                  <th style={{ padding: "7px 10px", borderRadius: "0 8px 0 0", textAlign:"center" }}>Damen</th>
                </tr>
              </thead>
              <tbody>
                {hole.layups.map(lp => (
                  <tr key={lp.label} style={{ borderBottom: ".5px solid #eee" }}>
                    <td style={{ padding: "7px 10px", fontWeight: 700, color: "#1a5c3a" }}>{lp.label}</td>
                    <td style={{ padding: "7px 10px", textAlign:"center" }}>{lp.men} m</td>
                    <td style={{ padding: "7px 10px", textAlign:"center", color:"#888" }}>{lp.women} m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Strategy note */}
        <div className="card" style={{ marginTop: 10 }}>
          <div className="card-label"><Pencil size={13} /> Meine Strategie-Notiz</div>
          <textarea className="note-ta" rows={3} value={strategy}
            onChange={e => onStrategy(e.target.value)}
            placeholder="Was ist dein Plan für diese Bahn?" />
        </div>
      </>}

      {/* ── LIVE MODE ── */}
      {mode === "live" && <>
        {/* Score */}
        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-label">Score</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {QUICK.map(q => (
              <button key={q.offset} className="score-quick-btn"
                style={{ background: q.bg, color: q.fg, outline: score===hole.par+q.offset ? "2.5px solid #111" : "none" }}
                onClick={() => setScore(hole.par + q.offset)}>
                {q.text}
              </button>
            ))}
          </div>
          <div className="score-ctrl">
            <button className="sc-btn minus" onClick={() => setScore(Math.max(1, score-1))}><Minus size={20} /></button>
            <div className="score-display">
              <div className="score-num">{score}</div>
              <div className="score-diff" style={{ color: score-hole.par===0?"#888":score<hole.par?"#1a5c3a":"#b7791f" }}>
                {diff(score, hole.par)}
              </div>
            </div>
            <button className="sc-btn plus" onClick={() => setScore(score+1)}><Plus size={20} /></button>
          </div>
        </div>

        {/* Putts */}
        <div className="card" style={{ marginTop: 8 }}>
          <div className="card-label">Putts</div>
          <div className="score-ctrl" style={{ gap: 28 }}>
            <button className="sc-btn minus" onClick={() => setPutts(Math.max(0, putts-1))}><Minus size={18} /></button>
            <div className="score-display"><div className="score-num" style={{ fontSize: 36 }}>{putts}</div></div>
            <button className="sc-btn plus" onClick={() => setPutts(putts+1)}><Plus size={18} /></button>
          </div>
        </div>

        {/* Mini KI hint */}
        {ai.length > 0 && (
          <div className="ai-mini">
            <Brain size={14} />
            <div style={{ fontSize: 13 }}>
              <span style={{ color: "rgba(255,255,255,.55)" }}>Jetzt: </span>
              <span className="ai-club">{ai[0].club} ({ai[0].carry}m)</span>
              {ai[0].note && <span style={{ color: "rgba(255,255,255,.5)" }}> · {ai[0].note}</span>}
            </div>
          </div>
        )}

        {/* Note + voice */}
        <div className="card" style={{ marginTop: 8 }}>
          <div className="card-label">Notiz</div>
          <textarea className="note-ta" rows={3} value={note}
            onChange={e => { onPatchHole({ note: e.target.value }); if (!currentRound) ensureRound("live"); }}
            placeholder="Was lernst du? Tippen oder diktieren…" />
          <div className="voice-row">
            <button className={`voice-btn ${dictOn?"recording":""}`} onClick={dictOn ? dictStop : dictStart}>
              {dictOn ? <><MicOff size={18} /> Aufnahme stopp</> : <><Mic size={18} /> Diktieren (Deutsch)</>}
            </button>
          </div>
        </div>

        {/* Plan from home (read-only) */}
        {strategy?.trim() && (
          <div className="card" style={{ marginTop: 8, background: "#f5f9f2" }}>
            <div className="card-label"><Info size={13} /> Dein Plan von zuhause</div>
            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.55, fontStyle: "italic" }}>{strategy}</div>
          </div>
        )}
      </>}

      {/* Hole navigation */}
      <div className="hole-nav">
        <button className={`hole-nav-btn ${!canPrev?"disabled":""}`} onClick={onPrev} disabled={!canPrev}>
          <ChevronLeft size={19} /> Bahn {hole.n-1}
        </button>
        <span className="hole-nav-pos">{hole.n} / 18</span>
        <button className={`hole-nav-btn ${!canNext?"disabled":""}`} onClick={onNext} disabled={!canNext}>
          Bahn {hole.n+1} <ChevronRight size={19} />
        </button>
      </div>
    </div>
  );
}

// ── RoundsView ────────────────────────────────────────
function RoundsView({ roundHistory, currentRound, onFinish }) {
  return (
    <div className="view-scroll">
      <div className="page-header">
        <div className="page-title">Meine Runden</div>
        <div className="page-sub">{roundHistory.length} gespeicherte Runden</div>
      </div>

      {currentRound && (
        <div className="card" style={{ margin: "0 16px 12px" }}>
          <div className="card-label">Aktive Runde</div>
          <div style={{ fontSize: 14, marginBottom: 10 }}>
            {currentRound.date} · {Object.keys(currentRound.holes||{}).length} Bahnen gespielt
          </div>
          <div className="btn-row">
            <button className="btn-primary" onClick={() => doExport(currentRound)}><Share2 size={15} /> Teilen</button>
            <button className="btn-secondary" onClick={onFinish}><CheckCircle size={15} /> Abschließen</button>
          </div>
        </div>
      )}

      {roundHistory.length===0 && !currentRound && (
        <div className="empty-state"><BookOpen size={36} color="#ccc" /><p>Noch keine Runden gespeichert</p></div>
      )}

      {roundHistory.map(r => {
        const holes  = Object.values(r.holes||{});
        const tot    = holes.reduce((s,h)=>s+(h.score||0),0);
        const par    = holes.reduce((s,h)=>{ const ho=course.holes.find(c=>c.n===h.n); return s+(ho?.par||0); },0);
        const putts  = holes.reduce((s,h)=>s+(h.putts||0),0);
        return (
          <div key={r.id} className="card" style={{ margin: "0 16px 10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600 }}>Gut Kuhlendahl</div>
                <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{r.date} · {holes.length} Bahnen</div>
              </div>
              {tot>0 && <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:22, fontWeight:600 }}>{tot}</div>
                <div style={{ fontSize:13, color: tot-par>=0?"#b7791f":"#1a5c3a", fontWeight:600 }}>{diff(tot,par)}</div>
              </div>}
            </div>
            {putts>0 && <div style={{ fontSize:12, color:"#888", marginTop:6 }}>{putts} Putts gesamt</div>}
            <button className="btn-secondary" style={{ marginTop:10, width:"100%" }} onClick={() => doExport(r)}>
              <Share2 size={14} /> Exportieren / Teilen
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── ProfileView ───────────────────────────────────────
function ProfileView({ player, onPatch, onUpdateBag, onAddClub, onRemoveClub, onReset }) {
  return (
    <div className="view-scroll">
      <div className="page-header"><div className="page-title">Profil & Bag</div></div>

      <div className="card" style={{ margin: "0 16px 12px" }}>
        <div className="card-label">Spielerdaten</div>
        <div className="form-grid">
          <label className="form-label">Name<input className="form-input" value={player.name} onChange={e=>onPatch({name:e.target.value})} /></label>
          <label className="form-label">Handicap<input className="form-input" value={player.handicap} onChange={e=>onPatch({handicap:e.target.value})} /></label>
          <label className="form-label">Körpergröße<input className="form-input" value={player.height} onChange={e=>onPatch({height:e.target.value})} /></label>
          <label className="form-label">Geschlecht
            <select className="form-input" value={player.gender} onChange={e=>onPatch({gender:e.target.value})}>
              <option>Herren</option><option>Damen</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card" style={{ margin: "0 16px 12px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div className="card-label" style={{ margin:0 }}>What's in my bag</div>
          <button className="btn-secondary btn-sm" onClick={onAddClub}><Plus size={14} /> Schläger</button>
        </div>
        <div className="bag-legend"><span>Schläger</span><span>Carry</span><span>Total</span><span /></div>
        {player.bag.map(b => (
          <div key={b.id} className="bag-row">
            <input className="form-input" value={b.club} onChange={e=>onUpdateBag(b.id,{club:e.target.value})} />
            <input className="form-input" type="number" value={b.carry} onChange={e=>onUpdateBag(b.id,{carry:Number(e.target.value)})} />
            <input className="form-input" type="number" value={b.total} onChange={e=>onUpdateBag(b.id,{total:Number(e.target.value)})} />
            <button className="del-btn" onClick={()=>onRemoveClub(b.id)}><Minus size={15} /></button>
          </div>
        ))}
      </div>

      <div style={{ padding:"0 16px 32px" }}>
        <button className="btn-ghost" onClick={onReset}><RotateCcw size={15} /> Alle Daten zurücksetzen</button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
