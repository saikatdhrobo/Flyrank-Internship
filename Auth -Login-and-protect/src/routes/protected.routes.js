const { Router } = require("express");

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
 * Stage 2: only checks that a bearer token was supplied — the token is
 * NOT verified yet (that happens in Stage 3).
 */
router.get("/profile", (req, res) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  // Stage 3 will replace this placeholder with real token verification.
  return res.status(200).json({ message: "Token present but not yet verified" });
});

module.exports = router;
