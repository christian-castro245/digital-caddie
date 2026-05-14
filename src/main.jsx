import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag, MapPin, NotebookPen, User, Save, Download, Upload,
  RotateCcw, Plus, Trash2, Target, Trees, Waves, ShieldCheck,
  Pencil, Map, Layers, Info, ChevronRight
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { course } from "./data/courseData";
import { exportState, loadState, resetState, saveState } from "./storage";
import "./styles.css";

// ─── Leaflet icon fix for Vite ───────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: "", iconUrl: "", shadowUrl: "" });

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState("course");

  useEffect(() => saveState(state), [state]);

  const selectedHole = useMemo(
    () => course.holes.find((h) => h.n === state.selectedHole) || course.holes[0],
    [state.selectedHole]
  );

  function patchPlayer(patch) {
    setState((s) => ({ ...s, player: { ...s.player, ...patch } }));
  }
  function addNote(note) {
    setState((s) => ({ ...s, notes: [{ id: crypto.randomUUID(), ...note }, ...s.notes] }));
  }
  function deleteNote(id) {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  }
  function updateStrategy(holeNumber, patch) {
    setState((s) => ({
      ...s,
      strategies: { ...s.strategies, [holeNumber]: { ...(s.strategies[holeNumber] || {}), ...patch } }
    }));
  }
  async function importJson(file) {
    const text = await file.text();
    setState(JSON.parse(text));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Flag size={22} /></div>
          <div><strong>Proberunde</strong><span>Gut Kuhlendahl</span></div>
        </div>
        <nav className="nav">
          <button className={view === "course" ? "active" : ""} onClick={() => setView("course")}><MapPin size={16} /> Platz</button>
          <button className={view === "strategy" ? "active" : ""} onClick={() => setView("strategy")}><Target size={16} /> Strategie</button>
          <button className={view === "live" ? "active" : ""} onClick={() => setView("live")}><NotebookPen size={16} /> Live-Notizen</button>
          <button className={view === "profile" ? "active" : ""} onClick={() => setView("profile")}><User size={16} /> Profil & Bag</button>
        </nav>
        <div className="side-card">
          <span className="eyebrow">Aktuelle Bahn</span>
          <strong>Bahn {selectedHole.n}</strong>
          <p>Par {selectedHole.par} · HCP {selectedHole.hcp} · {selectedHole.men} m Gelb</p>
          {selectedHole.green && (
            <p style={{ fontSize: 12, color: "#b8d5c7", marginTop: 4 }}>
              Grün {selectedHole.green.breite}m × {selectedHole.green.tiefe}m
            </p>
          )}
        </div>
        <div className="side-actions">
          <button onClick={() => exportState(state)}><Download size={16} /> Export JSON</button>
          <label className="file-button">
            <Upload size={16} /> Import JSON
            <input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          </label>
          <button onClick={() => setState(resetState())}><RotateCcw size={16} /> Reset lokal</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">Digitale Proberunde · Satellitenkarte aktiv</span>
            <h1>{course.clubName}</h1>
          </div>
          <div className="pill"><Map size={13} /> Leaflet · ESRI Satellite</div>
        </header>

        <HolePicker
          selected={state.selectedHole}
          onSelect={(n) => setState((s) => ({ ...s, selectedHole: n }))}
        />

        {view === "course" && <CourseView selectedHole={selectedHole} setView={setView} />}
        {view === "strategy" && (
          <StrategyView
            hole={selectedHole}
            strategy={state.strategies[selectedHole.n]}
            updateStrategy={updateStrategy}
          />
        )}
        {view === "live" && (
          <LiveView
            hole={selectedHole}
            notes={state.notes.filter((n) => n.hole === selectedHole.n)}
            addNote={addNote}
            deleteNote={deleteNote}
            player={state.player}
          />
        )}
        {view === "profile" && (
          <ProfileView player={state.player} patchPlayer={patchPlayer} setState={setState} />
        )}
      </main>
    </div>
  );
}

// ─── HolePicker ───────────────────────────────────────────────────────────────
function HolePicker({ selected, onSelect }) {
  return (
    <div className="hole-picker">
      {course.holes.map((h) => (
        <button
          key={h.n}
          className={selected === h.n ? "selected" : ""}
          onClick={() => onSelect(h.n)}
          title={`Bahn ${h.n} · Par ${h.par} · ${h.men}m`}
        >
          {h.n}
        </button>
      ))}
    </div>
  );
}

// ─── Leaflet Map Component ────────────────────────────────────────────────────
function HoleMap({ hole, full = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const center = full
      ? [course.gps.lat, course.gps.lng]
      : [hole.gps.lat, hole.gps.lng];
    const zoom = full ? course.gps.zoom : hole.gps.zoom;

    const map = L.map(containerRef.current, {
      center, zoom,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    // ESRI World Imagery – kostenlos, kein API-Key
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "© Esri World Imagery", maxZoom: 20 }
    ).addTo(map);

    // Labels overlay (Strassennamen etc.)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { attribution: "", maxZoom: 20, opacity: 0.5 }
    ).addTo(map);

    if (full) {
      // Alle Bahnen als Marker auf Übersichtskarte
      course.holes.forEach((h) => {
        const isActive = h.n === hole.n;
        L.circleMarker([h.gps.lat, h.gps.lng], {
          radius: isActive ? 13 : 9,
          fillColor: isActive ? "#073d2b" : "#ffffff",
          fillOpacity: 0.95,
          color: "#073d2b",
          weight: isActive ? 3 : 2,
        })
          .addTo(map)
          .bindTooltip(`Bahn ${h.n} · Par ${h.par} · ${h.men}m`, { permanent: false })
          .bindPopup(`<b>Bahn ${h.n}</b> · Par ${h.par} · HCP ${h.hcp}<br/>${h.men}m Gelb / ${h.women}m Rot`);
      });
    } else {
      // Grün
      L.circleMarker([hole.gps.lat, hole.gps.lng], {
        radius: 11, fillColor: "#16a34a", fillOpacity: 0.95, color: "#fff", weight: 2.5,
      }).addTo(map).bindTooltip("Grün (Näherungswert)", { permanent: true, direction: "top", offset: [0, -12] });

      // Tee (approximate offset)
      const teeLat = hole.gps.lat - 0.0006;
      L.circleMarker([teeLat, hole.gps.lng], {
        radius: 8, fillColor: "#eab308", fillOpacity: 0.95, color: "#fff", weight: 2,
      }).addTo(map).bindTooltip("Abschlag (Näherungswert)", { permanent: false });

      // Layup zones (approximate)
      hole.layups?.slice(0, 3).forEach((lp, i) => {
        const ratio = 1 - (lp.men / hole.men);
        const layupLat = teeLat + ratio * 0.0012;
        L.circleMarker([layupLat, hole.gps.lng + (i % 2 === 0 ? 0.0003 : -0.0003)], {
          radius: 5, fillColor: "#f97316", fillOpacity: 0.8, color: "#fff", weight: 1.5,
        }).addTo(map).bindTooltip(`${lp.label}: ${lp.men}m / ${lp.women}m`);
      });
    }

    mapRef.current = map;
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [hole.n, full]);

  return (
    <div style={{ position: "relative", height: "100%", minHeight: 400 }}>
      <div ref={containerRef} style={{ height: "100%", minHeight: 400 }} />
      <div style={{
        position: "absolute", bottom: 28, left: 8, zIndex: 999,
        background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 10,
        padding: "3px 7px", borderRadius: 5, pointerEvents: "none",
      }}>
        GPS = Näherungswerte · vor Ort kalibrieren
      </div>
    </div>
  );
}

// ─── Per-Hole SVG Illustration ────────────────────────────────────────────────
function HoleSvgReal({ hole, wide = false }) {
  const vb = wide ? "0 0 420 150" : "0 0 200 500";
  const { svgPath, svgTee, svgGreen, svgHazards, par, men, layups } = hole;

  const fairwayWidth = par === 3 ? (wide ? 36 : 36) : (wide ? 48 : 50);
  const roughWidth   = fairwayWidth + 8;

  // Green size from data
  const grx = Math.min(22, Math.max(10, (hole.green?.breite || 24) / 2));
  const gry = Math.max(4,  Math.min(16, (hole.green?.tiefe || 24) / 3));

  if (wide) {
    // Horizontal strip for LiveView
    const wPath = "M22 100 C100 48, 200 112, 398 40";
    const hasWater = svgHazards?.some(h => h.type === "water");
    return (
      <svg viewBox={vb} className="hole-svg">
        <rect width="420" height="150" fill="#c8e6c2" />
        {/* background dots */}
        {Array.from({ length: 35 }).map((_, i) => (
          <circle key={i} cx={(i * 53) % 420} cy={(i * 37) % 150} r={4} fill="#2d6a4f" opacity={0.22} />
        ))}
        <path d={wPath} fill="none" stroke="#52a333" strokeWidth={roughWidth} strokeLinecap="round" opacity={0.35} />
        <path d={wPath} fill="none" stroke="#68bb46" strokeWidth={fairwayWidth} strokeLinecap="round" />
        <path d={wPath} fill="none" stroke="#efffdc" strokeWidth={1.5} strokeDasharray="7 7" opacity={0.6} />
        {hasWater && <ellipse cx="82" cy="94" rx="65" ry="26" fill="#48b0d5" opacity={0.85} />}
        {/* Green */}
        <ellipse cx="398" cy="40" rx={Math.min(28, grx * 2.2)} ry={Math.max(12, gry * 1.8)}
          fill="#4ade80" stroke="#166534" strokeWidth={1.5} />
        <circle cx="404" cy="34" r={3} fill="#dc2626" />
        <line x1="404" y1="34" x2="404" y2="20" stroke="#222" strokeWidth={1.5} />
        <polygon points="404,20 414,25 404,30" fill="#dc2626" />
        {/* Tee */}
        <circle cx="22" cy="100" r={7} fill="#eab308" stroke="#fff" strokeWidth={2} />
      </svg>
    );
  }

  // Portrait illustration
  const [tx, ty] = svgTee || [100, 455];
  const [gx, gy] = svgGreen || [100, 42];

  return (
    <svg viewBox={vb} className="hole-svg">
      <rect width="200" height="500" fill="#c8e6c2" />
      {/* Background texture */}
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={(i * 53) % 200} cy={(i * 71) % 500}
          r={5} fill="#1d6b3b" opacity={0.22} />
      ))}

      {/* Rough edge */}
      {svgPath && (
        <path d={svgPath} fill="none" stroke="#52a333"
          strokeWidth={roughWidth + 8} strokeLinecap="round" opacity={0.3} />
      )}
      {/* Fairway */}
      {svgPath && (
        <path d={svgPath} fill="none" stroke="#68bb46"
          strokeWidth={fairwayWidth} strokeLinecap="round" />
      )}
      {/* Centre dashes */}
      {svgPath && (
        <path d={svgPath} fill="none" stroke="#efffdc"
          strokeWidth={1.5} strokeDasharray="8 8" opacity={0.65} />
      )}

      {/* Hazards */}
      {svgHazards?.map((h, i) => {
        if (h.type === "water") return (
          <ellipse key={i} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry}
            fill="#48b0d5" opacity={0.9} stroke="#2d8fba" strokeWidth={0.5} />
        );
        if (h.type === "bunker") return (
          <ellipse key={i} cx={h.cx} cy={h.cy} rx={h.rx || 16} ry={h.ry || 8}
            fill="#e2c97b" opacity={0.95} stroke="#c4a84e" strokeWidth={0.5} />
        );
        if (h.type === "trees") return (
          <ellipse key={i} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry}
            fill="#1a5e30" opacity={0.55} />
        );
        if (h.type === "ob-line") {
          const x = h.side === "left" ? 18 : 182;
          return (
            <g key={i}>
              <line x1={x} y1={88} x2={x} y2={ty - 20}
                stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" opacity={0.8} />
              <text x={h.side === "left" ? x + 5 : x - 5} y={200}
                fontSize={9} fontWeight="bold" fill="#ef4444"
                textAnchor={h.side === "left" ? "start" : "end"}>AUS</text>
            </g>
          );
        }
        return null;
      })}

      {/* Green */}
      <ellipse cx={gx} cy={gy} rx={grx} ry={gry}
        fill="#4ade80" stroke="#166534" strokeWidth={1.5} />
      {/* Flag */}
      <circle cx={gx + 3} cy={gy - 2} r={2.5} fill="#dc2626" />
      <line x1={gx + 3} y1={gy - 2} x2={gx + 3} y2={gy - 17}
        stroke="#222" strokeWidth={1.5} />
      <polygon points={`${gx+3},${gy-17} ${gx+13},${gy-12} ${gx+3},${gy-7}`}
        fill="#dc2626" />

      {/* Tee */}
      <rect x={tx - 8} y={ty - 4} width={16} height={8} rx={2}
        fill="#eab308" stroke="#fff" strokeWidth={1} opacity={0.95} />

      {/* Layup lines */}
      {layups?.slice(0, 5).map((lp, i) => {
        const ratio = lp.men / men;
        const yPos = ty - ratio * (ty - gy);
        return (
          <g key={i}>
            <line x1={105} y1={yPos} x2={166} y2={yPos}
              stroke="rgba(255,255,255,0.55)" strokeWidth={1} strokeDasharray="3 2" />
            <rect x={167} y={yPos - 8} width={29} height={15} rx={3}
              fill="rgba(7,61,43,.82)" />
            <text x={181} y={yPos + 4} textAnchor="middle"
              fontSize={9} fontWeight="bold" fill="#fff">
              {lp.men}m
            </text>
          </g>
        );
      })}

      {/* Bahn info */}
      <text x={8} y={490} fontSize={11} fontWeight="bold" fill="#073d2b" opacity={0.65}>
        Bahn {hole.n}
      </text>
      <text x={8} y={479} fontSize={9} fill="#073d2b" opacity={0.45}>
        Par {hole.par} · HCP {hole.hcp}
      </text>
    </svg>
  );
}

// ─── CourseView ───────────────────────────────────────────────────────────────
function CourseView({ selectedHole, setView }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid two">
      <div className="panel">
        <div className="panel-head">
          <div><span className="eyebrow">Satellitenansicht · ESRI</span><h2>{course.courseName}</h2></div>
          <span className="pill">Par {course.parTotal}</span>
        </div>
        <div className="map-container">
          <HoleMap hole={selectedHole} full={true} />
        </div>
        <div className="stats">
          <Stat label="Bahnen" value="18" />
          <Stat label="Herren" value={`${course.menTotal} m`} />
          <Stat label="Damen" value={`${course.womenTotal} m`} />
          <Stat label="Slope" value={`${course.slope.men}`} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div><span className="eyebrow">Scorecard</span><h2>Alle Bahnen</h2></div>
        </div>
        <div className="hole-list">
          {course.holes.map((h) => (
            <button
              key={h.n}
              className={h.n === selectedHole.n ? "hole-row active" : "hole-row"}
              onClick={() => setView("strategy")}
            >
              <b>{h.n}</b>
              <span>Par {h.par} · HCP {h.hcp}</span>
              <em>{h.men} m</em>
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ─── StrategyView ─────────────────────────────────────────────────────────────
function StrategyView({ hole, strategy, updateStrategy }) {
  const [leftTab, setLeftTab] = useState("map"); // "map" | "illustration"

  const s = strategy || {
    teeShot: hole.par === 3
      ? "Schlaeger auf Gruenmitte waehlen."
      : "Sichere Landezone vom Tee auswaehlen.",
    layup: hole.par === 5
      ? "Layup vor Risiko planen. 3-Schlag-Loch."
      : "Zweiter Schlag konservativ planen.",
    approach: "Gruenmitte bevorzugen. Miss-Seite bewusst waehlen."
  };

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid two">
      {/* Left panel */}
      <div className="panel strategy-visual">
        <div className="panel-head">
          <div><span className="eyebrow">Virtuelle Proberunde</span><h2>Bahn {hole.n}</h2></div>
          <span className="pill">Par {hole.par} · HCP {hole.hcp}</span>
        </div>

        {/* Tab bar */}
        <div className="tab-bar">
          <button className={`tab-btn ${leftTab === "map" ? "active" : ""}`} onClick={() => setLeftTab("map")}>
            <Map size={14} style={{ marginRight: 6 }} />Satellitenkarte
          </button>
          <button className={`tab-btn ${leftTab === "illustration" ? "active" : ""}`} onClick={() => setLeftTab("illustration")}>
            <Layers size={14} style={{ marginRight: 6 }} />Bahnplan
          </button>
        </div>

        <AnimatePresence mode="wait">
          {leftTab === "map" ? (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="map-container" style={{ height: 400 }}>
              <HoleMap hole={hole} full={false} />
            </motion.div>
          ) : (
            <motion.div key="svg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="hole-illustration">
              <HoleSvgReal hole={hole} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="risk-tags" style={{ marginTop: 14 }}>
          <span><Waves size={15} /> {hole.risk}</span>
          <span><Trees size={15} /> {hole.tip}</span>
          {hole.green && (
            <span><ShieldCheck size={15} /> Grün: {hole.green.breite}m breit × {hole.green.tiefe}m tief</span>
          )}
        </div>

        {/* Hole description */}
        {hole.description && (
          <div className="info-box" style={{ marginTop: 12 }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>{hole.description}</p>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="panel">
        <div className="panel-head">
          <div><span className="eyebrow">Plan speichern</span><h2>Meine Strategie</h2></div>
        </div>

        <StrategyInput
          label="1. Abschlag"
          value={s.teeShot}
          onChange={(v) => updateStrategy(hole.n, { teeShot: v })}
        />
        <StrategyInput
          label="2. Layup / zweiter Schlag"
          value={s.layup}
          onChange={(v) => updateStrategy(hole.n, { layup: v })}
        />
        <StrategyInput
          label="3. Approach"
          value={s.approach}
          onChange={(v) => updateStrategy(hole.n, { approach: v })}
        />

        <div className="info-box" style={{ marginBottom: 16 }}>
          <Pencil size={16} />
          <p style={{ fontSize: 12 }}>Alles wird automatisch lokal gespeichert.</p>
        </div>

        {/* Layup table */}
        {hole.layups && hole.layups.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0d553b", marginBottom: 8 }}>
              Layup-Zonen aus dem Birdiebook
            </h3>
            <table className="layup-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Herren (Gelb)</th>
                  <th>Damen (Rot)</th>
                  <th>Ihr Schläger</th>
                </tr>
              </thead>
              <tbody>
                {hole.layups.map((lp) => (
                  <tr key={lp.label}>
                    <td><strong>{lp.label}</strong></td>
                    <td>{lp.men} m</td>
                    <td>{lp.women} m</td>
                    <td style={{ color: "#6f8178", fontSize: 11 }}>–</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Green dimensions */}
        {hole.green && (
          <div className="green-card" style={{ marginTop: 16 }}>
            <div className="stat" style={{ background: "#e8f4de" }}>
              <strong style={{ color: "#073d2b" }}>{hole.green.breite} m</strong>
              <span>Grün Breite</span>
            </div>
            <div className="stat" style={{ background: "#e8f4de" }}>
              <strong style={{ color: hole.green.tiefe <= 10 ? "#b7791f" : "#073d2b" }}>
                {hole.green.tiefe} m {hole.green.tiefe <= 10 ? "⚠️" : ""}
              </strong>
              <span>Grün Tiefe</span>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

// ─── LiveView ─────────────────────────────────────────────────────────────────
function LiveView({ hole, notes, addNote, deleteNote, player }) {
  const [form, setForm] = useState({
    club: player.bag[0]?.club || "",
    distance: "",
    lie: "Fairway",
    text: "",
    mode: "Live-Runde"
  });

  function submit(e) {
    e.preventDefault();
    if (!form.text.trim()) return;
    addNote({ ...form, hole: hole.n, date: new Date().toISOString().slice(0, 10) });
    setForm((f) => ({ ...f, distance: "", text: "" }));
  }

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid two">
      <div className="panel">
        <div className="panel-head">
          <div><span className="eyebrow">Live-Runde</span><h2>Bahn {hole.n}</h2></div>
          <span className="pill">{hole.men} m Gelb</span>
        </div>
        <div className="hole-strip">
          <HoleSvgReal hole={hole} wide />
        </div>
        <form onSubmit={submit} className="note-form">
          <div className="form-grid">
            <label>
              Schläger
              <select value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })}>
                {player.bag.map((b) => <option key={b.id}>{b.club}</option>)}
              </select>
            </label>
            <label>
              Länge
              <input value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} placeholder="z.B. 185" />
            </label>
            <label>
              Balllage
              <select value={form.lie} onChange={(e) => setForm({ ...form, lie: e.target.value })}>
                <option>Fairway</option>
                <option>Rough</option>
                <option>Bunker</option>
                <option>Penalty Area</option>
                <option>Grün</option>
              </select>
            </label>
            <label>
              Modus
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                <option>Live-Runde</option>
                <option>Proberunde</option>
                <option>Nach der Runde</option>
              </select>
            </label>
          </div>
          <label>
            Notiz
            <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="Was hast du gelernt? Welche Strategie beim nächsten Mal?" />
          </label>
          <button className="primary"><Save size={16} /> Notiz speichern</button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div><span className="eyebrow">Historie</span><h2>Notizen zu Bahn {hole.n}</h2></div>
        </div>
        <div className="notes">
          {notes.length === 0 && <p className="empty">Noch keine Notiz für diese Bahn.</p>}
          {notes.map((note) => (
            <article key={note.id} className="note">
              <div>
                <strong>{note.date}</strong>
                <span>{note.mode} · {note.club} · {note.distance ? `${note.distance} m` : "ohne Länge"} · {note.lie}</span>
              </div>
              <p>{note.text}</p>
              <button onClick={() => deleteNote(note.id)}><Trash2 size={15} /></button>
            </article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ─── ProfileView ──────────────────────────────────────────────────────────────
function ProfileView({ player, patchPlayer, setState }) {
  function updateBag(id, patch) {
    setState((s) => ({ ...s, player: { ...s.player, bag: s.player.bag.map((b) => b.id === id ? { ...b, ...patch } : b) } }));
  }
  function addClub() {
    setState((s) => ({ ...s, player: { ...s.player, bag: [...s.player.bag, { id: crypto.randomUUID(), club: "Neuer Schläger", carry: 100, total: 110 }] } }));
  }
  function removeClub(id) {
    setState((s) => ({ ...s, player: { ...s.player, bag: s.player.bag.filter((b) => b.id !== id) } }));
  }

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid two">
      <div className="panel">
        <div className="panel-head"><div><span className="eyebrow">Spielerprofil</span><h2>Basisdaten</h2></div></div>
        <div className="profile-form">
          <label>Name<input value={player.name} onChange={(e) => patchPlayer({ name: e.target.value })} /></label>
          <label>Körpergröße<input value={player.height} onChange={(e) => patchPlayer({ height: e.target.value })} /></label>
          <label>Geschlecht
            <select value={player.gender} onChange={(e) => patchPlayer({ gender: e.target.value })}>
              <option>Herren</option><option>Damen</option><option>Divers</option>
            </select>
          </label>
          <label>Handicap<input value={player.handicap} onChange={(e) => patchPlayer({ handicap: e.target.value })} /></label>
          <label>Bevorzugter Abschlag
            <select value={player.preferredTee} onChange={(e) => patchPlayer({ preferredTee: e.target.value })}>
              <option>Gelb</option><option>Rot</option><option>Grün</option>
            </select>
          </label>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div><span className="eyebrow">What's in your bag</span><h2>Schläger & Distanzen</h2></div>
          <button className="small" onClick={addClub}><Plus size={15} /> Hinzufügen</button>
        </div>
        <div className="bag-legend"><span>Schläger</span><span>Carry</span><span>Total</span></div>
        <div className="bag-list">
          {player.bag.map((b) => (
            <div className="bag-row" key={b.id}>
              <input value={b.club} onChange={(e) => updateBag(b.id, { club: e.target.value })} />
              <input type="number" value={b.carry} onChange={(e) => updateBag(b.id, { carry: Number(e.target.value) })} />
              <input type="number" value={b.total} onChange={(e) => updateBag(b.id, { total: Number(e.target.value) })} />
              <button onClick={() => removeClub(b.id)}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StrategyInput({ label, value, onChange }) {
  return (
    <label className="strategy-input">
      <span>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Stat({ label, value }) {
  return <div className="stat"><strong>{value}</strong><span>{label}</span></div>;
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")).render(<App />);
