const { Router } = require("express");

const router = Router();

/**
 * GET /public/info
 * Open endpoint — no authentication required.
 */
router.get("/info", (req, res) => {
  res.status(200).json({ message: "Welcome stranger! This info is public." });
});

module.exports = router;
