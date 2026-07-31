const path = require("path");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const authRoutes = require("./routes/auth.routes");
const publicRoutes = require("./routes/public.routes");
const protectedRoutes = require("./routes/protected.routes");

// OpenAPI 3.0 spec — describes every route and its auth requirements.
const openapiSpec = require(path.join(__dirname, "openapi.json"));

function createApp() {
  const app = express();
  app.use(express.json());

  // Health check so anyone can confirm the API is alive without auth.
  app.get("/", (req, res) => {
    res.json({ message: "Auth API is running" });
  });

  // Interactive API docs with a working "Authorize" bearer-token padlock.
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // Open auth routes: sign up and log in.
  app.use("/auth", authRoutes);

  // Open gate: no authentication needed.
  app.use("/public", publicRoutes);

  // Locked gate: requires a bearer token.
  app.use("/protected", protectedRoutes);

  return app;
}

module.exports = { createApp };
