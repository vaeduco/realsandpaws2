// POST /api/admin/login — check credentials against env vars and, on success,
// set an HMAC-signed, HttpOnly session cookie.

const { readJson, makeSession, sessionCookie, isHttps, safeEqual, SESSION_TTL_MS } = require("../../lib/server");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  var U = process.env.ADMIN_USER, P = process.env.ADMIN_PASSWORD;
  if (!U || !P || !process.env.ADMIN_SECRET) { res.status(500).json({ error: "Admin login is not configured." }); return; }

  var body = await readJson(req);
  var user = String(body.username || "");
  var pass = String(body.password || "");

  // Evaluate both comparisons (no short-circuit) before deciding.
  var userOk = safeEqual(user, U);
  var passOk = safeEqual(pass, P);
  if (!(userOk && passOk)) { res.status(401).json({ error: "Invalid username or password." }); return; }

  var maxAge = Math.floor(SESSION_TTL_MS / 1000);
  res.setHeader("Set-Cookie", sessionCookie(makeSession(), maxAge, isHttps(req)));
  res.status(200).json({ ok: true });
};
