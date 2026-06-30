// POST /api/quiz-result — record a completed quiz's score for a lead.
//
// Called by the quiz page (public) after the visitor finishes, with the lead
// id returned from /api/lead. Pass/fail is recomputed server-side from the
// score (the client's flag is never trusted), and the result is write-once:
// it only fills in a row whose score is still null, so a finished quiz can't
// be overwritten by a later request.

const { readJson, supabase, supabaseConfigured } = require("../lib/server");

var COUNT = 10; // questions per quiz
var PASS = 6;   // passing score

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  if (!supabaseConfigured()) { res.status(500).json({ error: "Server not configured." }); return; }
  try {
    var body = await readJson(req);
    var id = parseInt(body.id, 10);
    var score = parseInt(body.score, 10);
    if (!isFinite(id) || id <= 0) { res.status(400).json({ error: "Invalid id." }); return; }
    if (!isFinite(score) || score < 0 || score > COUNT) { res.status(400).json({ error: "Invalid score." }); return; }

    var passed = score >= PASS;
    var r = await supabase("quiz_leads?id=eq." + id + "&score=is.null", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ score: score, passed: passed, completed_at: new Date().toISOString() })
    });
    if (!r.ok) {
      var detail = await r.text().catch(function () { return ""; });
      console.error("quiz-result update failed:", r.status, detail);
      res.status(502).json({ error: "Could not save result." });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("quiz-result handler error:", e);
    res.status(500).json({ error: "Unexpected error." });
  }
};
