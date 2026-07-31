const { Router } = require("express");
const { supabase } = require("../config");

const router = Router();

/**
 * POST /auth/signup
 * Registers a new user via Supabase Auth.
 * 400 if email/password are missing, 201 + user object on success.
 */
router.post("/signup", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    // Supabase may already know this email, or the password is too weak.
    // error.status is only set for real GoTrue API errors — if it is missing
    // the IdP was unreachable (e.g. network failure), which is a 500, not a 400.
    if (error.status) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Unable to reach Supabase Auth" });
  }

  return res.status(201).json({ user: data.user });
});

/**
 * POST /auth/login
 * Authenticates a user and returns the JWT (access token) + refresh token.
 * 400 if fields missing, 401 on bad credentials, 200 + tokens on success.
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Wrong password / unknown email surfaces as a GoTrue API error (status 400)
    // — map it to 401 without leaking whether the email exists.
    if (error.status) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }
    // No status means the IdP itself was unreachable — that's a server fault.
    return res.status(500).json({ error: "Unable to reach Supabase Auth" });
  }

  return res.status(200).json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});

module.exports = router;
