import { defaultPlayer } from "./data/courseData";

const KEY = "kuhlendahl-mvp-state-v1";

export const initialState = {
  player: defaultPlayer,
  selectedHole: 6,
  notes: [
    {
      id: "seed-1",
      hole: 6,
      date: "2024-05-23",
      mode: "Proberunde",
      club: "3W",
      distance: "195",
      lie: "Fairway",
      text: "3W vom Tee war ideal. Wasser links kommt schneller ins Spiel als gedacht. Naechstes Mal Layup konservativ halten."
    },
    {
      id: "seed-2",
      hole: 6,
      date: "2024-04-11",
      mode: "Live-Runde",
      club: "Hybrid",
      distance: "180",
      lie: "Fairway",
      text: "Hybrid-Layup funktioniert gut. Gruen vorne links wirkt erreichbar, aber Miss links vermeiden."
    }
  ],
  strategies: {
    "6": {
      teeShot: "3W auf ca. 195 m in die sichere Fairway-Zone.",
      layup: "Hybrid 180 m vor dem Wasser halten.",
      approach: "PW oder kurzes Eisen, lieber Mitte Gruen als Fahne."
    }
  }
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : initialState;
  } catch {
    return initialState;
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(KEY);
  return initialState;
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kuhlendahl-mvp-daten.json";
  a.click();
  URL.revokeObjectURL(url);
}
