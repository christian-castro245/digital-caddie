// api/golf.js
// Vercel Serverless Function – Proxy für GolfCourseAPI
// Liegt im Root-Ordner unter api/golf.js
// Key wird serverseitig aus process.env.GOLF_API_KEY gelesen (kein VITE_ prefix nötig)

const BASE = "https://api.golfcourseapi.com/v1";

export default async function handler(req, res) {
  // CORS-Header damit der Browser den Response akzeptiert
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const apiKey = process.env.GOLF_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GOLF_API_KEY nicht gesetzt (Vercel Environment Variables)" });
  }

  const { type, q, id } = req.query;

  let url;
  if (type === "search" && q) {
    url = `${BASE}/search?search_query=${encodeURIComponent(q)}`;
  } else if (type === "course" && id) {
    url = `${BASE}/courses/${id}`;
  } else {
    return res.status(400).json({ error: "Parameter fehlen: type=search&q=... oder type=course&id=..." });
  }

  try {
    const apiRes = await fetch(url, {
      headers: { "Authorization": `Key ${apiKey}` },
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return res.status(apiRes.status).json(data);
    }

    // Cache-Header: Suche 1h, Kursdaten 7 Tage
    const maxAge = type === "search" ? 3600 : 604800;
    res.setHeader("Cache-Control", `s-maxage=${maxAge}, stale-while-revalidate`);

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Proxy-Fehler: " + err.message });
  }
}
