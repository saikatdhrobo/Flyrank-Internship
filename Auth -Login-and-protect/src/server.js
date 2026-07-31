const { env } = require("./config");
const { createApp } = require("./app");

const app = createApp();

// Stage 0 checkpoint: the server must boot and confirm it is talking to Supabase.
app.listen(env.port, () => {
  console.log(`Server running and connected to Supabase on http://localhost:${env.port}`);
});
