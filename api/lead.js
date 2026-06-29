// POST /api/lead — save a quiz lead (name, email, phone) to Supabase.
// The browser posts here BEFORE the quiz starts; this function writes to the
// quiz_leads table using the server-only service-role key (created_at defaults
// to now() in the database).

const { readJson, supabase, supabaseConfigured } = require("../lib/server");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  if (!supabaseConfigured()) { res.status(500).json({ error: "Server not configured." }); return; }
  try {
    var body = await readJson(req);
    var name = String(body.name || "").trim();
    var email = String(body.email || "").trim();
    var phone = String(body.phone || "").trim();

    if (!name || !email || !phone) { res.status(400).json({ error: "All fields are required." }); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { res.status(400).json({ error: "Invalid email address." }); return; }
    if (name.length > 200 || email.length > 200 || phone.length > 60) { res.status(400).json({ error: "Input too long." }); return; }

    var r = await supabase("quiz_leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ name: name, email: email, phone: phone })
    });
    if (!r.ok) { res.status(502).json({ error: "Could not save lead." }); return; }
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Unexpected error." });
  }
};
