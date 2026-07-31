const { supabase } = require("../config");

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
 * requireAuth — reusable guard for any protected route.
 *
 * Verifies the bearer token against Supabase. On success it stores the
 * verified user + token on req.user / req.token and calls next(); on any
 * failure it ends the request with 401 (or 500 if the IdP is unreachable)
 * so the route handler itself only ever runs for authenticated callers.
 */
async function requireAuth(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    // A real GoTrue rejection (status set) means the token is invalid/expired.
    // A missing status means the IdP itself was unreachable.
    if (error.status) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    return res.status(500).json({ error: "Unable to reach Supabase Auth" });
  }

  req.user = data.user;
  req.token = token;
  return next();
}

module.exports = { requireAuth, extractBearerToken };
