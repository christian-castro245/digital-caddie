// src/golfcourseapi.js
// Ruft nicht mehr direkt api.golfcourseapi.com auf,
// sondern unseren eigenen Vercel-Proxy unter /api/golf
// → kein CORS-Problem, Key bleibt serverseitig

const PROXY = "/api/golf";

// ── Cache-Schicht (localStorage) ──────────────────────
const CACHE_PREFIX = "gcapi_";
const CACHE_TTL = {
  search: 60 * 60 * 1000,           // 1 Stunde
  course: 7 * 24 * 60 * 60 * 1000,  // 7 Tage
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
  catch { /* storage voll */ }
}

// ── HTTP-Helper ────────────────────────────────────────
async function proxyFetch(params) {
  const url = PROXY + "?" + new URLSearchParams(params).toString();
  const res  = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Fehler ${res.status}`);
  return data;
}

// ── Yards → Meter ──────────────────────────────────────
function yardsToM(yards) { return Math.round(yards * 0.9144); }
function smartConvert(yards, holes = 18) {
  const perHole = yards / holes;
  if (perHole < 250) return yards; // schon Meter
  return yardsToM(yards);
}

// ── Normalizer: API-Format → App-Format ───────────────
export function normalizeApiCourse(apiCourse) {
  const maleTees   = apiCourse.tees?.male   || [];
  const femaleTees = apiCourse.tees?.female || [];

  const pickTee = (tees, prefer = ["yellow","gelb","white","weiß","blue","blau"]) => {
    if (!tees.length) return null;
    const found = tees.find(t => prefer.some(p => t.tee_name?.toLowerCase().includes(p)));
    return found || tees.reduce((a, b) => (a.total_yards||0) > (b.total_yards||0) ? a : b);
  };

  const menTee   = pickTee(maleTees);
  const womenTee = pickTee(femaleTees, ["red","rot"]) || pickTee(femaleTees);

  const menHoles   = menTee?.holes   || [];
  const womenHoles = womenTee?.holes || [];
  const holeCount  = Math.max(menHoles.length, womenHoles.length, 18);

  const menTotal   = menTee   ? smartConvert(menTee.total_yards   || 0, holeCount) : 0;
  const womenTotal = womenTee ? smartConvert(womenTee.total_yards || 0, holeCount) : 0;

  const holes = Array.from({ length: holeCount }, (_, i) => {
    const mh = menHoles[i]   || {};
    const wh = womenHoles[i] || {};
    const menM   = mh.yardage > 50 ? (mh.yardage < 220 ? mh.yardage : yardsToM(mh.yardage)) : 0;
    const womenM = wh.yardage > 50 ? (wh.yardage < 220 ? wh.yardage : yardsToM(wh.yardage)) : 0;
    return {
      n: i + 1, par: mh.par || wh.par || 4, hcp: mh.handicap || wh.handicap || (i + 1),
      men: menM, women: womenM,
      green: null, layups: [],
      gps: { lat: apiCourse.location?.latitude || 51.0, lng: apiCourse.location?.longitude || 9.0, zoom: 16 },
      risk: "", tip: "", description: "", svgPath: null,
      svgTee: [100, 455], svgGreen: [100, 42], svgHazards: [],
    };
  });

  return {
    _apiId: apiCourse.id, _source: "api", _fetchedAt: Date.now(),
    clubName:   apiCourse.club_name   || "Unbekannter Club",
    courseName: apiCourse.course_name || "Hauptplatz",
    city:    apiCourse.location?.city    || "",
    country: apiCourse.location?.country || "",
    gps: { lat: apiCourse.location?.latitude || 51.0, lng: apiCourse.location?.longitude || 9.0, zoom: 15 },
    parTotal:   menTee?.par_total || holes.reduce((s, h) => s + h.par, 0),
    menTotal, womenTotal,
    slope: { men: menTee?.slope_rating || null, women: womenTee?.slope_rating || null },
    cr:    { men: menTee?.course_rating || null, women: womenTee?.course_rating || null },
    tees: {
      male:   maleTees.map(t => ({ name: t.tee_name, slope: t.slope_rating, cr: t.course_rating, meters: smartConvert(t.total_yards||0, holeCount) })),
      female: femaleTees.map(t => ({ name: t.tee_name, slope: t.slope_rating, cr: t.course_rating, meters: smartConvert(t.total_yards||0, holeCount) })),
    },
    holes,
  };
}

// ── Öffentliche Funktionen ─────────────────────────────

export async function searchCourses(query) {
  if (!query?.trim()) return [];
  const cacheKey = `search_${query.toLowerCase().trim()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const json    = await proxyFetch({ type: "search", q: query.trim() });
  const results = (json.courses || []).map(c => ({
    id: c.id, clubName: c.club_name, courseName: c.course_name,
    city: c.location?.city || "", country: c.location?.country || "",
    lat: c.location?.latitude, lng: c.location?.longitude,
  }));

  cacheSet(cacheKey, results, CACHE_TTL.search);
  return results;
}

export async function fetchCourse(id) {
  const cacheKey = `course_${id}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const json       = await proxyFetch({ type: "course", id });
  const normalized = normalizeApiCourse(json);
  cacheSet(cacheKey, normalized, CACHE_TTL.course);
  return normalized;
}

export function invalidateCourse(id) {
  localStorage.removeItem(CACHE_PREFIX + `course_${id}`);
}
