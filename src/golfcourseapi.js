// golfcourseapi.js
// Adapter für https://api.golfcourseapi.com
// Auth-Header: "Authorization: Key <your_key>"  (nicht Bearer!)
// Distanzen kommen in Yards → wir konvertieren zu Metern

const BASE = "https://api.golfcourseapi.com/v1";
const YARDS_TO_M = 0.9144;

// API-Key kommt aus Vite-Env-Variable (niemals hart im Code)
// .env.local  →  VITE_GOLF_API_KEY=dein_key
// Vercel      →  Settings → Environment Variables → VITE_GOLF_API_KEY
const getKey = () => import.meta.env.VITE_GOLF_API_KEY || "";

// ─── Cache-Schicht (localStorage) ─────────────────────
// Schont das Free-Tier-Limit (300 Req/Tag)
const CACHE_PREFIX = "gcapi_";
const CACHE_TTL = {
  search: 60 * 60 * 1000,          // 1 Stunde
  course: 7 * 24 * 60 * 60 * 1000, // 7 Tage
};

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, ts, ttl } = JSON.parse(raw);
    if (Date.now() - ts > ttl) { localStorage.removeItem(CACHE_PREFIX + key); return null; }
    return data;
  } catch { return null; }
}

function cacheSet(key, data, ttl) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now(), ttl })); }
  catch { /* storage voll – ignorieren */ }
}

// ─── HTTP-Helper ───────────────────────────────────────
async function apiFetch(path) {
  const key = getKey();
  if (!key) throw new Error("VITE_GOLF_API_KEY fehlt – bitte in .env.local setzen");

  const res = await fetch(`${BASE}${path}`, {
    headers: { "Authorization": `Key ${key}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API-Fehler ${res.status}`);
  }
  return res.json();
}

// ─── Yards → Meter Konvertierung ───────────────────────
// Heuristik: Wenn Gesamtdistanz < 4500 "yards", sind es wahrscheinlich
// schon Meter (manche EU-Kurse werden falsch eingetragen).
function yardsToM(yards) {
  return Math.round(yards * YARDS_TO_M);
}

function smartConvert(yardageTotal, holesCount = 18) {
  // Typischer 18-Loch-Platz: 5000–7500 yards ODER 4500–6800 meter
  // Wenn Wert < 4500 pro 18 Löcher → wahrscheinlich schon Meter
  const perHole = yardageTotal / holesCount;
  if (perHole < 250) return yardageTotal; // schon Meter
  return yardsToM(yardageTotal);
}

// ─── Normalizer: API-Format → App-Format ───────────────
export function normalizeApiCourse(apiCourse) {
  // Bestes Tee für Herren finden (längster Tee = Champion/Blue/Yellow)
  const maleTees  = apiCourse.tees?.male  || [];
  const femaleTees = apiCourse.tees?.female || [];

  // Gelb/Yellow bevorzugen, sonst längster
  const pickTee = (tees, prefer = ["yellow", "gelb", "white", "weiß"]) => {
    if (!tees.length) return null;
    const found = tees.find(t => prefer.some(p => t.tee_name?.toLowerCase().includes(p)));
    return found || tees.reduce((a, b) => (a.total_yards || 0) > (b.total_yards || 0) ? a : b);
  };

  const menTee    = pickTee(maleTees);
  const womenTee  = pickTee(femaleTees, ["red", "rot"]) || pickTee(femaleTees);

  const menHoles    = menTee?.holes   || [];
  const womenHoles  = womenTee?.holes || [];
  const holesCount  = Math.max(menHoles.length, womenHoles.length, 18);

  const menTotal    = menTee    ? smartConvert(menTee.total_yards   || 0, holesCount) : 0;
  const womenTotal  = womenTee  ? smartConvert(womenTee.total_yards || 0, holesCount) : 0;
  const perHoleMen  = menTotal / holesCount;

  // Für jede Bahn: par, yardage, handicap
  const holes = Array.from({ length: holesCount }, (_, i) => {
    const mh = menHoles[i]   || {};
    const wh = womenHoles[i] || {};

    // Distanz: wenn per-hole yardage vernünftig, konvertieren
    const menYards   = mh.yardage || 0;
    const womenYards = wh.yardage || 0;

    // Gleiche Heuristik: <200 pro Bahn → wahrscheinlich schon Meter
    const menM   = menYards   > 50  ? (menYards   < 220 ? menYards   : yardsToM(menYards))   : 0;
    const womenM = womenYards > 50  ? (womenYards < 220 ? womenYards : yardsToM(womenYards)) : 0;

    return {
      n:      i + 1,
      par:    mh.par    || wh.par    || 4,
      hcp:    mh.handicap || wh.handicap || (i + 1),
      men:    menM,
      women:  womenM,
      // Felder die die API nicht liefert → Platzhalter
      green:  null,
      layups: [],
      gps:    {
        lat:  apiCourse.location?.latitude  || 0,
        lng:  apiCourse.location?.longitude || 0,
        zoom: 16,
      },
      risk:        "",
      tip:         "",
      description: "",
      svgPath:     null,
      svgTee:      [100, 455],
      svgGreen:    [100, 42],
      svgHazards:  [],
    };
  });

  return {
    // Metadaten
    _apiId:      apiCourse.id,
    _source:     "api",
    _fetchedAt:  Date.now(),

    // Platz-Infos
    clubName:    apiCourse.club_name   || "Unbekannter Club",
    courseName:  apiCourse.course_name || "Hauptplatz",
    city:        apiCourse.location?.city    || "",
    country:     apiCourse.location?.country || "",
    gps: {
      lat:  apiCourse.location?.latitude  || 51.0,
      lng:  apiCourse.location?.longitude ||  9.0,
      zoom: 15,
    },

    // Scorecard-Kennzahlen
    parTotal:   menTee?.par_total       || holes.reduce((s, h) => s + h.par, 0),
    menTotal:   menTotal,
    womenTotal: womenTotal,
    slope: {
      men:   menTee?.slope_rating   || null,
      women: womenTee?.slope_rating || null,
    },
    cr: {
      men:   menTee?.course_rating   || null,
      women: womenTee?.course_rating || null,
    },

    // Alle Tees (für Info-Panel)
    tees: {
      male:   maleTees.map(t => ({
        name:   t.tee_name,
        slope:  t.slope_rating,
        cr:     t.course_rating,
        meters: smartConvert(t.total_yards || 0, holesCount),
      })),
      female: femaleTees.map(t => ({
        name:   t.tee_name,
        slope:  t.slope_rating,
        cr:     t.course_rating,
        meters: smartConvert(t.total_yards || 0, holesCount),
      })),
    },

    holes,
  };
}

// ─── Öffentliche API-Funktionen ────────────────────────

/**
 * Kurssuche – gibt normalisierte Ergebnisliste zurück
 * Cached für 1 Stunde
 */
export async function searchCourses(query) {
  if (!query?.trim()) return [];
  const cacheKey = `search_${query.toLowerCase().trim()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const json = await apiFetch(`/search?search_query=${encodeURIComponent(query.trim())}`);
  const results = (json.courses || []).map(c => ({
    id:         c.id,
    clubName:   c.club_name,
    courseName: c.course_name,
    city:       c.location?.city    || "",
    country:    c.location?.country || "",
    lat:        c.location?.latitude,
    lng:        c.location?.longitude,
  }));

  cacheSet(cacheKey, results, CACHE_TTL.search);
  return results;
}

/**
 * Vollständige Kursdaten inkl. Scorecard
 * Cached für 7 Tage
 */
export async function fetchCourse(id) {
  const cacheKey = `course_${id}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const json = await apiFetch(`/courses/${id}`);
  const normalized = normalizeApiCourse(json);
  cacheSet(cacheKey, normalized, CACHE_TTL.course);
  return normalized;
}

/**
 * Cache für einen Kurs manuell leeren (für "Neu laden"-Button)
 */
export function invalidateCourse(id) {
  localStorage.removeItem(CACHE_PREFIX + `course_${id}`);
}

/**
 * API-Key testen – gibt true/false zurück
 */
export async function testApiKey() {
  try {
    await apiFetch("/search?search_query=test");
    return true;
  } catch { return false; }
}
