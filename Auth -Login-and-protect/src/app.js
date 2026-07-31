const express = require("express");

function createApp() {
  const app = express();
  app.use(express.json());

  // Health check so anyone can confirm the API is alive without auth.
  app.get("/", (req, res) => {
    res.json({ message: "Auth API is running" });
  });

  return app;
}

module.exports = { createApp };
