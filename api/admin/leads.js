// GET /api/admin/leads — return all quiz leads (newest first), but ONLY for a
// request carrying a valid admin session cookie.

const { isAuthed, supabase, supabaseConfigured } = require("../../lib/server");

module.exports = async (req, res) => {
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }
  if (!isAuthed(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!supabaseConfigured()) { res.status(500).json({ error: "Server not configured." }); return; }
  try {
    var r = await supabase("quiz_leads?select=id,name,email,phone,created_at,score,passed&order=created_at.desc");
    if (!r.ok) { res.status(502).json({ error: "Could not load leads." }); return; }
    var data = await r.json();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ leads: Array.isArray(data) ? data : [] });
  } catch (e) {
    res.status(500).json({ error: "Unexpected error." });
  }
};
