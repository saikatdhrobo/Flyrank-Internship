const { Router } = require("express");
const { supabase } = require("../config");

const router = Router();

/**
 * Extracts the bearer token from the Authorization header.
 * Returns null when the header is missing or malformed.
 */
function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/**
 * GET /protected/profile
 * Stage 3: verifies the bearer token against Supabase and, on success,
 * returns the user's secure metadata (id, email, created_at).
 */
router.get("/profile", async (req, res) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  // The guard inspects the pass: getUser() asks Supabase to validate the JWT.
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    // Expired, tampered with, or otherwise invalid token (real GoTrue error
    // carries a status). A missing status means the IdP was unreachable.
    if (error.status) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    return res.status(500).json({ error: "Unable to reach Supabase Auth" });
  }

  const { id, email, created_at } = data.user;
  return res.status(200).json({ id, email, created_at });
});

module.exports = router;
