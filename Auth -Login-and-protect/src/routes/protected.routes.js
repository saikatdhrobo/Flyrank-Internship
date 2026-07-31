const { Router } = require("express");
const { requireAuth } = require("../middleware/auth.middleware");

const router = Router();

// Every route in this file is locked behind the middleware guard.
router.use(requireAuth);

/**
 * GET /protected/profile
 * Returns the authenticated user's secure metadata.
 */
router.get("/profile", (req, res) => {
  const { id, email, created_at } = req.user;
  return res.status(200).json({ id, email, created_at });
});

/**
 * GET /protected/dashboard
 * A second protected route to prove the middleware is reusable.
 */
router.get("/dashboard", (req, res) => {
  return res.status(200).json({
    message: `Welcome back, ${req.user.email}!`,
    user_id: req.user.id,
  });
});

module.exports = router;
