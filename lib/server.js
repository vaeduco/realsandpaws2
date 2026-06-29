// Shared server-side helpers for the RealAndPaws API functions.
// This file lives OUTSIDE /api, so Vercel does NOT expose it as an endpoint —
// it is only bundled into the functions that require() it. Zero npm deps:
// just the Node "crypto" builtin and the global fetch.

const crypto = require("crypto");

const SESSION_COOKIE = "rap_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// Read and JSON-parse a request body (works whether or not Vercel pre-parsed it).
function readJson(req) {
  return new Promise(function (resolve) {
    if (req.body && typeof req.body === "object") { resolve(req.body); return; }
    var raw = "";
    req.on("data", function (c) {
      raw += c;
      if (raw.length > 10000) { req.destroy(); resolve({}); } // cap body size (defense-in-depth)
    });
    req.on("end", function () {
      if (!raw) { resolve({}); return; }
      try { resolve(JSON.parse(raw)); } catch (e) { resolve({}); }
    });
    req.on("error", function () { resolve({}); });
  });
}

function getCookie(req, name) {
  var header = req.headers && req.headers.cookie;
  if (!header) return null;
  var parts = header.split(";");
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (p.indexOf(name + "=") === 0) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

function sign(data) {
  return crypto.createHmac("sha256", process.env.ADMIN_SECRET || "").update(String(data)).digest("hex");
}

// A session token is "<expiry-ms>.<hmac(expiry)>" — unforgeable without ADMIN_SECRET.
function makeSession() {
  var exp = Date.now() + SESSION_TTL_MS;
  return exp + "." + sign(String(exp));
}

function verifySession(token) {
  if (!token || !process.env.ADMIN_SECRET) return false;
  var dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  var exp = token.slice(0, dot);
  var sig = token.slice(dot + 1);
  if (!safeEqual(sig, sign(exp))) return false;
  var expMs = parseInt(exp, 10);
  return !isNaN(expMs) && expMs > Date.now();
}

function isAuthed(req) {
  return verifySession(getCookie(req, SESSION_COOKIE));
}

function sessionCookie(value, maxAgeSec, secure) {
  var bits = [SESSION_COOKIE + "=" + value, "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=" + maxAgeSec];
  if (secure) bits.push("Secure");
  return bits.join("; ");
}

function isHttps(req) {
  return String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";
}

// Constant-time string comparison (guards against timing attacks on credentials).
function safeEqual(a, b) {
  var ab = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  try { return crypto.timingSafeEqual(ab, bb); } catch (e) { return false; }
}

function supabaseConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Call the Supabase REST (PostgREST) API with the service-role key (server only).
function supabase(path, opts) {
  opts = opts || {};
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  var headers = Object.assign({ apikey: key, Authorization: "Bearer " + key }, opts.headers || {});
  return fetch(process.env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + path, {
    method: opts.method || "GET",
    headers: headers,
    body: opts.body
  });
}

module.exports = {
  SESSION_COOKIE: SESSION_COOKIE,
  SESSION_TTL_MS: SESSION_TTL_MS,
  readJson: readJson,
  getCookie: getCookie,
  makeSession: makeSession,
  verifySession: verifySession,
  isAuthed: isAuthed,
  sessionCookie: sessionCookie,
  isHttps: isHttps,
  safeEqual: safeEqual,
  supabase: supabase,
  supabaseConfigured: supabaseConfigured
};
