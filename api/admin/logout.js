// POST /api/admin/logout — clear the admin session cookie.

const { sessionCookie, isHttps } = require("../../lib/server");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  res.setHeader("Set-Cookie", sessionCookie("", 0, isHttps(req)));
  res.status(200).json({ ok: true });
};
