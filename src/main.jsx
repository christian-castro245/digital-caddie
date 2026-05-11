import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import { Flag, MapPin, NotebookPen, User, Save, Download, Upload, RotateCcw, Plus, Trash2, Target, Trees, Waves, ShieldCheck, Pencil } from "lucide-react";
import { course } from "./data/courseData";
import { exportState, loadState, resetState, saveState } from "./storage";
import "./styles.css";

function App() {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState("course");

  useEffect(() => saveState(state), [state]);

  const selectedHole = useMemo(() => course.holes.find((h) => h.n === state.selectedHole) || course.holes[0], [state.selectedHole]);

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
        <div className="brand"><div className="brand-mark"><Flag size={22} /></div><div><strong>Proberunde MVP</strong><span>Gut Kuhlendahl</span></div></div>
        <nav className="nav">
          <button className={view === "course" ? "active" : ""} onClick={() => setView("course")}><MapPin /> Platz</button>
          <button className={view === "strategy" ? "active" : ""} onClick={() => setView("strategy")}><Target /> Strategie</button>
          <button className={view === "live" ? "active" : ""} onClick={() => setView("live")}><NotebookPen /> Live-Notizen</button>
          <button className={view === "profile" ? "active" : ""} onClick={() => setView("profile")}><User /> Profil & Bag</button>
        </nav>
        <div className="side-card"><span className="eyebrow">Aktuelle Bahn</span><strong>Bahn {selectedHole.n}</strong><p>Par {selectedHole.par} · HCP {selectedHole.hcp} · {selectedHole.men} m Gelb</p></div>
        <div className="side-actions">
          <button onClick={() => exportState(state)}><Download size={16} /> Export JSON</button>
          <label className="file-button"><Upload size={16} /> Import JSON<input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} /></label>
          <button onClick={() => setState(resetState())}><RotateCcw size={16} /> Reset lokal</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar"><div><span className="eyebrow">Digitale Proberunde ohne Backend</span><h1>{course.clubName}</h1></div><div className="pill">localStorage aktiv</div></header>
        <HolePicker selected={state.selectedHole} onSelect={(n) => setState((s) => ({ ...s, selectedHole: n }))} />
        {view === "course" && <CourseView selectedHole={selectedHole} setView={setView} />}
        {view === "strategy" && <StrategyView hole={selectedHole} strategy={state.strategies[selectedHole.n]} updateStrategy={updateStrategy} />}
        {view === "live" && <LiveView hole={selectedHole} notes={state.notes.filter((n) => n.hole === selectedHole.n)} addNote={addNote} deleteNote={deleteNote} player={state.player} />}
        {view === "profile" && <ProfileView player={state.player} patchPlayer={patchPlayer} setState={setState} />}
      </main>
    </div>
  );
}

function HolePicker({ selected, onSelect }) {
  return <div className="hole-picker">{course.holes.map((h) => <button key={h.n} className={selected === h.n ? "selected" : ""} onClick={() => onSelect(h.n)}>{h.n}</button>)}</div>;
}

function CourseView({ selectedHole, setView }) {
  return <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid two">
    <div className="panel"><div className="panel-head"><div><span className="eyebrow">Platzuebersicht</span><h2>{course.courseName}</h2></div><span className="pill">Par {course.parTotal}</span></div><CourseMap selected={selectedHole.n} /><div className="stats"><Stat label="Bahnen" value="18" /><Stat label="Herren" value={`${course.menTotal} m`} /><Stat label="Damen" value={`${course.womenTotal} m`} /><Stat label="Par-3" value={`${course.par3Total} m`} /></div></div>
    <div className="panel"><div className="panel-head"><div><span className="eyebrow">Scorecard</span><h2>Alle Bahnen</h2></div></div><div className="hole-list">{course.holes.map((h) => <button key={h.n} className={h.n === selectedHole.n ? "hole-row active" : "hole-row"} onClick={() => setView("strategy")}><b>{h.n}</b><span>Par {h.par} · HCP {h.hcp}</span><em>{h.men} m</em></button>)}</div></div>
  </motion.section>;
}

function StrategyView({ hole, strategy, updateStrategy }) {
  const s = strategy || { teeShot: hole.par === 3 ? "Schlaeger auf Gruenmitte waehlen." : "Sichere Landezone vom Tee auswaehlen.", layup: hole.par === 5 ? "Layup vor Risiko planen." : "Zweiter Schlag konservativ planen.", approach: "Gruenmitte bevorzugen. Miss-Seite bewusst waehlen." };
  return <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid two">
    <div className="panel strategy-visual"><div className="panel-head"><div><span className="eyebrow">Virtuelle Proberunde</span><h2>Bahn {hole.n}</h2></div><span className="pill">Par {hole.par} · HCP {hole.hcp}</span></div><HoleIllustration hole={hole} /><div className="risk-tags"><span><Waves size={16} /> {hole.risk}</span><span><Trees size={16} /> {hole.tip}</span><span><ShieldCheck size={16} /> Zielzone bewusst waehlen</span></div></div>
    <div className="panel"><div className="panel-head"><div><span className="eyebrow">Plan speichern</span><h2>Meine Strategie</h2></div></div><StrategyInput label="1. Abschlag" value={s.teeShot} onChange={(v) => updateStrategy(hole.n, { teeShot: v })} /><StrategyInput label="2. Layup / zweiter Schlag" value={s.layup} onChange={(v) => updateStrategy(hole.n, { layup: v })} /><StrategyInput label="3. Approach" value={s.approach} onChange={(v) => updateStrategy(hole.n, { approach: v })} /><div className="info-box"><Pencil size={18} /><p>Alles wird automatisch lokal gespeichert. Beim naechsten Oeffnen im selben Browser ist deine Strategie wieder da.</p></div></div>
  </motion.section>;
}

function LiveView({ hole, notes, addNote, deleteNote, player }) {
  const [form, setForm] = useState({ club: player.bag[0]?.club || "", distance: "", lie: "Fairway", text: "", mode: "Live-Runde" });
  function submit(e) { e.preventDefault(); if (!form.text.trim()) return; addNote({ ...form, hole: hole.n, date: new Date().toISOString().slice(0, 10) }); setForm((f) => ({ ...f, distance: "", text: "" })); }
  return <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid two">
    <div className="panel"><div className="panel-head"><div><span className="eyebrow">Live-Runde</span><h2>Bahn {hole.n}</h2></div><span className="pill">{hole.men} m Gelb</span></div><HoleStrip hole={hole} /><form onSubmit={submit} className="note-form"><div className="form-grid"><label>Schlaeger<select value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })}>{player.bag.map((b) => <option key={b.id}>{b.club}</option>)}</select></label><label>Laenge<input value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} placeholder="z.B. 185" /></label><label>Balllage<select value={form.lie} onChange={(e) => setForm({ ...form, lie: e.target.value })}><option>Fairway</option><option>Rough</option><option>Bunker</option><option>Penalty Area</option><option>Gruen</option></select></label><label>Modus<select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option>Live-Runde</option><option>Proberunde</option><option>Nach der Runde</option></select></label></div><label>Notiz<textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Was hast du gelernt? Welche Strategie beim naechsten Mal?" /></label><button className="primary"><Save size={18} /> Notiz speichern</button></form></div>
    <div className="panel"><div className="panel-head"><div><span className="eyebrow">Historie</span><h2>Notizen zu Bahn {hole.n}</h2></div></div><div className="notes">{notes.length === 0 && <p className="empty">Noch keine Notiz fuer diese Bahn.</p>}{notes.map((note) => <article key={note.id} className="note"><div><strong>{note.date}</strong><span>{note.mode} · {note.club} · {note.distance ? `${note.distance} m` : "ohne Laenge"} · {note.lie}</span></div><p>{note.text}</p><button onClick={() => deleteNote(note.id)}><Trash2 size={16} /></button></article>)}</div></div>
  </motion.section>;
}

function ProfileView({ player, patchPlayer, setState }) {
  function updateBag(id, patch) { setState((s) => ({ ...s, player: { ...s.player, bag: s.player.bag.map((b) => b.id === id ? { ...b, ...patch } : b) } })); }
  function addClub() { setState((s) => ({ ...s, player: { ...s.player, bag: [...s.player.bag, { id: crypto.randomUUID(), club: "Neuer Schlaeger", carry: 100, total: 110 }] } })); }
  function removeClub(id) { setState((s) => ({ ...s, player: { ...s.player, bag: s.player.bag.filter((b) => b.id !== id) } })); }
  return <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid two"><div className="panel"><div className="panel-head"><div><span className="eyebrow">Spielerprofil</span><h2>Basisdaten</h2></div></div><div className="profile-form"><label>Name<input value={player.name} onChange={(e) => patchPlayer({ name: e.target.value })} /></label><label>Koerpergroesse<input value={player.height} onChange={(e) => patchPlayer({ height: e.target.value })} /></label><label>Geschlecht / Kategorie<select value={player.gender} onChange={(e) => patchPlayer({ gender: e.target.value })}><option>Herren</option><option>Damen</option><option>Divers</option></select></label><label>Handicap<input value={player.handicap} onChange={(e) => patchPlayer({ handicap: e.target.value })} /></label><label>Bevorzugter Abschlag<select value={player.preferredTee} onChange={(e) => patchPlayer({ preferredTee: e.target.value })}><option>Gelb</option><option>Rot</option><option>Gruen</option></select></label></div></div><div className="panel"><div className="panel-head"><div><span className="eyebrow">What's in your bag</span><h2>Schlaegerlaengen</h2></div><button className="small" onClick={addClub}><Plus size={16} /> Hinzufuegen</button></div><div className="bag-list">{player.bag.map((b) => <div className="bag-row" key={b.id}><input value={b.club} onChange={(e) => updateBag(b.id, { club: e.target.value })} /><input type="number" value={b.carry} onChange={(e) => updateBag(b.id, { carry: Number(e.target.value) })} /><input type="number" value={b.total} onChange={(e) => updateBag(b.id, { total: Number(e.target.value) })} /><button onClick={() => removeClub(b.id)}><Trash2 size={16} /></button></div>)}<div className="bag-legend"><span>Schlaeger</span><span>Carry</span><span>Total</span></div></div></div></motion.section>;
}

function StrategyInput({ label, value, onChange }) { return <label className="strategy-input"><span>{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function Stat({ label, value }) { return <div className="stat"><strong>{value}</strong><span>{label}</span></div>; }
function CourseMap({ selected }) { const pos = [[58,25],[31,18],[36,27],[50,38],[78,43],[68,58],[48,73],[58,80],[69,70],[61,72],[43,53],[28,40],[35,66],[44,73],[25,67],[12,38],[22,13],[56,16]]; return <div className="course-map">{pos.map(([x,y],i)=><span key={i} className={selected===i+1?"active":""} style={{left:`${x}%`,top:`${y}%`}}>{i+1}</span>)}</div>; }
function HoleIllustration({ hole }) { return <div className="hole-illustration"><HoleSvg hole={hole} /></div>; }
function HoleStrip({ hole }) { return <div className="hole-strip"><HoleSvg hole={hole} wide /></div>; }
function HoleSvg({ hole, wide=false }) { return <svg viewBox={wide ? "0 0 420 140" : "0 0 190 460"} className="hole-svg"><rect width="100%" height="100%" fill="#dff0d0" />{Array.from({length: wide?45:60}).map((_,i)=><circle key={i} cx={(i*37)%(wide?420:190)} cy={(i*59)%(wide?140:460)} r={wide?4:6} fill="#14532d" opacity=".38" />)}{hole.risk.toLowerCase().includes("wasser") && (wide ? <ellipse cx="80" cy="86" rx="74" ry="25" fill="#38bdf8" opacity=".85" /> : <ellipse cx="36" cy="210" rx="30" ry="95" fill="#38bdf8" opacity=".85" />)}<path className="fairway" d={wide ? "M38 95 C110 42, 205 108, 382 36" : "M96 410 C125 320, 88 250, 120 172 C136 110, 103 74, 88 44"} /><path className="centerline" d={wide ? "M38 95 C110 42, 205 108, 382 36" : "M96 410 C125 320, 88 250, 120 172 C136 110, 103 74, 88 44"} />{wide ? <ellipse cx="382" cy="36" rx="32" ry="20" fill="#a7e56c" /> : <ellipse cx="88" cy="44" rx="36" ry="25" fill="#a7e56c" />} {wide ? <circle cx="392" cy="29" r="4" fill="#ef4444" /> : <circle cx="98" cy="35" r="4" fill="#ef4444" />}<ellipse cx={wide?250:58} cy={wide?60:100} rx="18" ry="8" fill="#f5e7b7" /><ellipse cx={wide?300:136} cy={wide?70:130} rx="18" ry="8" fill="#f5e7b7" /><circle cx={wide?42:96} cy={wide?96:410} r="6" fill="#eab308" /></svg>; }

createRoot(document.getElementById("root")).render(<App />);
